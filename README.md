# Check-in · Bruna Sartori Psicologia

App web de monitoramento entre sessões. Pacientes fazem check-ins curtos; a psicóloga (Admin) acompanha uma síntese antes de cada sessão. Visão de negócio em [`docs/visao-do-produto.md`](docs/visao-do-produto.md).

## Stack
React 18 + Vite + Tailwind 3 · react-router-dom · Supabase (Postgres, Auth, RLS, Edge Functions) · lucide-react · Vercel.

## Rodar localmente
```bash
npm install
cp .env.example .env.local   # preencher URL e chave pública do Supabase
npm run dev
```

## Organização
- `src/theme.js` — cores e fontes (únicos hex do projeto; o Tailwind lê daqui).
- `src/lib/` — `supabaseClient.js`, `AuthContext.jsx` e um `xxxApi.js` por assunto (snake_case ↔ camelCase).
- `src/data/` — opções do check-in, textos legais, versão dos termos.
- `src/pages/` — telas públicas (`/entrar`, `/definir-senha`); `src/pages/app/` — área logada; `src/pages/app/admin/` — painel da Admin.
- `supabase/migrations/` — histórico do banco.

## Banco de dados
Projeto Supabase `bruna-sartori-checkin` (ref `qjkauulkxmezcuzondzj`, região São Paulo).

| Tabela | Conteúdo |
|---|---|
| `profiles` | papel (`admin`/`paciente`), nome, módulo de registro de pensamentos ativo, data de encerramento |
| `consentimentos` | aceites de termos e de dado de saúde, com versão, data/hora e revogação |
| `checkins` | um por paciente por dia: humor, emoção, situações associadas, ansiedade (0–10), sono, energia, movimento (sim/não), acontecimento |
| `reflexoes_semanais` | percepção semanal sobre objetivos terapêuticos |
| `registros_pensamento` | situação → pensamento → emoção → intensidade → comportamento (TCC) |
| `fichas_pacientes` | e-mail, WhatsApp, início do acompanhamento e **histórico** — só a Admin lê e grava |
| `objetivos_terapeuticos` | objetivos gerais do paciente — Admin grava, paciente lê |
| `objetivos_semana` | objetivo combinado na sessão para cada semana — Admin grava, paciente lê |

**Regras garantidas no banco (RLS):**
- Paciente só vê e altera os próprios registros; a Admin lê todos mas não edita registros de pacientes.
- Nenhum registro clínico é gravado sem consentimento de dado de saúde vigente.
- Registro de pensamentos só é gravado se o módulo estiver ativo para o paciente.
- Paciente só pode alterar o próprio `nome` no perfil (papel e módulos não).
- Funções auxiliares ficam no schema `private`, fora da API.
- O histórico do paciente (`fichas_pacientes`) é invisível para o paciente, inclusive pela API.

**Edge Function `criar-paciente`** (`supabase/functions/criar-paciente`): só a Admin chama. Cria a conta com senha provisória (`user_metadata.trocar_senha = true`, troca obrigatória no primeiro acesso), perfil, ficha e objetivos; se algo falhar, apaga a conta criada.

**Tornar uma conta Admin** (uma vez, no SQL Editor do Supabase):
```sql
update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'EMAIL_DA_BRUNA');
```

## Deploy
GitHub (`loliveirafelpa/brunasartori`) conectado ao Vercel; cada push na `main` publica. Variáveis no Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. `vercel.json` faz o rewrite da SPA e define cabeçalhos de segurança.

## Pronto
- Login, definição de senha (convite/recuperação), consentimento LGPD em dois checkboxes gravados no banco.
- Check-in diário completo (Nível 1) com situações associadas (gatilhos, opcional) e aviso de crise.
- Reflexão semanal sobre objetivos (`/app/semana`).
- Registro de pensamentos (`/app/pensamentos`), visível só se o módulo estiver ativo para o paciente.
- Painel da Admin: lista de pacientes com adesão dos últimos 7 dias; página de cada paciente (`/app/admin/pacientes/:id`) com indicadores, síntese descritiva, temas sugeridos para a sessão, linha do tempo, registros de pensamento e reflexões; período de 7/14/30 dias; liga/desliga o registro de pensamentos.
- A síntese é gerada por regras fixas em `src/lib/sintese.js` (sem IA): só descreve contagens e coincidências, nunca afirma causa.

## Falta
- Desligar cadastro aberto no Supabase Auth (painel → Authentication).
- Convite por e-mail (exige SMTP próprio, ex.: Resend) — hoje é senha provisória enviada pela psicóloga.
- Hábitos e comportamentos (Nível 2) — aguardando conversa com a Bruna.
- Política de privacidade, exportar/apagar dados, revogar consentimento.
- Retenção de dados automática (aguardando prazo definido pela Bruna).
- Lembrete diário.
