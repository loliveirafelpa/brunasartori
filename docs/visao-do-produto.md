# Visão do produto — Check-in · Bruna Sartori

*Documento de negócio, não técnico. Cole no início de uma conversa nova para recuperar o contexto.*

## O que é
Um aplicativo web para a psicóloga Bruna Sartori Caetano (CRP 06/106.364) acompanhar seus pacientes **entre as sessões**. O paciente registra, em poucos minutos, como está; a Bruna vê um resumo organizado antes de cada sessão, com sugestões de temas para conversar.

## Para quem
- **Bruna (Admin):** psicóloga clínica, abordagem TCC, neuropsicologia, atendimento presencial e online.
- **Pacientes:** pessoas em psicoterapia, em geral com sessões semanais. Entram só por cadastro feito pela Bruna.

## Princípio central
O app **organiza informações e sugere temas de conversa — não afirma causas nem faz diagnóstico**. Certo: "Em todos os dias com ansiedade alta, foi marcada a situação 'trabalho'." Errado: "O trabalho está causando a ansiedade."

## O que o paciente faz
- **Check-in diário** (menos de um minuto): humor, emoção mais presente, situações ligadas ao que sentiu, ansiedade/estresse de 0 a 10, sono, energia, se se movimentou e algum acontecimento importante.
- **Sequência de check-ins** (como a ofensiva do Duolingo): o paciente vê há quantos dias seguidos faz o check-in, a sua semana marcada e o seu recorde. Serve de incentivo gentil — quando a sequência quebra, o app acolhe ("recomeçar também é cuidado"), sem culpa.
- **Semana:** vê o "combinado na sessão" (ou escreve o próprio objetivo), diz quanto sente que avançou, o que foi avanço e o que foi difícil. Vê também seus objetivos na terapia.
- **Registro de pensamentos** (TCC, se a Bruna ativar): situação, pensamento, emoção, intensidade e comportamento.
- Pode rever e **editar registros de dias anteriores**.
- **Meus dados:** baixar seus dados, revogar o consentimento, apagar o que registrou e pedir o encerramento da conta.
- Em todas as telas, o aviso de que o app não é canal de emergência (CVV 188, SAMU 192).

## O que a Bruna faz
- **Cadastra pacientes** (nome, e-mail, WhatsApp, início, histórico, objetivos, registro de pensamentos). O app gera uma senha provisória e uma mensagem pronta para WhatsApp; o paciente troca a senha no primeiro acesso.
- Para cada paciente, em abas:
  - **Resumo** do período (7, 14 ou 30 dias): números, síntese por tópico, possíveis temas para a sessão e espaço para as anotações dela em cada tópico.
  - **Linha do tempo** dia a dia, **Semana** (reflexões) e **Pensamentos**.
  - **Ficha e objetivos:** objetivos terapêuticos em destaque, combinados de cada semana com histórico, ficha com histórico do paciente.
  - **Anotações clínicas:** diário dela sobre o paciente e registro de medicações (em uso e histórico).
- Recebe na lista de pacientes os pedidos de encerramento de conta e o aviso de quem revogou o consentimento.
- Encontra pacientes por nome, vê primeiro quem precisa de atenção (sem consentimento, pedido de encerramento ou sem check-in na semana) e separa os acompanhamentos encerrados, que saem da lista principal sem apagar nada.
- Troca a própria senha pelo painel (pede a senha atual).
- Ficha, histórico, anotações, medicações e comentários são **só dela**: o paciente não vê.

## Cuidados obrigatórios
- **LGPD:** dado de saúde é dado sensível. Consentimento específico, separado, guardado com data e hora. Paciente pode ver, baixar, corrigir e apagar o que registrou.
- **Sigilo profissional** e normas do CFP: os registros profissionais da Bruna seguem a guarda mínima exigida e não são apagados pelo paciente.
- **Não é canal de emergência.**

## Identidade visual
Baseada no logo e nos posts do Instagram @bru_psico. Tom acolhedor e validante ("Acolher a própria história é o primeiro passo para a transformação").
- **Cores:** azul-petróleo do logo (#254C5D), verde-água do cérebro (#61B7AC), sálvia, névoa e fundo cinza-azulado claro dos posts.
- **Fontes:** títulos em Fraunces com palavra em itálico verde-água (como nos posts), corpo em Nunito Sans, botões e menus em Montserrat, nome da Bruna em Quicksand (traço do logo).
- Cada tela abre com uma faixa petróleo e o título; o conteúdo vem em cartões claros. No celular, navegação fixa embaixo.
- A tela de entrada mostra o cérebro do logo e o nome "Bruna Sartori Caetano" com o CRP.
- Pendente: logo em arquivo vetorial (.svg/.pdf) para máxima nitidez.

## Estado atual (outubro/2026)
- **Publicado no Vercel em 14/10/2026**; cada atualização no GitHub vai para o ar sozinha. Banco no Supabase (São Paulo).
- Conta da Bruna criada (`bru_sartori@hotmail.com`) com senha provisória; ela cria a própria senha no primeiro acesso. Mensagem com acessos e orientações preparada para envio.
- Contas de teste: uma Admin e um paciente com 5 dias de registros simulados.
- Antes dos pacientes reais: desligar o cadastro aberto no Supabase e apagar (ou trocar a senha da) Admin de teste.

## Para validar com a Bruna
- Canal de contato para assuntos de privacidade (hoje: "pelos canais de atendimento").
- Prazo de guarda dos dados após o fim do acompanhamento (para exclusão automática).
- Entendimento de que ficha, anotações e medicações seguem a guarda do CFP e não são apagados pelo paciente.
- Se o histórico do paciente deve continuar oculto (lembrando que o paciente pode pedir acesso ao prontuário).
- Se o "combinado na sessão" deve valer de segunda a domingo ou de sessão a sessão; e se pode haver mais de um por semana.
- Se quer que o paciente edite dias antigos sem aviso para ela (hoje o painel mostra só a versão nova).
- Limite de "ansiedade alta" (hoje 7/10 ou mais).

## Ideias para depois
- Lembrete diário (e-mail, notificação ou WhatsApp).
- Alertas para a Bruna (ex.: vários dias seguidos de humor muito baixo).
- Hábitos e comportamentos (Nível 2), com cuidado para não ficar quantitativo demais.
- Detalhar o exercício físico (tipo e duração).
- Domínio próprio e convite por e-mail.
