// Módulos de hábitos e protocolos que a psicóloga liga ou desliga para cada paciente.
// Cada módulo acrescenta um cartão curto ao check-in diário (e, em alguns, um questionário periódico
// ou o registro de crises). As perguntas são declaradas aqui; as telas só leem esta lista.
//
// Tipos de pergunta:
//   simnao   — Sim / Não
//   unica    — uma opção (`opcoes`)
//   multipla — várias opções; uma opção com `exclusiva: true` desmarca as outras (ex.: "Nada disso")
//   escala   — barra de 0 a 10 (`minimo` / `maximo` são os rótulos das pontas)
//   hora     — horário (HH:MM)
//   texto    — resposta curta escrita, sempre opcional
// `quando`: a pergunta só aparece se outra do mesmo módulo tiver a resposta indicada.
//
// Linguagem: descritiva e acolhedora. Nada aqui é diagnóstico.

const SIM_NAO = [
  { valor: true, rotulo: 'Sim' },
  { valor: false, rotulo: 'Não' },
]
export { SIM_NAO }

export const GRUPOS = [
  { id: 'habitos', rotulo: 'Hábitos' },
  { id: 'protocolos', rotulo: 'Protocolos' },
]

export const MODULOS = [
  // ---------------------------------------------------------------- Hábitos
  {
    id: 'tabagismo',
    grupo: 'habitos',
    nome: 'Tabagismo',
    tituloPaciente: 'Cigarro',
    resumo: 'Se fumou, quanto, em que momentos e a vontade de fumar. Mostra ao paciente os dias seguidos sem fumar.',
    perguntas: [
      { id: 'fumou', curto: 'Fumou', tipo: 'simnao', rotulo: 'Você fumou hoje?', ajuda: 'Inclui cigarro eletrônico, narguilé e palheiro.' },
      {
        id: 'quantidade',
        curto: 'Quantos',
        tipo: 'unica',
        rotulo: 'Quantos, mais ou menos?',
        ajuda: 'No cigarro eletrônico, conte as vezes em que usou.',
        quando: { fumou: true },
        opcoes: [
          { valor: 3, rotulo: '1 a 5' },
          { valor: 8, rotulo: '6 a 10' },
          { valor: 15, rotulo: '11 a 20' },
          { valor: 25, rotulo: 'Mais de 20' },
        ],
        colunas: 4,
      },
      {
        id: 'momentos',
        curto: 'Momentos',
        tipo: 'multipla',
        rotulo: 'Em que momentos?',
        quando: { fumou: true },
        opcoes: [
          { valor: 'acordar', rotulo: 'Ao acordar' },
          { valor: 'cafe', rotulo: 'Com café' },
          { valor: 'refeicoes', rotulo: 'Depois de comer' },
          { valor: 'estresse', rotulo: 'No estresse ou ansiedade' },
          { valor: 'bebendo', rotulo: 'Bebendo' },
          { valor: 'amigos', rotulo: 'Com amigos' },
          { valor: 'trabalho', rotulo: 'Em pausas do trabalho' },
          { valor: 'tedio', rotulo: 'No tédio' },
          { valor: 'outro', rotulo: 'Outro' },
        ],
      },
      { id: 'momentoOutro', curto: 'Outro momento', tipo: 'texto', rotulo: 'Qual outro momento?', ajuda: 'Opcional.', quando: { momentoOutro: true } },
      { id: 'vontade', curto: 'Vontade', tipo: 'escala', rotulo: 'Quanta vontade de fumar você sentiu?', minimo: 'Nenhuma', maximo: 'Muita' },
    ],
  },
  {
    id: 'alcool',
    grupo: 'habitos',
    nome: 'Álcool',
    tituloPaciente: 'Bebida alcoólica',
    resumo: 'Se bebeu, quantas doses, com quem, para quê e a vontade de beber.',
    perguntas: [
      { id: 'bebeu', curto: 'Bebeu', tipo: 'simnao', rotulo: 'Você tomou alguma bebida alcoólica hoje?' },
      {
        id: 'doses',
        curto: 'Doses',
        tipo: 'unica',
        rotulo: 'Quantas doses?',
        ajuda: '1 dose = 1 lata de cerveja, 1 taça de vinho ou 1 dose de destilado.',
        quando: { bebeu: true },
        opcoes: [
          { valor: 1, rotulo: '1' },
          { valor: 2, rotulo: '2' },
          { valor: 3.5, rotulo: '3 ou 4' },
          { valor: 5.5, rotulo: '5 ou 6' },
          { valor: 8, rotulo: '7 ou mais' },
        ],
      },
      {
        id: 'companhia',
        curto: 'Com quem',
        tipo: 'multipla',
        rotulo: 'Com quem?',
        quando: { bebeu: true },
        opcoes: [
          { valor: 'sozinho', rotulo: 'Sozinho(a)' },
          { valor: 'amigos', rotulo: 'Amigos' },
          { valor: 'familia', rotulo: 'Família' },
          { valor: 'parceiro', rotulo: 'Parceiro(a)' },
          { valor: 'trabalho', rotulo: 'Trabalho ou evento' },
        ],
      },
      {
        id: 'motivos',
        curto: 'Por quê',
        tipo: 'multipla',
        rotulo: 'O que te levou a beber?',
        ajuda: 'Sua percepção. Marque quantas quiser.',
        quando: { bebeu: true },
        opcoes: [
          { valor: 'relaxar', rotulo: 'Relaxar' },
          { valor: 'comemorar', rotulo: 'Comemorar' },
          { valor: 'aliviar', rotulo: 'Aliviar uma emoção difícil' },
          { valor: 'socializar', rotulo: 'Estar com as pessoas' },
          { valor: 'dormir', rotulo: 'Conseguir dormir' },
          { valor: 'habito', rotulo: 'Hábito' },
        ],
      },
      { id: 'vontade', curto: 'Vontade', tipo: 'escala', rotulo: 'Quanta vontade de beber você sentiu?', minimo: 'Nenhuma', maximo: 'Muita' },
    ],
  },

  // ---------------------------------------------------------------- Protocolos
  {
    id: 'puerperio',
    grupo: 'protocolos',
    nome: 'Puerpério e gestação',
    tituloPaciente: 'Você e o bebê',
    resumo: 'Descanso, vínculo, rede de apoio, tempo para si e pensamentos intrusivos. Opcional: Escala de Edimburgo (EPDS).',
    escala: 'epds',
    perguntas: [
      {
        id: 'descanso',
        curto: 'Descanso',
        tipo: 'unica',
        rotulo: 'Quanto você conseguiu descansar?',
        opcoes: [
          { valor: 1, rotulo: 'Quase nada' },
          { valor: 2, rotulo: 'Pouco' },
          { valor: 3, rotulo: 'O suficiente' },
          { valor: 4, rotulo: 'Bem' },
        ],
        colunas: 4,
      },
      {
        id: 'vinculo',
        curto: 'Com o bebê',
        tipo: 'unica',
        rotulo: 'Como você se sentiu com o bebê hoje?',
        opcoes: [
          { valor: 'conectada', rotulo: 'Conectada' },
          { valor: 'cansada_bem', rotulo: 'Cansada, mas bem' },
          { valor: 'sobrecarregada', rotulo: 'Sobrecarregada' },
          { valor: 'preocupada', rotulo: 'Preocupada' },
          { valor: 'distante', rotulo: 'Distante' },
        ],
      },
      {
        id: 'apoio',
        curto: 'Ajuda',
        tipo: 'multipla',
        rotulo: 'Teve ajuda hoje?',
        opcoes: [
          { valor: 'parceiro', rotulo: 'Parceiro(a)' },
          { valor: 'familia', rotulo: 'Família' },
          { valor: 'amigos', rotulo: 'Amigos' },
          { valor: 'profissional', rotulo: 'Babá ou profissional' },
          { valor: 'ninguem', rotulo: 'Ninguém', exclusiva: true },
        ],
      },
      { id: 'tempoSi', curto: 'Tempo para si', tipo: 'simnao', rotulo: 'Teve algum tempo só para você?' },
      { id: 'tempoSiQue', curto: 'O que fez', tipo: 'texto', rotulo: 'O que você fez nesse tempo?', ajuda: 'Opcional.', quando: { tempoSi: true } },
      {
        id: 'intrusivos',
        curto: 'Pens. assustadores',
        tipo: 'unica',
        rotulo: 'Vieram pensamentos assustadores sem você querer?',
        ajuda: 'Sobre o bebê ou sobre você. Isso é mais comum do que parece, e falar sobre eles na sessão ajuda.',
        opcoes: [
          { valor: 0, rotulo: 'Não' },
          { valor: 1, rotulo: 'Algumas vezes' },
          { valor: 2, rotulo: 'Muitas vezes' },
        ],
        colunas: 3,
      },
    ],
  },
  {
    id: 'crise',
    grupo: 'protocolos',
    nome: 'Crise de ansiedade e pânico',
    tituloPaciente: 'Ansiedade',
    resumo: 'Botão "Tive uma crise" com registro do episódio e tela de respiração guiada. No check-in: evitação e medo de ter crise. Opcional: GAD-7.',
    escala: 'gad7',
    registraCrises: true,
    perguntas: [
      {
        id: 'evitou',
        curto: 'Evitou algo',
        tipo: 'simnao',
        rotulo: 'Você deixou de ir a algum lugar ou de fazer algo por medo de passar mal?',
      },
      {
        id: 'medoCrise',
        curto: 'Medo de crise',
        tipo: 'escala',
        rotulo: 'Quanto você ficou preocupado(a) com a possibilidade de ter uma crise?',
        minimo: 'Nada',
        maximo: 'Muito',
      },
    ],
  },
  {
    id: 'bullying',
    grupo: 'protocolos',
    nome: 'Bullying',
    tituloPaciente: 'Escola',
    resumo: 'Para crianças e adolescentes, em linguagem simples: como foi a escola, o que aconteceu, onde, se contou para alguém e a vontade de voltar.',
    publico: 'Com menores de idade, a LGPD exige o consentimento de um responsável.',
    perguntas: [
      {
        id: 'escola',
        curto: 'Escola',
        tipo: 'unica',
        rotulo: 'Como foi a escola hoje?',
        opcoes: [
          { valor: 5, emoji: '😄', rotulo: 'Muito legal' },
          { valor: 4, emoji: '🙂', rotulo: 'Legal' },
          { valor: 3, emoji: '😐', rotulo: 'Mais ou menos' },
          { valor: 2, emoji: '😟', rotulo: 'Ruim' },
          { valor: 1, emoji: '😢', rotulo: 'Muito ruim' },
          { valor: 0, emoji: '🏠', rotulo: 'Não teve aula' },
        ],
        colunas: 3,
      },
      {
        id: 'aconteceu',
        curto: 'Aconteceu',
        tipo: 'multipla',
        rotulo: 'Aconteceu alguma coisa chata com colegas?',
        quando: { escolaNao: 0 },
        opcoes: [
          { valor: 'apelidos', rotulo: 'Me xingaram ou colocaram apelido' },
          { valor: 'exclusao', rotulo: 'Me deixaram de fora' },
          { valor: 'fisico', rotulo: 'Me empurraram ou bateram' },
          { valor: 'internet', rotulo: 'Mensagens ou posts na internet' },
          { valor: 'coisas', rotulo: 'Mexeram nas minhas coisas' },
          { valor: 'ameaca', rotulo: 'Me ameaçaram' },
          { valor: 'nada', rotulo: 'Nada disso', exclusiva: true },
        ],
      },
      {
        id: 'onde',
        curto: 'Onde',
        tipo: 'multipla',
        rotulo: 'Onde aconteceu?',
        quando: { aconteceuAlgo: true },
        opcoes: [
          { valor: 'sala', rotulo: 'Na sala' },
          { valor: 'intervalo', rotulo: 'No intervalo' },
          { valor: 'entrada', rotulo: 'Na entrada ou saída' },
          { valor: 'transporte', rotulo: 'No transporte' },
          { valor: 'internet', rotulo: 'Na internet' },
        ],
      },
      {
        id: 'contou',
        curto: 'Contou para',
        tipo: 'multipla',
        rotulo: 'Você contou para alguém?',
        quando: { aconteceuAlgo: true },
        opcoes: [
          { valor: 'responsaveis', rotulo: 'Pais ou responsáveis' },
          { valor: 'escola', rotulo: 'Professor(a) ou escola' },
          { valor: 'amigo', rotulo: 'Um amigo ou amiga' },
          { valor: 'ninguem', rotulo: 'Ninguém', exclusiva: true },
        ],
      },
      { id: 'vontade', curto: 'Vontade de ir', tipo: 'escala', rotulo: 'Quanta vontade você tem de ir à escola amanhã?', minimo: 'Nenhuma', maximo: 'Muita' },
    ],
  },
  {
    id: 'luto',
    grupo: 'protocolos',
    nome: 'Luto',
    tituloPaciente: 'Saudade',
    resumo: 'Intensidade da saudade, momentos mais difíceis, se conseguiu cuidar da rotina e gestos de memória.',
    perguntas: [
      { id: 'saudade', curto: 'Saudade', tipo: 'escala', rotulo: 'Quanto a saudade esteve presente hoje?', minimo: 'Pouco', maximo: 'O dia todo' },
      {
        id: 'momentos',
        curto: 'Momentos difíceis',
        tipo: 'multipla',
        rotulo: 'Algum momento foi mais difícil?',
        opcoes: [
          { valor: 'acordar', rotulo: 'Ao acordar' },
          { valor: 'noite', rotulo: 'À noite' },
          { valor: 'data', rotulo: 'Uma data especial' },
          { valor: 'lugar', rotulo: 'Um lugar' },
          { valor: 'objetos', rotulo: 'Fotos ou objetos' },
          { valor: 'conversas', rotulo: 'Conversas sobre a pessoa' },
          { valor: 'outro', rotulo: 'Outro' },
          { valor: 'nenhum', rotulo: 'Nenhum em especial', exclusiva: true },
        ],
      },
      { id: 'momentoOutro', curto: 'Outro momento', tipo: 'texto', rotulo: 'Qual outro momento?', ajuda: 'Opcional.', quando: { lutoOutro: true } },
      {
        id: 'rotina',
        curto: 'Rotina',
        tipo: 'unica',
        rotulo: 'Você conseguiu fazer o que precisava hoje?',
        opcoes: [
          { valor: 1, rotulo: 'Quase nada' },
          { valor: 2, rotulo: 'Uma parte' },
          { valor: 3, rotulo: 'Quase tudo' },
          { valor: 4, rotulo: 'Tudo' },
        ],
        colunas: 4,
      },
      { id: 'memoria', curto: 'Gesto de memória', tipo: 'simnao', rotulo: 'Fez algo para lembrar da pessoa com carinho?' },
      { id: 'memoriaQue', curto: 'O que fez', tipo: 'texto', rotulo: 'O que você fez?', ajuda: 'Opcional.', quando: { memoria: true } },
    ],
  },
  {
    id: 'burnout',
    grupo: 'protocolos',
    nome: 'Esgotamento no trabalho',
    tituloPaciente: 'Trabalho',
    resumo: 'Horas trabalhadas, pausas, se conseguiu se desligar e como se sentiu em relação ao trabalho.',
    perguntas: [
      {
        id: 'horas',
        curto: 'Horas',
        tipo: 'unica',
        rotulo: 'Quantas horas você trabalhou?',
        opcoes: [
          { valor: 0, rotulo: 'Não trabalhei' },
          { valor: 5, rotulo: 'Até 6h' },
          { valor: 7, rotulo: '6 a 8h' },
          { valor: 9, rotulo: '8 a 10h' },
          { valor: 11, rotulo: 'Mais de 10h' },
        ],
      },
      { id: 'pausas', curto: 'Pausas', tipo: 'simnao', rotulo: 'Conseguiu fazer pausas?', quando: { trabalhou: true } },
      {
        id: 'desligar',
        curto: 'Desligou',
        tipo: 'unica',
        rotulo: 'Conseguiu se desligar do trabalho depois do expediente?',
        quando: { trabalhou: true },
        opcoes: [
          { valor: 'sim', rotulo: 'Sim' },
          { valor: 'parte', rotulo: 'Em parte' },
          { valor: 'nao', rotulo: 'Não' },
        ],
        colunas: 3,
      },
      {
        id: 'sentimento',
        curto: 'Sentimento',
        tipo: 'unica',
        rotulo: 'Como você se sentiu em relação ao trabalho?',
        quando: { trabalhou: true },
        opcoes: [
          { valor: 'motivado', rotulo: 'Com vontade' },
          { valor: 'neutro', rotulo: 'Neutro' },
          { valor: 'cansado', rotulo: 'Cansado(a)' },
          { valor: 'esgotado', rotulo: 'Esgotado(a)' },
          { valor: 'distante', rotulo: 'Distante, sem sentido' },
        ],
      },
    ],
  },
  {
    id: 'insonia',
    grupo: 'protocolos',
    nome: 'Insônia (diário do sono)',
    tituloPaciente: 'Diário do sono',
    resumo: 'Diário do sono usado na TCC para insônia: horários, quanto demorou para dormir, despertares, cochilos e cafeína à tarde.',
    perguntas: [
      { id: 'deitou', curto: 'Deitou', tipo: 'hora', rotulo: 'A que horas você foi para a cama ontem?' },
      {
        id: 'latencia',
        curto: 'Para dormir',
        tipo: 'unica',
        rotulo: 'Quanto tempo levou para pegar no sono?',
        opcoes: [
          { valor: 10, rotulo: 'Menos de 15 min' },
          { valor: 22, rotulo: '15 a 30 min' },
          { valor: 45, rotulo: '30 min a 1h' },
          { valor: 75, rotulo: 'Mais de 1h' },
        ],
        colunas: 4,
      },
      {
        id: 'despertares',
        curto: 'Despertares',
        tipo: 'unica',
        rotulo: 'Quantas vezes acordou durante a noite?',
        opcoes: [
          { valor: 0, rotulo: 'Nenhuma' },
          { valor: 1, rotulo: '1' },
          { valor: 2, rotulo: '2' },
          { valor: 3, rotulo: '3 ou mais' },
        ],
        colunas: 4,
      },
      { id: 'levantou', curto: 'Levantou', tipo: 'hora', rotulo: 'A que horas saiu da cama hoje?' },
      { id: 'cochilo', curto: 'Cochilo', tipo: 'simnao', rotulo: 'Cochilou durante o dia?' },
      { id: 'cafeina', curto: 'Cafeína > 16h', tipo: 'simnao', rotulo: 'Tomou café, chá preto ou energético depois das 16h?' },
    ],
  },
]

export const modulo = (id) => MODULOS.find((m) => m.id === id)

// Módulos ligados para um perfil, na ordem do catálogo.
export const modulosAtivos = (perfil) => MODULOS.filter((m) => perfil?.modulos?.[m.id])

// Questionários que a psicóloga ligou (dentro de um módulo ligado). Devolve os ids das escalas.
export const escalasLigadas = (perfil) => modulosAtivos(perfil).filter((m) => m.escala && perfil.escalas?.[m.escala]).map((m) => m.escala)

// Condições de exibição que dependem de mais de uma resposta.
const CONDICOES = {
  escolaNao: (r) => r.escola !== null && r.escola !== undefined && r.escola !== 0,
  aconteceuAlgo: (r) => (r.aconteceu ?? []).some((v) => v !== 'nada'),
  trabalhou: (r) => r.horas !== null && r.horas !== undefined && r.horas !== 0,
  momentoOutro: (r) => r.fumou === true && (r.momentos ?? []).includes('outro'),
  lutoOutro: (r) => (r.momentos ?? []).includes('outro'),
}

export function perguntaVisivel(pergunta, respostas = {}) {
  if (!pergunta.quando) return true
  return Object.entries(pergunta.quando).every(([campo, esperado]) =>
    CONDICOES[campo] ? CONDICOES[campo](respostas) : respostas[campo] === esperado,
  )
}

// Texto curto de uma resposta, para listas e linha do tempo.
export function textoResposta(pergunta, valor) {
  if (valor === null || valor === undefined || (Array.isArray(valor) && !valor.length)) return null
  if (pergunta.tipo === 'simnao') return valor ? 'Sim' : 'Não'
  if (pergunta.tipo === 'escala') return `${valor}/10`
  if (pergunta.tipo === 'hora' || pergunta.tipo === 'texto') return valor
  const rotulo = (v) => pergunta.opcoes.find((o) => o.valor === v)?.rotulo ?? v
  return Array.isArray(valor) ? valor.map(rotulo).join(', ') : rotulo(valor)
}

// Remove respostas de perguntas que ficaram escondidas (ex.: "quantos?" depois de mudar para "não fumei").
export function limparRespostas(mod, respostas) {
  const limpas = {}
  for (const p of mod.perguntas) {
    if (perguntaVisivel(p, respostas) && respostas[p.id] !== undefined) limpas[p.id] = respostas[p.id]
  }
  return limpas
}

export const CRISE_SINTOMAS = [
  { valor: 'coracao', rotulo: 'Coração acelerado' },
  { valor: 'ar', rotulo: 'Falta de ar' },
  { valor: 'tontura', rotulo: 'Tontura' },
  { valor: 'tremor', rotulo: 'Tremor' },
  { valor: 'suor', rotulo: 'Suor ou calafrio' },
  { valor: 'peito', rotulo: 'Aperto no peito' },
  { valor: 'formigamento', rotulo: 'Formigamento' },
  { valor: 'enjoo', rotulo: 'Enjoo' },
  { valor: 'irrealidade', rotulo: 'Sensação de irrealidade' },
  { valor: 'controle', rotulo: 'Medo de perder o controle' },
  { valor: 'morrer', rotulo: 'Medo de morrer' },
]

export const CRISE_DURACAO = [
  { valor: 5, rotulo: 'Menos de 10 min' },
  { valor: 20, rotulo: '10 a 30 min' },
  { valor: 45, rotulo: '30 min a 1h' },
  { valor: 90, rotulo: 'Mais de 1h' },
]

export const CRISE_LUGAR = [
  { valor: 'casa', rotulo: 'Em casa' },
  { valor: 'trabalho', rotulo: 'Trabalho ou estudo' },
  { valor: 'rua', rotulo: 'Na rua' },
  { valor: 'transporte', rotulo: 'No transporte' },
  { valor: 'lugar_cheio', rotulo: 'Lugar cheio' },
  { valor: 'outro', rotulo: 'Outro lugar' },
]

export const CRISE_ESTRATEGIAS = [
  { valor: 'respiracao', rotulo: 'Respiração' },
  { valor: 'aterramento', rotulo: 'Exercício 5-4-3-2-1' },
  { valor: 'saiu', rotulo: 'Saí do lugar' },
  { valor: 'ligou', rotulo: 'Falei com alguém' },
  { valor: 'medicacao', rotulo: 'Medicação' },
  { valor: 'agua', rotulo: 'Água ou banho' },
  { valor: 'esperou', rotulo: 'Esperei passar' },
]
