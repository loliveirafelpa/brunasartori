// Dados e frases da aba "Gráficos" do painel da psicóloga.
// Mesma regra da síntese: só descreve o que foi registrado. Comparações entre grupos de dias
// mostram coincidências e o número de dias de cada grupo — nunca causa.
import { SITUACOES, EMOCOES } from '../data/checkinOpcoes'
import { diaDaSemana } from './datas'

const media = (valores) => {
  const v = valores.filter((x) => x !== null && x !== undefined)
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
}
const dec = (v) => (v === null ? '—' : v.toFixed(1).replace('.', ','))

// { dia: valor } a partir dos check-ins, para uma série do gráfico diário.
export const porDia = (checkins, ler) => Object.fromEntries(checkins.map((c) => [c.data, ler(c) ?? null]))

// Média do período e tendência: a média da primeira metade dos registros comparada com a da segunda.
// Diferença menor que 8% da escala conta como "estável". Com menos de 6 registros, não há tendência.
// `amplitude`: tamanho da escala (ex.: 4 para humor de 1 a 5); sem ela, usa o maior valor registrado.
export function resumoSerie(dias, valores, amplitude) {
  const comValor = dias.map((d) => valores[d]).filter((v) => v !== null && v !== undefined)
  if (!comValor.length) return null
  const geral = media(comValor)
  if (comValor.length < 6) return { media: geral, tendencia: null }
  const meio = Math.floor(comValor.length / 2)
  const inicio = media(comValor.slice(0, meio))
  const fim = media(comValor.slice(-meio))
  const escala = amplitude ?? Math.max(1, ...comValor)
  const direcao = Math.abs(fim - inicio) < escala * 0.08 ? 'estavel' : fim > inicio ? 'subindo' : 'descendo'
  return { media: geral, tendencia: { direcao, inicio, fim } }
}

// Quantos dias o paciente marcou cada humor (do melhor para o pior).
export function distribuicaoHumor(checkins, humores) {
  const total = checkins.filter((c) => c.humor).length
  return [...humores]
    .sort((a, b) => b.valor - a.valor)
    .map((h) => {
      const n = checkins.filter((c) => c.humor === h.valor).length
      const pct = total ? Math.round((n / total) * 100) : 0
      return { rotulo: `${h.emoji} ${h.rotulo}`, valor: n, detalhe: `${n} ${n === 1 ? 'dia' : 'dias'} · ${pct}% dos check-ins` }
    })
}

// Ansiedade média nos dias em que cada situação foi marcada (só situações com 2 dias ou mais).
export function ansiedadePorSituacao(checkins) {
  const comAnsiedade = checkins.filter((c) => c.ansiedade !== null)
  const geral = media(comAnsiedade.map((c) => c.ansiedade))
  const itens = SITUACOES.filter((s) => s.valor !== 'outra')
    .map((s) => {
      const dias = comAnsiedade.filter((c) => c.situacoes.includes(s.valor))
      return { rotulo: s.rotulo, valor: media(dias.map((c) => c.ansiedade)), n: dias.length }
    })
    .filter((i) => i.n >= 2)
    .sort((a, b) => b.valor - a.valor)
    .map((i) => ({ ...i, detalhe: `${i.n} dias com “${i.rotulo.toLowerCase()}” · ansiedade média ${dec(i.valor)}/10` }))
  return { itens, geral }
}

// Humor médio nos dias depois de uma noite ruim e nos demais (só quando os dois grupos têm 3 dias ou mais).
// O próprio check-in pergunta "Como foi seu sono na última noite?", então humor e sono vêm do mesmo registro.
export function humorPorSono(checkins) {
  const comSono = checkins.filter((c) => c.sonoQualidade)
  const ruim = comSono.filter((c) => c.sonoQualidade <= 2)
  const outras = comSono.filter((c) => c.sonoQualidade > 2)
  if (ruim.length < 3 || outras.length < 3) return null
  return [
    { rotulo: 'Depois de noite ruim', valor: media(ruim.map((c) => c.humor)), n: ruim.length },
    { rotulo: 'Depois de noite regular ou boa', valor: media(outras.map((c) => c.humor)), n: outras.length },
  ]
}

// Energia média nos dias com e sem movimento (só quando os dois grupos têm 3 dias ou mais).
export function energiaPorMovimento(checkins) {
  const com = checkins.filter((c) => c.exercicio === true)
  const sem = checkins.filter((c) => c.exercicio === false)
  if (com.length < 3 || sem.length < 3) return null
  return [
    { rotulo: 'Dias com movimento', valor: media(com.map((c) => c.energia)), n: com.length },
    { rotulo: 'Dias sem movimento', valor: media(sem.map((c) => c.energia)), n: sem.length },
  ]
}

// Humor médio por dia da semana (padrões de rotina: fins de semana, dias de trabalho…).
export function humorPorDiaDaSemana(checkins) {
  const nomes = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
  return nomes
    .map((rotulo, i) => {
      const dias = checkins.filter((c) => (diaDaSemana(c.data) + 6) % 7 === i)
      return { rotulo, valor: media(dias.map((c) => c.humor)), n: dias.length }
    })
    .filter((d) => d.n > 0)
    .map((d) => ({ ...d, detalhe: `${d.n} ${d.n === 1 ? 'registro' : 'registros'} · humor médio ${dec(d.valor)}/5` }))
}

export function emocoesMaisRegistradas(checkins) {
  return EMOCOES.map((e) => {
    const n = checkins.filter((c) => c.emocao === e.valor).length
    return { rotulo: e.rotulo, valor: n, detalhe: `${n} ${n === 1 ? 'dia' : 'dias'}` }
  })
    .filter((e) => e.valor > 0)
    .sort((a, b) => b.valor - a.valor)
}

// Série principal de cada módulo no gráfico diário.
export const SERIES_MODULOS = {
  tabagismo: { titulo: 'Cigarros por dia (estimativa)', tipo: 'colunas', ler: (r) => (r.fumou === false ? 0 : r.quantidade), rotuloValor: 'Cigarros' },
  alcool: { titulo: 'Doses por dia', tipo: 'colunas', ler: (r) => (r.bebeu === false ? 0 : r.doses), rotuloValor: 'Doses', referencia: { valor: 5, rotulo: '5 doses' } },
  puerperio: { titulo: 'Descanso (1 = quase nada · 4 = bem)', tipo: 'linha', ler: (r) => r.descanso, min: 1, max: 4, rotuloValor: 'Descanso' },
  crise: { titulo: 'Preocupação com ter uma crise (0 a 10)', tipo: 'linha', ler: (r) => r.medoCrise, max: 10, rotuloValor: 'Preocupação' },
  bullying: { titulo: 'Vontade de ir à escola (0 a 10)', tipo: 'linha', ler: (r) => r.vontade, max: 10, rotuloValor: 'Vontade' },
  luto: { titulo: 'Saudade (0 a 10)', tipo: 'linha', ler: (r) => r.saudade, max: 10, rotuloValor: 'Saudade' },
  burnout: { titulo: 'Horas trabalhadas (estimativa)', tipo: 'colunas', ler: (r) => r.horas, rotuloValor: 'Horas', referencia: { valor: 8, rotulo: '8 horas' }, unidade: 'h' },
  insonia: { titulo: 'Minutos para pegar no sono (estimativa)', tipo: 'linha', ler: (r) => r.latencia, rotuloValor: 'Minutos', unidade: ' min' },
}
