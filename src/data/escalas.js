// Questionários periódicos ligados a alguns módulos. São instrumentos de RASTREIO, de uso livre:
// a pontuação aparece só para a psicóloga, com o ponto de corte de referência do instrumento,
// e nunca como diagnóstico. O paciente vê apenas um agradecimento.
//
// VALIDAR com a psicóloga a redação final de cada item com a versão brasileira publicada.
// Referências: EPDS — Cox, Holden & Sagovsky (1987), versão brasileira de Santos et al.;
// GAD-7 — Spitzer et al. (2006), domínio público.

const FREQ_GAD = [
  { pontos: 0, rotulo: 'Nenhuma vez' },
  { pontos: 1, rotulo: 'Vários dias' },
  { pontos: 2, rotulo: 'Mais da metade dos dias' },
  { pontos: 3, rotulo: 'Quase todos os dias' },
]

export const ESCALAS = {
  epds: {
    id: 'epds',
    nome: 'Escala de Edimburgo (EPDS)',
    tituloPaciente: 'Como você tem se sentido',
    intervaloDias: 14,
    instrucao: 'Pensando nos últimos 7 dias, marque a resposta que mais se aproxima de como você tem se sentido.',
    referencia: 'Ponto de corte de rastreio usado no Brasil: 12 ou mais.',
    corte: 12,
    maximo: 30,
    // Item 10 (pensar em se machucar): qualquer resposta diferente de "nenhuma vez" aciona o aviso de crise.
    itemRisco: 9,
    itens: [
      {
        texto: 'Eu tenho sido capaz de rir e de achar graça das coisas',
        opcoes: [
          { pontos: 0, rotulo: 'Como eu sempre fiz' },
          { pontos: 1, rotulo: 'Não tanto quanto antes' },
          { pontos: 2, rotulo: 'Sem dúvida, menos que antes' },
          { pontos: 3, rotulo: 'De jeito nenhum' },
        ],
      },
      {
        texto: 'Eu tenho pensado no futuro com alegria',
        opcoes: [
          { pontos: 0, rotulo: 'Sim, como de costume' },
          { pontos: 1, rotulo: 'Um pouco menos que de costume' },
          { pontos: 2, rotulo: 'Bem menos que de costume' },
          { pontos: 3, rotulo: 'Praticamente não' },
        ],
      },
      {
        texto: 'Eu tenho me culpado sem necessidade quando as coisas dão errado',
        opcoes: [
          { pontos: 3, rotulo: 'Sim, na maioria das vezes' },
          { pontos: 2, rotulo: 'Sim, algumas vezes' },
          { pontos: 1, rotulo: 'Não muitas vezes' },
          { pontos: 0, rotulo: 'Não, nenhuma vez' },
        ],
      },
      {
        texto: 'Eu tenho ficado ansiosa ou preocupada sem uma boa razão',
        opcoes: [
          { pontos: 0, rotulo: 'Não, de maneira alguma' },
          { pontos: 1, rotulo: 'Pouquíssimas vezes' },
          { pontos: 2, rotulo: 'Sim, algumas vezes' },
          { pontos: 3, rotulo: 'Sim, muitas vezes' },
        ],
      },
      {
        texto: 'Eu tenho me sentido assustada ou em pânico sem um bom motivo',
        opcoes: [
          { pontos: 3, rotulo: 'Sim, muitas vezes' },
          { pontos: 2, rotulo: 'Sim, algumas vezes' },
          { pontos: 1, rotulo: 'Não muitas vezes' },
          { pontos: 0, rotulo: 'Não, nenhuma vez' },
        ],
      },
      {
        texto: 'Eu tenho me sentido sobrecarregada pelas tarefas e acontecimentos do dia a dia',
        opcoes: [
          { pontos: 3, rotulo: 'Sim, na maioria das vezes não consigo lidar' },
          { pontos: 2, rotulo: 'Sim, algumas vezes não consigo lidar como antes' },
          { pontos: 1, rotulo: 'Não, na maioria das vezes consigo lidar bem' },
          { pontos: 0, rotulo: 'Não, consigo lidar tão bem quanto antes' },
        ],
      },
      {
        texto: 'Eu tenho me sentido tão infeliz que tenho tido dificuldade para dormir',
        opcoes: [
          { pontos: 3, rotulo: 'Sim, na maioria das vezes' },
          { pontos: 2, rotulo: 'Sim, algumas vezes' },
          { pontos: 1, rotulo: 'Não muitas vezes' },
          { pontos: 0, rotulo: 'Não, nenhuma vez' },
        ],
      },
      {
        texto: 'Eu tenho me sentido triste ou arrasada',
        opcoes: [
          { pontos: 3, rotulo: 'Sim, na maioria das vezes' },
          { pontos: 2, rotulo: 'Sim, muitas vezes' },
          { pontos: 1, rotulo: 'Não muitas vezes' },
          { pontos: 0, rotulo: 'Não, de jeito nenhum' },
        ],
      },
      {
        texto: 'Eu tenho me sentido tão infeliz que tenho chorado',
        opcoes: [
          { pontos: 3, rotulo: 'Sim, quase todo o tempo' },
          { pontos: 2, rotulo: 'Sim, muitas vezes' },
          { pontos: 1, rotulo: 'De vez em quando' },
          { pontos: 0, rotulo: 'Não, nenhuma vez' },
        ],
      },
      {
        texto: 'A ideia de fazer mal a mim mesma passou pela minha cabeça',
        opcoes: [
          { pontos: 3, rotulo: 'Sim, muitas vezes, ultimamente' },
          { pontos: 2, rotulo: 'Algumas vezes nos últimos dias' },
          { pontos: 1, rotulo: 'Pouquíssimas vezes, ultimamente' },
          { pontos: 0, rotulo: 'Nenhuma vez' },
        ],
      },
    ],
  },
  gad7: {
    id: 'gad7',
    nome: 'GAD-7',
    tituloPaciente: 'Sua ansiedade nas últimas semanas',
    intervaloDias: 14,
    instrucao: 'Nas últimas 2 semanas, com que frequência você se sentiu incomodado(a) por:',
    referencia: 'Faixas de referência: 5 leve · 10 moderada · 15 grave.',
    corte: 10,
    maximo: 21,
    itens: [
      'Sentir-se nervoso(a), ansioso(a) ou muito tenso(a)',
      'Não conseguir impedir ou controlar as preocupações',
      'Preocupar-se muito com diversas coisas',
      'Dificuldade para relaxar',
      'Ficar tão agitado(a) que fica difícil permanecer sentado(a)',
      'Ficar facilmente aborrecido(a) ou irritado(a)',
      'Sentir medo, como se algo horrível fosse acontecer',
    ].map((texto) => ({ texto, opcoes: FREQ_GAD })),
  },
}

// As respostas são guardadas como a pontuação de cada item (dentro de um item, cada opção tem pontos diferentes).
export const pontuar = (respostas) => respostas.reduce((total, pontos) => total + (pontos ?? 0), 0)

// Com que frequência a psicóloga pede o questionário. `intervaloDias` de cada escala é só a sugestão inicial.
export const FREQUENCIAS = [
  { valor: 'unica', rotulo: 'Só uma vez' },
  { valor: 14, rotulo: 'A cada 2 semanas' },
  { valor: 30, rotulo: 'A cada mês' },
]
export const rotuloFrequencia = (valor) => FREQUENCIAS.find((f) => f.valor === valor)?.rotulo ?? ''

// `config` (perfil.escalas[id]): { frequencia, ativadaEm, pedidoEm } — a psicóloga liga a escala dentro do módulo.
// `ultimo`: a última aplicação respondida ({ data, createdAt }) ou nada.
// Pendente quando: nunca respondeu desde que foi ligada, a psicóloga pediu de novo ("Pedir agora")
// ou, na frequência periódica, já passou o intervalo.
export function escalaPendente(config, ultimo, hoje) {
  if (!config) return false
  if (!ultimo || ultimo.createdAt < config.ativadaEm) return true
  if (config.pedidoEm && ultimo.createdAt < config.pedidoEm) return true
  if (config.frequencia === 'unica') return false
  return diasDesde(ultimo.data, hoje) >= config.frequencia
}

// Próxima aplicação prevista (AAAA-MM-DD), só na frequência periódica.
export function proximaAplicacao(config, ultimo) {
  if (!config || config.frequencia === 'unica' || !ultimo) return null
  const d = new Date(`${ultimo.data}T12:00`)
  d.setDate(d.getDate() + config.frequencia)
  return d.toISOString().slice(0, 10)
}

const diasDesde = (data, hoje) => (new Date(`${hoje}T12:00`) - new Date(`${data}T12:00`)) / 86400000
