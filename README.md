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
- `src/lib/` — `supabaseClient.js`, `AuthContext.jsx`, um `xxxApi.js` por assunto (snake_case ↔ camelCase, `if (error) throw error`), `datas.js` (datas locais), `sintese.js` (resumo do período), `sinteseModulos.js` (frases, temas e sinais clínicos dos módulos) e `analises.js` (cálculos dos gráficos).
- `src/data/` — opções do check-in e do registro de pensamentos, textos legais, política de privacidade, `modulos.js` (catálogo dos módulos e protocolos: perguntas, condições `quando`, rótulos curtos e o questionário ligado), `escalas.js` (EPDS e GAD-7, pontuação, ponto de corte, frequência e `escalaPendente`) e `consulta.js` (dia e horário fixo da consulta, próxima sessão). As perguntas, para validação clínica, estão em [`docs/protocolos.md`](docs/protocolos.md).
- `src/components/` — `Pagina` (faixa petróleo + título), `Bloco` (cartão), `LayoutAcesso` (telas de entrada), campos e escolhas, `SeletorDeDia`, `AvisoCrise`, `BotaoAcao` (ação pequena dos cartões), `AnotacoesTopico` (o "Anotar" de cada tópico), `Graficos` (SVG próprio, sem biblioteca), `PerguntasModulo`, `AvisoQuestionario` (janela do questionário pendente), `CamposConsulta`, `Respiracao`.
- `src/pages/` — públicas: `/entrar`, `/definir-senha`, `/privacidade`. `src/pages/app/` — paciente. `src/pages/app/admin/` — painel da psicóloga.
- `supabase/migrations/` — histórico do banco (uma migration por mudança). `supabase/functions/` — Edge Functions.
- `public/logo-circulo.png` (logo redondo, cabeçalho) e `public/marca-cerebro.png` (cérebro do logo, tela de entrada).

## Telas
**Paciente** (navegação fixa embaixo no celular): Início · Check-in · Semana · Pensamentos · Meus dados (ícone de escudo no cabeçalho).
- Check-in diário em três blocos (como está, corpo, dia): humor, emoção, situações, ansiedade 0–10, sono (horas numa roda de rolagem, `RodaHorasSono`, de meia em meia hora), energia, movimento, acontecimento. Dias anteriores escolhidos numa lista e editáveis.
- Sequência de check-ins ("ofensiva", `src/components/Sequencia.jsx` + `src/lib/sequencia.js`): dias seguidos com check-in, últimos 7 dias em bolinhas e recorde, numa faixa discreta no Início e depois de salvar o check-in de hoje. Calculada no navegador a partir das datas dos check-ins (sem tabela nova). Continua viva até o fim do dia seguinte; quebrar a sequência gera recado acolhedor, nunca de cobrança.
- Check-in com módulos: cada módulo ligado pela psicóloga (tabagismo, álcool, puerpério, crise de ansiedade, bullying, luto, esgotamento no trabalho, insônia) entra como um cartão curto no check-in, com perguntas condicionais (`quando`). Ao salvar, mostra os dias sem fumar e, se for o caso, o aviso de crise em destaque.
- Início: "Check-in de hoje" com a sequência no rodapé do cartão, "Ansiedade forte agora?" (protocolo de crise), questionários pendentes (também numa janela com "Responder agora" e "Responder mais tarde", que volta no dia seguinte), objetivo da semana e registro de pensamentos.
- Crise (`/app/crise`): respiração guiada, aterramento 5-4-3-2-1 e registro da crise. Questionário (`/app/questionario/:tipo`): EPDS ou GAD-7.
- Semana: o objetivo da semana (só leitura: quem escreve é a psicóloga), percepção de avanço, avanços e dificuldades; objetivos terapêuticos numerados no fim. Semanas anteriores editáveis.
- Pensamentos (para todos): situação, pensamento, emoção (botões + "Outra"), intensidade, comportamento. Registros anteriores editáveis/apagáveis.
- Primeiro acesso: troca da senha provisória → consentimento LGPD (dois checkboxes gravados com data/hora).

**Admin**: lista de pacientes com busca por nome (ignora acentos), filtros Ativos / Precisam de atenção / Encerrados e ordenação pela **consulta mais próxima** (padrão), por nome ou sem check-in há mais tempo. Cada linha: nome, os 7 dias de check-in em pontos e a coluna "Consulta" à direita (hoje em destaque). "Precisam de atenção": sinais clínicos da semana em vermelho e primeiro (2 ou mais crises, item de risco da EPDS, pensamentos assustadores "muitas vezes", ameaça ou agressão na escola) e avisos administrativos em cinza (sem consentimento, pediu encerramento, sem check-in). Pedidos de privacidade no topo · Novo paciente (com dia e horário da consulta, semanal ou quinzenal, e módulos/questionários) · Alterar senha (`/app/admin/senha`) · página do paciente, com período de 7/14/30 dias ou "Escolher data" (um dia ou intervalo) e abas:
Resumo (números, síntese, temas para a sessão, "Anotar" em cada tópico) · Gráficos (evolução com média e tendência, padrões e o que aparece junto, sempre com o número de dias) · Detalhamento (tudo na íntegra, questionários item a item) · Protocolos (liga módulos e questionários, frequência e "Pedir agora"; crises registradas) · Objetivo da semana · Registro de pensamentos · Anotações clínicas, em duas sub-abas: Diário (linha do tempo com o diário clínico e as anotações do Resumo e dos Gráficos, busca e filtro por origem) e Ficha e tratamento (objetivos, medicações, combinados e ficha com a consulta).

A síntese (`src/lib/sintese.js`) é feita por regras fixas, sem IA: só descreve contagens e coincidências, nunca afirma causa. Ansiedade alta = 7/10 ou mais.

## Banco de dados
Projeto Supabase `bruna-sartori-checkin` (ref `qjkauulkxmezcuzondzj`, região São Paulo).

| Tabela | Conteúdo | Quem acessa |
|---|---|---|
| `profiles` | papel, nome, `modulos` e `escalas` (jsonb: módulos e questionários ligados), data de encerramento do acompanhamento (`registro_pensamentos_ativo` ficou sem uso) | paciente lê o seu e muda só o nome; Admin lê todos, liga/desliga módulos e questionários e encerra/reabre o acompanhamento |
| `consentimentos` | aceites (termos, dado de saúde), versão, data/hora, revogação | paciente cria/revoga os seus; Admin lê |
| `checkins` | um por dia: humor, emoção, situações, ansiedade 0–10, sono (horas numa roda de rolagem, `RodaHorasSono`, de meia em meia hora), energia, movimento, acontecimento e `modulos` (jsonb com as respostas dos módulos) | paciente; Admin só lê |
| `reflexoes_semanais` | percepção de avanço, avanços, dificuldades (o objetivo escrito pelo paciente foi removido em 29/10/2026, com o histórico) | paciente; Admin só lê |
| `questionarios` | EPDS ou GAD-7: respostas item a item e total (calculado no banco por gatilho) | paciente; Admin só lê |
| `questionarios_adiados` | "Responder mais tarde": até que dia o aviso fica escondido | só o paciente |
| `crises` | crises de ansiedade: quando, intensidade, duração, lugar, sintomas, o que fez, o que ajudou | paciente; Admin só lê |
| `registros_pensamento` | situação → pensamento → emoção → intensidade → comportamento | paciente; Admin só lê |
| `objetivos_terapeuticos` | objetivos gerais | Admin grava; paciente lê |
| `objetivos_semana` | combinado na sessão, um por semana | Admin grava; paciente lê |
| `fichas_pacientes` | e-mail, WhatsApp, início, **histórico**, `consulta` (jsonb: dia, hora, semanal/quinzenal, sessão de referência) | só Admin |
| `anotacoes_clinicas` | diário clínico | só Admin |
| `medicacoes` | nome, dose, como toma, prescritor, início/fim, observações | só Admin |
| `comentarios_resumo` | anotações da psicóloga por tópico do Resumo e dos Gráficos, datadas, com a `origem` legível | só Admin |
| `solicitacoes_privacidade` | pedidos de encerramento de conta | paciente cria/vê os seus; Admin vê e marca resolvido |

**Regras garantidas no banco (RLS + gatilhos)**
- Nenhum registro do paciente é gravado sem consentimento de dado de saúde vigente.
- Só a Admin muda módulos, questionários e o encerramento do acompanhamento (gatilho). O registro de pensamentos vale para todos (desde 29/10/2026).
- Respostas de questionário, crises e consulta têm formato conferido no banco (`check`).
- Funções auxiliares ficam no schema `private`, fora da API.
- Todas as regras foram testadas simulando paciente, outro paciente e Admin.

**Edge Function `criar-paciente`**: só a Admin chama. Cria a conta com senha provisória (`user_metadata.trocar_senha = true`), perfil (com módulos e questionários marcados), ficha (com a consulta) e objetivos; se algo falhar, apaga a conta criada.

**Tornar uma conta Admin**: criar o usuário em Authentication → Users → Add user → Create new user (e-mail, senha provisória, *Auto Confirm User*) — **conferir que é o projeto `qjkauulkxmezcuzondzj`**, já houve conta criada por engano em outro projeto. Depois, no SQL Editor:
```sql
update public.profiles set role = 'admin', nome = 'NOME' where id = (select id from auth.users where email = 'EMAIL');
-- obriga a trocar a senha provisória no primeiro acesso
update auth.users set raw_user_meta_data = raw_user_meta_data || '{"trocar_senha": true}' where email = 'EMAIL';
```

**Contas**
- Bruna (Admin real): `bru_sartori@hotmail.com`, criada em 14/10/2026 com senha provisória e troca obrigatória no primeiro acesso.
- Teste: Admin `loliveirafelpa@gmail.com` e paciente `loliveirafelpa+paciente@gmail.com` (dados simulados de 08 a 12/10/2026). Senhas fora do repositório. A Admin de teste vê dados reais: apagar ou trocar a senha antes do uso real.
- Definir a senha de uma conta direto no banco (SQL Editor, digitado por quem vai usar a senha — nunca em conversa ou no repositório):
  `update auth.users set encrypted_password = extensions.crypt('SENHA', extensions.gen_salt('bf')), updated_at = now() where email = 'EMAIL';`

## Privacidade (LGPD)
- `/privacidade`: política em linguagem simples (`src/data/politicaPrivacidade.js`; trechos com `VALIDAR` dependem da psicóloga).
- `/app/meus-dados`: baixar os dados (JSON, incluindo questionários e crises), revogar consentimento, apagar os próprios registros (check-ins, reflexões, pensamentos, questionários e crises) e pedir encerramento da conta.
- Termos na versão `2026-10-29` (o consentimento passou a citar hábitos; a política, os protocolos, questionários e crises). Consentimentos anteriores continuam vigentes.
- Registros profissionais da psicóloga (ficha, anotações, medicações) não são apagados pelo paciente (guarda mínima do CFP). O encerramento da conta é feito pela psicóloga a partir do pedido.

## Deploy
Publicado no Vercel desde 14/10/2026, ligado ao GitHub (`loliveirafelpa/brunasartori`): cada push na `main` publica sozinho. `vercel.json` faz o rewrite da SPA e define cabeçalhos de segurança (CSP libera Google Fonts e `*.supabase.co`).
- **Variáveis** (Settings → Environment Variables, com *Production* marcado): `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (chave publishable). Nome e valor em campos separados. O Vercel avisa que o prefixo `VITE_` expõe o valor ao navegador — é esperado para essas duas; nunca colocar a service role lá. Sem elas o app abre em branco (`createClient` falha); depois de mudar, fazer Redeploy sem cache.
- **Supabase → Authentication → URL Configuration**: Site URL = endereço do Vercel; Redirect URLs = `https://<endereço>/**` e `http://localhost:5180/**`. Necessário para o "Esqueci minha senha" (`/definir-senha`).
- A mensagem de boas-vindas do Novo paciente usa `window.location.origin`: cadastrar pacientes reais pelo site publicado, não pelo localhost.
- Domínio próprio: Vercel → Settings → Domains, e repetir o endereço na URL Configuration do Supabase.

## Falta
- Desligar o cadastro aberto no Supabase Auth (Authentication → Sign In / Providers).
- Apagar a Admin de teste ou trocar a senha dela.
- Conferir a URL Configuration do Supabase com o endereço publicado e testar o "Esqueci minha senha" no ar.
- Testar no ar a troca de senha da Admin e o encerrar/reabrir acompanhamento (publicados sem teste em navegador).
- Ligar a proteção contra senhas vazadas (Authentication; único aviso do advisor de segurança).
- `listarCheckinsDeTodos` (lista de pacientes) está sujeito ao limite de 1.000 linhas do Supabase: paginar ou agregar no banco quando passar de ~140 pacientes ativos.
- Excluir a conta de um paciente pelo painel (hoje é manual, no Supabase), respeitando a guarda dos registros profissionais.
- Retenção automática dos dados (aguardando prazo definido pela Bruna).
- Validar com a Bruna os trechos `VALIDAR` da política.
- Convite por e-mail (exige SMTP próprio, ex.: Resend) — hoje é senha provisória enviada pela psicóloga.
- Logo em arquivo vetorial para trocar as imagens recortadas.
- Validar com a Bruna as perguntas dos módulos (`docs/protocolos.md`).
- Ideias para depois: lembrete diário, frequência configurável do check-in por módulo.
