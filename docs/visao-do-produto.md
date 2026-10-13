# Visão do produto — LOF Check-in · Bruna Sartori

*Documento de negócio, não técnico. Cole no início de uma conversa nova para recuperar o contexto.*

## O que é
Um aplicativo web para a psicóloga Bruna Sartori acompanhar seus pacientes **entre as sessões**. O paciente faz um check-in rápido e opcional; a Bruna vê uma síntese organizada antes de cada sessão.

## Para quem
- **Bruna (Admin):** psicóloga clínica, abordagem TCC, também neuropsicologia, atende online.
- **Pacientes:** pessoas em psicoterapia, em geral com sessões semanais.

## Princípio central
O app **organiza informações e sugere temas de conversa — não afirma causas nem faz diagnóstico**. Exemplo de linguagem certa: "Em três dos quatro dias com ansiedade elevada, o sono também foi registrado como ruim." Exemplo errado: "A ansiedade está causando insônia."

## Escopo

### Nível 1 — MVP (monitoramento essencial)
| Dimensão | O que acompanhar | Frequência |
|---|---|---|
| Humor | Estado emocional (escala de 5 com emojis) | Diário |
| Emoção predominante | Alegria, ansiedade, tristeza, irritação, medo, tranquilidade, outra | Diário |
| Ansiedade/estresse | Intensidade percebida | Diário ou por episódio |
| Sono | Duração e qualidade | Diário |
| Energia | Escala 1 a 5 | Diário |
| Acontecimentos relevantes | Texto livre (áudio em fase posterior) | Espontâneo |
| Objetivos terapêuticos | Percepção de avanço e dificuldade | Semanal |

**Painel da Bruna:** por paciente, últimos 7 dias — médias, dias com ansiedade elevada, registros feitos, eventos relevantes, linha do tempo, síntese descritiva e possíveis temas para a sessão.

### Nível 2 — próximas fases
- Gatilhos/situações associadas às emoções (com padrões descritivos).
- **Registro de pensamentos (situação → pensamento → emoção → intensidade → comportamento)** — muito alinhado à abordagem TCC da Bruna; pode ser ativado/desativado por paciente.
- Hábitos: atividade física, alimentação percebida, interação social, descanso, lazer, rotina de trabalho — com cuidado para não virar um sistema excessivamente quantitativo.

## Cuidados obrigatórios
- **LGPD:** dado de saúde é dado sensível. Consentimento específico, separado, guardado com data e hora. Paciente pode ver, exportar e apagar seus dados.
- **Sigilo profissional** da psicóloga, além da LGPD.
- **Não é canal de emergência:** o app sempre mostra orientação de crise (CVV 188, SAMU 192).

## Identidade visual
Baseada no logo e nos posts do Instagram @bru_psico (arquivo `Imagens.pptx`). Tom de voz: acolhedor, empático, validante ("Acolher a própria história é o primeiro passo para a transformação").
- **Cores:** azul-petróleo do logo (#254C5D) como principal, verde-água do cérebro do logo (#61B7AC) para destaques, verde-sálvia e névoa clara dos fundos dos posts, fundo papel off-white.
- **Fontes:** títulos em serifada expressiva com itálico (Fraunces), como nos posts; corpo em Nunito Sans; botões e menus em Montserrat.
- Logo atual é PNG pequeno com fundo branco — uma versão em alta resolução/fundo transparente melhoraria o acabamento.

## Perguntas em aberto
- Nome do app (ex.: "LOF Check-in", ou algo com a marca da Bruna).
- Prazo de retenção dos dados após o fim do acompanhamento.
- Lembrete diário: e-mail, notificação no navegador ou WhatsApp?
- A Bruna quer receber algum alerta (ex.: vários dias seguidos de humor "muito mal") ou apenas a síntese antes da sessão?
- Domínio próprio: já existe?

## Estado atual
13/10/2026 — Decidido: lançamento inclui Nível 1 + registro de pensamentos (TCC); paciente entra só por convite da Bruna.
Feito: banco no Supabase (São Paulo) com todas as tabelas e regras de segurança testadas; telas de login, criar senha, consentimento LGPD e check-in diário; lista de pacientes para a Bruna. Código no GitHub.
Também feito: telas de reflexão semanal e de registro de pensamentos; pergunta opcional de "situações ligadas ao que sentiu" (gatilhos) dentro do check-in diário. Contas de teste criadas (Admin e paciente).
Hábitos e comportamentos ficam para depois de conversar com a Bruna, para não tornar o app quantitativo demais.
Próximo: publicar no Vercel, convite de pacientes, painel da Bruna com síntese de 7 dias.
