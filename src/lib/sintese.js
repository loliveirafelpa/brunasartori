// Síntese do período para o painel da psicóloga.
// Regra de ouro: só DESCREVE o que foi registrado e sugere temas de conversa.
// Nunca afirma causa ("X causou Y") nem interpreta clinicamente.
import { EMOCOES, SITUACOES } from '../data/checkinOpcoes'

const ANSIEDADE_ALTA = 7 // 7 ou mais na barra de 0 a 10
const SONO_RUIM = 2 // "Ruim" ou "Muito ruim"
const HUMOR_BAIXO = 2 // "Mal" ou "Muito mal"

const p2 = (n) => String(n).padStart(2, '0')
const paraIso = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`

// Lista de datas (AAAA-MM-DD) dos últimos `n` dias, do mais antigo para hoje.
export function diasDoPeriodo(n, hoje = new Date()) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(hoje)
    d.setDate(d.getDate() - (n - 1 - i))
    return paraIso(d)
  })
}

export function formatarDia(iso, opcoes = { weekday: 'short', day: '2-digit', month: '2-digit' }) {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d).toLocaleDateString('pt-BR', opcoes)
}

export const rotuloSituacao = (valor) => SITUACOES.find((s) => s.valor === valor)?.rotulo ?? valor
export const rotuloEmocao = (c) =>
  c.emocao === 'outra' && c.emocaoOutra ? c.emocaoOutra : EMOCOES.find((e) => e.valor === c.emocao)?.rotulo ?? c.emocao

function media(valores) {
  const v = valores.filter((x) => x !== null && x !== undefined)
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
}

const contar = (lista) => lista.reduce((acc, x) => ({ ...acc, [x]: (acc[x] ?? 0) + 1 }), {})
const ordenarContagem = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1])
const plural = (n, um, varios) => (n === 1 ? um : varios)
const trecho = (texto, max = 90) => (texto.length > max ? `${texto.slice(0, max).trimEnd()}…` : texto)

export function gerarSintese({ checkins, registros, reflexoes, dias }) {
  const periodo = new Set(dias)
  const doPeriodo = checkins.filter((c) => periodo.has(c.data)).sort((a, b) => a.data.localeCompare(b.data))
  const rpdPeriodo = registros.filter((r) => periodo.has(paraIso(new Date(r.ocorridoEm))))

  const ansiedadeAlta = doPeriodo.filter((c) => c.ansiedade >= ANSIEDADE_ALTA)
  const humorBaixo = doPeriodo.filter((c) => c.humor <= HUMOR_BAIXO)
  const comAcontecimento = doPeriodo.filter((c) => c.acontecimento)

  const indicadores = {
    registros: doPeriodo.length,
    dias: dias.length,
    humorMedio: media(doPeriodo.map((c) => c.humor)),
    diasAnsiedadeAlta: ansiedadeAlta.length,
    sonoQualidadeMedia: media(doPeriodo.map((c) => c.sonoQualidade)),
    sonoHorasMedia: media(doPeriodo.map((c) => c.sonoHoras)),
    energiaMedia: media(doPeriodo.map((c) => c.energia)),
    acontecimentos: comAcontecimento.length,
    registrosPensamento: rpdPeriodo.length,
  }

  const frases = []
  const temas = []

  if (!doPeriodo.length) {
    frases.push('Nenhum check-in registrado neste período.')
  } else {
    frases.push(`Check-in registrado em ${doPeriodo.length} de ${dias.length} dias.`)

    // Situações associadas aos dias de ansiedade alta
    if (ansiedadeAlta.length) {
      const total = ansiedadeAlta.length
      // "Em todos eles" / "Em 2 deles" — evita "em 3 deles" quando são os 3.
      const quantosDeles = (n) => (n === total ? (total === 2 ? 'Em ambos' : 'Em todos eles') : `Em ${n} deles`)
      let frase = `Ansiedade ou estresse de 7/10 ou mais em ${total} ${plural(total, 'dia', 'dias')}.`
      const [topo] = ordenarContagem(contar(ansiedadeAlta.flatMap((c) => c.situacoes)))
      if (topo && topo[1] >= 2) {
        frase += ` ${quantosDeles(topo[1])}, foi marcada a situação "${rotuloSituacao(topo[0]).toLowerCase()}".`
      }
      const comSonoRuim = ansiedadeAlta.filter((c) => c.sonoQualidade !== null && c.sonoQualidade <= SONO_RUIM).length
      if (comSonoRuim && total > 1) {
        frase += ` ${quantosDeles(comSonoRuim)}, o sono também foi registrado como ruim ou muito ruim.`
      } else if (comSonoRuim) {
        frase += ' Nesse dia, o sono também foi registrado como ruim ou muito ruim.'
      }
      frases.push(frase)
    }

    // Maior sequência de dias corridos (no calendário) com humor baixo
    const humorPorDia = Object.fromEntries(doPeriodo.map((c) => [c.data, c.humor]))
    let seq = 0
    let maiorSeq = 0
    for (const dia of dias) {
      seq = humorPorDia[dia] !== undefined && humorPorDia[dia] <= HUMOR_BAIXO ? seq + 1 : 0
      maiorSeq = Math.max(maiorSeq, seq)
    }
    if (humorBaixo.length) {
      const n = humorBaixo.length
      let complemento = '.'
      if (maiorSeq >= 2) complemento = maiorSeq === n ? ' seguidos.' : `, sendo ${maiorSeq} seguidos.`
      frases.push(`Humor registrado como "mal" ou "muito mal" em ${n} ${plural(n, 'dia', 'dias')}${complemento}`)
    }

    // Dia de melhor humor
    const melhor = [...doPeriodo].sort((a, b) => b.humor - a.humor || (b.sonoQualidade ?? 0) - (a.sonoQualidade ?? 0))[0]
    if (melhor && melhor.humor >= 4) {
      const sits = melhor.situacoes.map((s) => `"${rotuloSituacao(s).toLowerCase()}"`).join(', ')
      frases.push(`O dia com humor mais alto foi ${formatarDia(melhor.data, { weekday: 'long', day: '2-digit', month: '2-digit' })}${sits ? `, com ${sits} marcado` : ''}.`)
    }

    if (comAcontecimento.length) {
      frases.push(`${comAcontecimento.length} ${plural(comAcontecimento.length, 'acontecimento relevante descrito', 'acontecimentos relevantes descritos')}.`)
    }

    // Temas: acontecimentos de dias mais difíceis
    comAcontecimento
      .filter((c) => c.humor <= HUMOR_BAIXO || c.ansiedade >= ANSIEDADE_ALTA)
      .slice(0, 2)
      .forEach((c) =>
        temas.push(`Você gostaria de conversar sobre o que registrou ${formatarDia(c.data, { weekday: 'long' })}: “${trecho(c.acontecimento)}”?`),
      )

    const [sitTopo] = ordenarContagem(contar(doPeriodo.flatMap((c) => c.situacoes)))
    if (sitTopo && sitTopo[1] >= 2 && sitTopo[0] !== 'outra') {
      temas.push(`"${rotuloSituacao(sitTopo[0])}" foi marcado em ${sitTopo[1]} dias. Como você tem percebido essa área nestes dias?`)
    }
  }

  if (rpdPeriodo.length) {
    const [emoTopo] = ordenarContagem(contar(rpdPeriodo.map((r) => r.emocao.toLowerCase())))
    const intensidade = media(rpdPeriodo.map((r) => r.intensidade))
    frases.push(
      `${rpdPeriodo.length} ${plural(rpdPeriodo.length, 'registro de pensamento', 'registros de pensamento')}` +
        ` (emoção mais citada: ${emoTopo[0]}; intensidade média ${intensidade.toFixed(1).replace('.', ',')}/10).`,
    )
    const maisIntenso = [...rpdPeriodo].sort((a, b) => b.intensidade - a.intensidade)[0]
    temas.push(`Revisitar o registro de pensamento “${trecho(maisIntenso.pensamento, 70)}” (${maisIntenso.emocao.toLowerCase()}, ${maisIntenso.intensidade}/10).`)
  }

  const ultimaReflexao = reflexoes[0]
  if (ultimaReflexao?.objetivo) {
    temas.push(`Objetivo da semana: “${trecho(ultimaReflexao.objetivo)}”. Como foi colocá-lo em prática?`)
  }
  if (ultimaReflexao?.dificuldades) {
    temas.push(`Na reflexão semanal, apareceu como dificuldade: “${trecho(ultimaReflexao.dificuldades)}”`)
  }

  return { indicadores, frases, temas, checkinsDoPeriodo: doPeriodo, registrosDoPeriodo: rpdPeriodo }
}
