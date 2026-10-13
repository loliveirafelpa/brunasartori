# CLAUDE.md — LOF Check-in · Bruna Sartori

App de monitoramento entre sessões para a psicóloga **Bruna Sartori Caetano** (@bru_psico — psicologia clínica, TCC, neuropsicologia, atendimento online).
Dois perfis: **Admin** (Bruna) e **Paciente**. Contexto de produto em `docs/visao-do-produto.md`.

Para qualquer decisão maior, consultar o `playbook-tecnico.md` completo nesta pasta.

## Inegociáveis
- **Stack fixa:** React 18 + Vite + Tailwind, react-router-dom, Supabase (Postgres + Auth + RLS + Edge Functions), lucide-react, Vercel ligado ao GitHub. Sem TypeScript, testes automatizados ou Redux, salvo justificativa explícita.
- **Segurança via RLS:** toda tabela com dado de paciente tem RLS e políticas `_select_own`, `_insert_own`, `_update_own`, `_delete_own` usando `(select auth.uid()) = user_id`. Acesso da Admin via política própria baseada em papel — nunca só escondendo na interface.
- **Um único cliente Supabase** em `src/lib/supabaseClient.js`, só com a anon key. Service role e qualquer segredo só em Edge Function.
- **Migrations:** toda mudança de banco vira arquivo datado em `supabase/migrations/`.
- **LGPD (dado de saúde = dado sensível):** consentimento específico em checkbox separado, gravado no banco com data/hora; política de privacidade simples mencionando também o sigilo profissional; prazo de retenção aplicado de verdade no banco; paciente pode ver, exportar, apagar e revogar consentimento dentro do app.
- **Design:** cores e fontes só em `src/theme.js`. Nunca hex solto em componente.
- **Deploy:** GitHub → Vercel desde o início; `vercel.json` com rewrite SPA e cabeçalhos de segurança.

## Princípios do produto
- Linguagem **descritiva, nunca causal**: o app organiza e sugere temas de conversa, não afirma relações de causa nem dá diagnósticos.
- Check-in curto (< 1 minuto), opcional, acolhedor. Tom de voz empático, como no Instagram da Bruna.
- O app **não é canal de emergência**: sempre exibir orientação de crise (CVV 188, SAMU 192).

## Convenções
- `src/components`, `src/pages`, `src/pages/app`, `src/lib` (um arquivo `xxxApi.js` por assunto, snake_case ↔ camelCase, `if (error) throw error`), `src/data`, `src/theme.js`.
- Telas do paciente usam `Pagina` (faixa petróleo + título com `Destaque` em itálico verde-água) e `Bloco` (cartão). Telas de acesso usam `LayoutAcesso`.
- Dados exclusivos da psicóloga (ficha, anotações, medicações, comentários) têm RLS só-Admin; o paciente nunca os vê, nem pela API.
- Toda regra nova de banco: testar simulando paciente, outro paciente e Admin (padrão `pg_temp` + `raise exception` para desfazer) e rodar o advisor de segurança.
- Testes de fluxo que apagam/revogam: usar um paciente descartável criado pela Edge Function `criar-paciente` e apagá-lo depois — nunca o Paciente Teste.
- Ambiente local: `npm run dev -- --port 5180`. Senhas de teste nunca vão para o repositório.
- Commits em português, verbo no imperativo, descrevendo o efeito para quem usa. Sem `feat:`/`fix:`.
- Manter `README.md` técnico e `docs/visao-do-produto.md` (negócio) atualizados.
