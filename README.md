# Check-in · Bruna Sartori Psicologia

App web de acompanhamento entre sessões. O paciente registra check-ins curtos, reflexões semanais e registros de pensamento; a psicóloga (Admin) vê um resumo descritivo antes de cada sessão. Visão de negócio em [`docs/visao-do-produto.md`](docs/visao-do-produto.md).

## Stack
React 18 + Vite 6 + Tailwind 3 · react-router-dom 6 · Supabase (Postgres, Auth, RLS, Edge Functions) · lucide-react · Vercel.

## Rodar localmente
```bash
npm install
cp .env.example .env.local   # URL e chave pública (publishable) do Supabase
npm run dev -- --port 5180   # a 5173 costuma estar ocupada nesta máquina
```
Se o build reclamar de `@rollup/rollup-win32-x64-msvc`, o binário foi removido (provavelmente pelo antivírus): apague essa pasta em `node_modules/@rollup` e rode `npm install`.

## Organização
- `src/theme.js` — cores, fontes e sombra (únicos valores de cor do projeto; o Tailwind lê daqui). Fontes carregadas no `index.html`.
- `src/lib/` — `supabaseClient.js`, `AuthContext.jsx`, um `xxxApi.js` por assunto (snake_case ↔ camelCase, `if (error) throw error`) e `sintese.js` (resumo do período).
- `src/data/` — opções do check-in e do registro de pensamentos, textos legais, política de privacidade.
- `src/components/` — `Pagina` (faixa petróleo + título), `Bloco` (cartão), `LayoutAcesso` (telas de entrada), campos e escolhas, `SeletorDeDia`, `AvisoCrise`.
- `src/pages/` — públicas: `/entrar`, `/definir-senha`, `/privacidade`. `src/pages/app/` — paciente. `src/pages/app/admin/` — painel da psicóloga.
- `supabase/migrations/` — histórico do banco (uma migration por mudança). `supabase/functions/` — Edge Functions.
- `public/logo-circulo.png` (logo redondo, cabeçalho) e `public/marca-cerebro.png` (cérebro do logo, tela de entrada).

## Telas
**Paciente** (navegação fixa embaixo no celular): Início · Check-in · Semana · Pensamentos · Meus dados (ícone de escudo no cabeçalho).
- Check-in diário em três blocos (como está, corpo, dia): humor, emoção, situações, ansiedade 0–10, sono, energia, movimento, acontecimento. Dias anteriores escolhidos numa lista e editáveis.
- Semana: combinado na sessão (se houver) ou objetivo escrito pelo paciente, percepção de avanço, avanços e dificuldades; objetivos terapêuticos no fim. Semanas anteriores editáveis.
- Pensamentos (se ativo para o paciente): situação, pensamento, emoção (botões + "Outra"), intensidade, comportamento. Registros anteriores editáveis/apagáveis.
- Primeiro acesso: troca da senha provisória → consentimento LGPD (dois checkboxes gravados com data/hora).

**Admin**: lista de pacientes em linhas compactas, com busca por nome (ignora acentos), filtros Ativos / Precisam de atenção (sem consentimento, pediu encerramento ou sem check-in na semana) / Encerrados e ordenação por nome ou por check-in mais antigo; pedidos de privacidade no topo · Novo paciente · Alterar senha (`/app/admin/senha`, pede a senha atual; link "Senha" no cabeçalho) · página do paciente com abas:
Resumo (números, síntese por tópico, temas para a sessão, anotações da psicóloga por tópico) · Linha do tempo · Semana · Pensamentos · Ficha e objetivos (objetivos terapêuticos, combinados por semana com histórico, ficha com histórico) · Anotações clínicas (diário e medicações). Período de 7/14/30 dias.

A síntese (`src/lib/sintese.js`) é feita por regras fixas, sem IA: só descreve contagens e coincidências, nunca afirma causa. Ansiedade alta = 7/10 ou mais.

## Banco de dados
Projeto Supabase `bruna-sartori-checkin` (ref `qjkauulkxmezcuzondzj`, região São Paulo).

| Tabela | Conteúdo | Quem acessa |
|---|---|---|
| `profiles` | papel, nome, registro de pensamentos ativo, data de encerramento do acompanhamento | paciente lê o seu e muda só o nome; Admin lê todos, liga/desliga o módulo e encerra/reabre o acompanhamento |
| `consentimentos` | aceites (termos, dado de saúde), versão, data/hora, revogação | paciente cria/revoga os seus; Admin lê |
| `checkins` | um por dia: humor, emoção, situações, ansiedade 0–10, sono, energia, movimento, acontecimento | paciente; Admin só lê |
| `reflexoes_semanais` | objetivo do paciente, percepção de avanço, avanços, dificuldades | paciente; Admin só lê |
| `registros_pensamento` | situação → pensamento → emoção → intensidade → comportamento | paciente; Admin só lê |
| `objetivos_terapeuticos` | objetivos gerais | Admin grava; paciente lê |
| `objetivos_semana` | combinado na sessão, um por semana | Admin grava; paciente lê |
| `fichas_pacientes` | e-mail, WhatsApp, início, **histórico** | só Admin |
| `anotacoes_clinicas` | diário clínico | só Admin |
| `medicacoes` | nome, dose, como toma, prescritor, início/fim, observações | só Admin |
| `comentarios_resumo` | anotações da psicóloga por tópico do Resumo, datadas | só Admin |
| `solicitacoes_privacidade` | pedidos de encerramento de conta | paciente cria/vê os seus; Admin vê e marca resolvido |

**Regras garantidas no banco (RLS + gatilhos)**
- Nenhum registro do paciente é gravado sem consentimento de dado de saúde vigente.
- Registro de pensamentos só é gravado com o módulo ativo; só a Admin muda o módulo e o encerramento do acompanhamento (gatilho).
- Funções auxiliares ficam no schema `private`, fora da API.
- Todas as regras foram testadas simulando paciente, outro paciente e Admin.

**Edge Function `criar-paciente`**: só a Admin chama. Cria a conta com senha provisória (`user_metadata.trocar_senha = true`), perfil, ficha e objetivos; se algo falhar, apaga a conta criada.

**Tornar uma conta Admin** (SQL Editor do Supabase):
```sql
update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'EMAIL_DA_BRUNA');
```

**Contas de teste**: Admin `loliveirafelpa@gmail.com` e paciente `loliveirafelpa+paciente@gmail.com` (dados simulados de 08 a 12/10/2026). Senhas fora do repositório; trocar antes do uso real.

## Privacidade (LGPD)
- `/privacidade`: política em linguagem simples (`src/data/politicaPrivacidade.js`; trechos com `VALIDAR` dependem da psicóloga).
- `/app/meus-dados`: baixar os dados (JSON), revogar consentimento, apagar os próprios registros e pedir encerramento da conta.
- Registros profissionais da psicóloga (ficha, anotações, medicações) não são apagados pelo paciente (guarda mínima do CFP). O encerramento da conta é feito pela psicóloga a partir do pedido.

## Deploy
GitHub (`loliveirafelpa/brunasartori`) a ser conectado ao Vercel; cada push na `main` publica. Variáveis no Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. `vercel.json` faz o rewrite da SPA e define cabeçalhos de segurança (CSP libera Google Fonts e `*.supabase.co`).

## Falta
- Publicar no Vercel e testar no ar.
- Desligar o cadastro aberto no Supabase Auth (Authentication → Sign In / Providers).
- Trocar as senhas das contas de teste.
- Excluir a conta de um paciente pelo painel (hoje é manual, no Supabase), respeitando a guarda dos registros profissionais.
- Retenção automática dos dados (aguardando prazo definido pela Bruna).
- Validar com a Bruna os trechos `VALIDAR` da política.
- Convite por e-mail (exige SMTP próprio, ex.: Resend) — hoje é senha provisória enviada pela psicóloga.
- Logo em arquivo vetorial para trocar as imagens recortadas.
- Ideias para depois: lembrete diário, hábitos (Nível 2), alertas para a psicóloga.
