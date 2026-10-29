// Síntese dos módulos de hábitos e protocolos para o painel da psicóloga.
// Mesma regra de ouro da síntese principal: só DESCREVE o que foi registrado e sugere temas.
// Coincidências entre dias aparecem como coincidências, nunca como causa.
import { CRISE_ESTRATEGIAS, CRISE_LUGAR, CRISE_SINTOMAS, modulo, MODULOS } from '../data/modulos'
import { ESCALAS } from '../data/escalas'
import { formatarDia } from './sintese'
import { deslocar } from './datas'

const media = (valores) => {
  const v = valores.filter((x) => x !== null && x !== undefined)
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
}
const dec = (v, casas = 1) => v.toFixed(casas).replace('.', ',')
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`
const contar = (lista) => lista.reduce((acc, x) => ({ ...acc, [x]: (acc[x] ?? 0) + 1 }), {})
const topo = (lista) => Object.entries(contar(lista)).sort((a, b) => b[1] - a[1])[0] ?? null
const diaCurto = (iso) => formatarDia(iso, { weekday: 'short', day: '2-digit', month: '2-digit' })
const trecho = (texto, max = 160) => (texto.length > max ? `${texto.slice(0, max).trimEnd()}…` : texto)

// Rótulo de uma opção de pergunta de módulo, em minúsculas para caber no meio da frase.
function rotulo(moduloId, perguntaId, valor) {
  const p = modulo(moduloId).perguntas.find((x) => x.id === perguntaId)
  return (p.opcoes.find((o) => o.valor === valor)?.rotulo ?? String(valor)).toLowerCase()
}
const rotuloDe = (lista, valor) => (lista.find((o) => o.valor === valor)?.rotulo ?? valor).toLowerCase()

// "Momento mais marcado: “no estresse” (5 dias)."
function maisMarcado(moduloId, perguntaId, respostas, prefixo) {
  const t = topo(respostas.flatMap((r) => r[perguntaId] ?? []))
  return t && t[1] >= 2 ? ` ${prefixo}: “${rotulo(moduloId, perguntaId, t[0])}” (${plural(t[1], 'dia', 'dias')}).` : ''
}

// Comparação descritiva entre dois grupos de dias (ex.: ansiedade nos dias com e sem cigarro).
function comparar(nome, comLista, semLista, rotuloCom, rotuloSem, sufixo) {
  const a = media(comLista)
  const b = media(semLista)
  if (a === null || b === null) return ''
  return ` Média de ${nome}: ${dec(a)}${sufixo} ${rotuloCom} e ${dec(b)}${sufixo} ${rotuloSem}.`
}

// ---------------------------------------------------------------- Para o paciente

// Dias desde o último registro de cigarro (0 se fumou hoje). null se nunca registrou que fumou.
export function diasDesdeUltimoCigarro(checkins, hoje) {
  const ultima = checkins
    .filter((c) => c.modulos?.tabagismo?.fumou === true)
    .map((c) => c.data)
    .sort()
    .pop()
  if (!ultima) return null
  let n = 0
  while (deslocar(ultima, n) < hoje) n++
  return n
}

// Respostas que pedem o aviso de crise em destaque logo depois de salvar o check-in.
export function pedeAvisoDeCrise(modulos = {}) {
  return modulos.puerperio?.intrusivos === 2 || (modulos.bullying?.aconteceu ?? []).some((v) => v === 'ameaca' || v === 'fisico')
}

// ---------------------------------------------------------------- Para a psicóloga

// Cada função recebe os check-ins do período que têm respostas do módulo (`linhas`: { c, r }).
const SINTESES = {
  tabagismo(linhas) {
    const frases = []
    const temas = []
    const fumou = linhas.filter(({ r }) => r.fumou === true)
    const naoFumou = linhas.filter(({ r }) => r.fumou === false)
    let texto = `Fumou em ${fumou.length} de ${plural(linhas.length, 'dia respondido', 'dias respondidos')}.`
    const qtd = media(fumou.map(({ r }) => r.quantidade))
    if (qtd !== null) texto += ` Cerca de ${Math.round(qtd)} por dia nesses dias.`
    texto += maisMarcado('tabagismo', 'momentos', fumou.map(({ r }) => r), 'Momento mais marcado')
    const vontade = media(linhas.map(({ r }) => r.vontade))
    if (vontade !== null) texto += ` Vontade média: ${dec(vontade)}/10.`
    texto += comparar('ansiedade', fumou.map(({ c }) => c.ansiedade), naoFumou.map(({ c }) => c.ansiedade), 'nos dias com cigarro', 'nos dias sem', '/10')
    frases.push({ rotulo: 'Tabagismo', texto })

    const ultimo = fumou.map(({ c }) => c.data).sort().pop()
    const semDepois = ultimo ? naoFumou.filter(({ c }) => c.data > ultimo).length : naoFumou.length
    if (semDepois >= 2) {
      temas.push({
        origem: ultimo ? `Tabagismo · sem cigarro registrado desde ${diaCurto(ultimo)}` : 'Tabagismo · sem cigarro no período',
        citacao: null,
        pergunta: 'O que tem ajudado nesses dias sem fumar? E como tem sido a vontade?',
      })
    } else {
      const t = topo(fumou.flatMap(({ r }) => r.momentos ?? []))
      if (t && t[1] >= 3) {
        temas.push({
          origem: `Tabagismo · “${rotulo('tabagismo', 'momentos', t[0])}” em ${t[1]} dias`,
          citacao: null,
          pergunta: 'O que costuma acontecer logo antes de acender um cigarro nesses momentos?',
        })
      }
    }
    return { frases, temas }
  },

  alcool(linhas) {
    const frases = []
    const temas = []
    const bebeu = linhas.filter(({ r }) => r.bebeu === true)
    let texto = `Bebeu em ${bebeu.length} de ${plural(linhas.length, 'dia respondido', 'dias respondidos')}.`
    if (bebeu.length) {
      const total = bebeu.reduce((s, { r }) => s + (r.doses ?? 0), 0)
      texto += ` Cerca de ${Math.round(total)} doses no período.`
      const pesados = bebeu.filter(({ r }) => r.doses >= 5)
      if (pesados.length) texto += ` ${plural(pesados.length, 'dia', 'dias')} com 5 doses ou mais (${pesados.map(({ c }) => diaCurto(c.data)).join(', ')}).`
      const sozinho = bebeu.filter(({ r }) => r.companhia?.includes('sozinho')).length
      if (sozinho) texto += ` Sozinho(a) em ${plural(sozinho, 'deles', 'deles')}.`
      texto += maisMarcado('alcool', 'motivos', bebeu.map(({ r }) => r), 'Motivo mais marcado')
    }
    frases.push({ rotulo: 'Álcool', texto })

    const alivio = bebeu.filter(({ r }) => r.motivos?.includes('aliviar') || r.motivos?.includes('dormir'))
    if (alivio.length >= 2) {
      temas.push({
        origem: `Álcool · “aliviar uma emoção” ou “dormir” em ${alivio.length} dias`,
        citacao: null,
        pergunta: 'O que costuma estar acontecendo quando a bebida aparece como forma de alívio?',
      })
    }
    return { frases, temas }
  },

  puerperio(linhas) {
    const frases = []
    const temas = []
    const quaseNada = linhas.filter(({ r }) => r.descanso === 1).length
    const semAjuda = linhas.filter(({ r }) => r.apoio?.includes('ninguem'))
    const comAjuda = linhas.filter(({ r }) => r.apoio?.length && !r.apoio.includes('ninguem'))
    const tempoSi = linhas.filter(({ r }) => r.tempoSi === true).length
    let texto = `Descanso “quase nada” em ${plural(quaseNada, 'dia', 'dias')}. Sem ajuda em ${semAjuda.length} de ${plural(linhas.length, 'dia', 'dias')}. Tempo para si em ${plural(tempoSi, 'dia', 'dias')}.`
    const t = topo(linhas.map(({ r }) => r.vinculo).filter(Boolean))
    if (t) texto += ` Com o bebê, o mais marcado foi “${rotulo('puerperio', 'vinculo', t[0])}” (${plural(t[1], 'dia', 'dias')}).`
    texto += comparar('humor', semAjuda.map(({ c }) => c.humor), comAjuda.map(({ c }) => c.humor), 'nos dias sem ajuda', 'nos dias com ajuda', '/5')
    frases.push({ rotulo: 'Puerpério', texto })

    const intrusivos = linhas.filter(({ r }) => r.intrusivos > 0)
    if (intrusivos.length) {
      const muitas = intrusivos.filter(({ r }) => r.intrusivos === 2).length
      frases.push({
        rotulo: 'Pensamentos intrusivos',
        texto: `Marcados em ${plural(intrusivos.length, 'dia', 'dias')}${muitas ? `, ${muitas} com “muitas vezes”` : ''}.`,
      })
      temas.push({
        origem: `Puerpério · pensamentos assustadores em ${plural(intrusivos.length, 'dia', 'dias')}`,
        citacao: null,
        pergunta: 'Como têm sido esses pensamentos quando aparecem, e o que você faz com eles?',
      })
    }
    return { frases, temas }
  },

  crise(linhas, { crises }) {
    const frases = []
    const temas = []
    if (crises.length) {
      const sint = topo(crises.flatMap((c) => c.sintomas))
      const lugar = topo(crises.map((c) => c.lugar))
      const estr = topo(crises.flatMap((c) => c.estrategias))
      let texto = `${plural(crises.length, 'crise registrada', 'crises registradas')}, intensidade média ${dec(media(crises.map((c) => c.intensidade)))}/10.`
      if (sint) texto += ` Sintoma mais marcado: “${rotuloDe(CRISE_SINTOMAS, sint[0])}”.`
      if (lugar && lugar[1] >= 2) texto += ` Lugar mais marcado: “${rotuloDe(CRISE_LUGAR, lugar[0])}”.`
      if (estr) texto += ` O que mais fez: “${rotuloDe(CRISE_ESTRATEGIAS, estr[0])}”.`
      frases.push({ rotulo: 'Crises', texto })
      const comRelato = crises.find((c) => c.ajudou)
      if (comRelato) {
        temas.push({
          origem: `Crise · ${diaCurto(comRelato.ocorridoEm.slice(0, 10))} · ${comRelato.intensidade}/10`,
          citacao: trecho(comRelato.ajudou),
          pergunta: 'O que você percebeu no corpo e nos pensamentos logo antes dessa crise?',
        })
      }
    } else {
      frases.push({ rotulo: 'Crises', texto: 'Nenhuma crise registrada no período.' })
    }
    if (linhas.length) {
      const evitou = linhas.filter(({ r }) => r.evitou === true).length
      const medo = media(linhas.map(({ r }) => r.medoCrise))
      let texto = `Deixou de fazer algo por medo de passar mal em ${evitou} de ${plural(linhas.length, 'dia respondido', 'dias respondidos')}.`
      if (medo !== null) texto += ` Preocupação média com ter uma crise: ${dec(medo)}/10.`
      frases.push({ rotulo: 'Evitação', texto })
      if (evitou >= 2) {
        temas.push({ origem: `Evitação · ${plural(evitou, 'dia', 'dias')}`, citacao: null, pergunta: 'Que lugares ou situações você tem evitado? O que imagina que aconteceria lá?' })
      }
    }
    return { frases, temas }
  },

  bullying(linhas) {
    const frases = []
    const temas = []
    const aulas = linhas.filter(({ r }) => r.escola > 0)
    const comEpisodio = aulas.filter(({ r }) => (r.aconteceu ?? []).some((v) => v !== 'nada'))
    const semEpisodio = aulas.filter(({ r }) => r.aconteceu?.includes('nada'))
    let texto = `Algo chato com colegas em ${comEpisodio.length} de ${plural(aulas.length, 'dia de aula respondido', 'dias de aula respondidos')}.`
    texto += maisMarcado('bullying', 'aconteceu', comEpisodio.map(({ r }) => r), 'O mais marcado')
    texto += maisMarcado('bullying', 'onde', comEpisodio.map(({ r }) => r), 'Onde mais')
    texto += comparar('vontade de ir à escola', comEpisodio.map(({ r }) => r.vontade), semEpisodio.map(({ r }) => r.vontade), 'nos dias com episódio', 'nos demais', '/10')
    frases.push({ rotulo: 'Escola', texto })

    const naoContou = comEpisodio.filter(({ r }) => r.contou?.includes('ninguem')).length
    if (comEpisodio.length) {
      frases.push({ rotulo: 'Pedir ajuda', texto: `Não contou para ninguém em ${naoContou} dos ${plural(comEpisodio.length, 'dia com episódio', 'dias com episódio')}.` })
    }
    if (naoContou >= 2) {
      temas.push({ origem: `Escola · não contou para ninguém em ${naoContou} dias`, citacao: null, pergunta: 'Quem poderia ser uma pessoa de confiança para contar quando algo acontecer?' })
    }
    return { frases, temas }
  },

  luto(linhas) {
    const frases = []
    const temas = []
    const saudade = media(linhas.map(({ r }) => r.saudade))
    const intensos = linhas.filter(({ r }) => r.saudade >= 8)
    let texto = saudade !== null ? `Saudade média de ${dec(saudade)}/10, com 8 ou mais em ${plural(intensos.length, 'dia', 'dias')}.` : ''
    texto += maisMarcado('luto', 'momentos', linhas.map(({ r }) => ({ momentos: (r.momentos ?? []).filter((m) => m !== 'nenhum') })), 'Momento mais difícil')
    const rotina = media(linhas.map(({ r }) => r.rotina))
    if (rotina !== null) texto += ` Conseguiu fazer “quase tudo” ou “tudo” em ${linhas.filter(({ r }) => r.rotina >= 3).length} de ${plural(linhas.filter(({ r }) => r.rotina).length, 'dia', 'dias')}.`
    const memoria = linhas.filter(({ r }) => r.memoria === true).length
    if (memoria) texto += ` Fez algo para lembrar a pessoa com carinho em ${plural(memoria, 'dia', 'dias')}.`
    frases.push({ rotulo: 'Luto', texto: texto.trim() })
    const data = linhas.find(({ r }) => r.momentos?.includes('data'))
    if (data) {
      temas.push({ origem: `Luto · data especial em ${diaCurto(data.c.data)}`, citacao: data.c.acontecimento ? trecho(data.c.acontecimento) : null, pergunta: 'Como foi atravessar esse dia?' })
    }
    return { frases, temas }
  },

  burnout(linhas) {
    const frases = []
    const temas = []
    const trabalhados = linhas.filter(({ r }) => r.horas > 0)
    const longos = trabalhados.filter(({ r }) => r.horas > 10)
    const semPausa = trabalhados.filter(({ r }) => r.pausas === false).length
    const naoDesligou = trabalhados.filter(({ r }) => r.desligar === 'nao').length
    let texto = `Trabalhou em ${trabalhados.length} de ${plural(linhas.length, 'dia respondido', 'dias respondidos')}`
    texto += longos.length ? `, ${longos.length} com mais de 10h.` : '.'
    if (trabalhados.length) texto += ` Sem pausas em ${semPausa} e sem conseguir se desligar em ${plural(naoDesligou, 'dia', 'dias')}.`
    texto += maisMarcado('burnout', 'sentimento', trabalhados.map(({ r }) => ({ sentimento: [r.sentimento].filter(Boolean) })), 'Sentimento mais marcado')
    texto += comparar('energia', longos.map(({ c }) => c.energia), trabalhados.filter(({ r }) => r.horas <= 10).map(({ c }) => c.energia), 'nos dias com mais de 10h', 'nos demais dias de trabalho', '/5')
    frases.push({ rotulo: 'Trabalho', texto })
    if (naoDesligou >= 3) {
      temas.push({ origem: `Trabalho · não conseguiu se desligar em ${naoDesligou} dias`, citacao: null, pergunta: 'O que fica “ligado” depois do expediente? Que limite seria possível experimentar nesta semana?' })
    }
    return { frases, temas }
  },

  insonia(linhas) {
    const frases = []
    const latencia = media(linhas.map(({ r }) => r.latencia))
    const despertares = media(linhas.map(({ r }) => r.despertares))
    // Tempo na cama: da hora de deitar (noite anterior) até a hora de sair da cama.
    const minutos = (h) => {
      const [hh, mm] = h.split(':').map(Number)
      return hh * 60 + mm
    }
    const naCama = linhas
      .filter(({ r }) => r.deitou && r.levantou)
      .map(({ c, r }) => ({ c, min: (minutos(r.levantou) - minutos(r.deitou) + 1440) % 1440 }))
    const tempoCama = media(naCama.map((x) => x.min))
    const eficiencia = media(naCama.filter((x) => x.c.sonoHoras && x.min).map((x) => Math.min(1, (x.c.sonoHoras * 60) / x.min)))
    let texto = ''
    if (latencia !== null) texto += `Levou em média ${Math.round(latencia)} min para pegar no sono`
    if (despertares !== null) texto += ` e acordou ${dec(despertares)} ${despertares === 1 ? 'vez' : 'vezes'} por noite.`
    if (tempoCama !== null) texto += ` Tempo na cama: ${dec(tempoCama / 60)}h em média.`
    if (eficiencia !== null) texto += ` Eficiência do sono estimada: ${Math.round(eficiencia * 100)}% (horas dormidas ÷ tempo na cama).`
    const cochilos = linhas.filter(({ r }) => r.cochilo === true).length
    const cafeina = linhas.filter(({ r }) => r.cafeina === true).length
    texto += ` Cochilou em ${plural(cochilos, 'dia', 'dias')}; cafeína depois das 16h em ${plural(cafeina, 'dia', 'dias')}.`
    frases.push({ rotulo: 'Diário do sono', texto: texto.trim() })
    return { frases, temas: [] }
  },
}

// Questionários: último resultado de cada tipo, com o anterior para comparação.
function resumirEscalas(escalas) {
  return Object.values(ESCALAS)
    .map((escala) => {
      const doTipo = escalas.filter((e) => e.tipo === escala.id).sort((a, b) => b.data.localeCompare(a.data))
      return doTipo.length ? { escala, ultimo: doTipo[0], anterior: doTipo[1] ?? null, historico: doTipo } : null
    })
    .filter(Boolean)
}

// `checkins`: do período; `crises` e `escalas`: do paciente (filtradas aqui pelo período quando faz sentido).
export function gerarSinteseModulos({ perfil, checkins, crises = [], escalas = [], dias }) {
  const periodo = new Set(dias)
  const crisesPeriodo = crises.filter((c) => periodo.has(c.ocorridoEm.slice(0, 10)))
  const frases = []
  const temas = []
  const alertas = []

  for (const m of MODULOS) {
    const linhas = checkins.filter((c) => c.modulos?.[m.id]).map((c) => ({ c, r: c.modulos[m.id] }))
    const temCrises = m.id === 'crise' && crisesPeriodo.length
    if (!perfil.modulos?.[m.id] && !linhas.length && !temCrises) continue
    if (!linhas.length && !temCrises) {
      frases.push({ rotulo: m.nome, texto: 'Sem respostas neste período.' })
      continue
    }
    const r = SINTESES[m.id](linhas, { crises: crisesPeriodo })
    frases.push(...r.frases)
    temas.push(...r.temas)
  }

  // Pontos para conferir com atenção (sempre descritivos, nunca diagnóstico).
  for (const e of escalas.filter((x) => periodo.has(x.data))) {
    if (itemRiscoMarcado(e)) {
      const escala = ESCALAS[e.tipo]
      const opcao = escala.itens[escala.itemRisco].opcoes.find((o) => o.pontos === e.respostas[escala.itemRisco])
      alertas.push(`${escala.nome} de ${diaCurto(e.data)}: o item sobre pensar em se machucar foi respondido com “${opcao.rotulo.toLowerCase()}”.`)
    }
  }
  for (const c of checkins) {
    const ameaca = ameacaNaEscola(c)
    if (ameaca.length) alertas.push(`${diaCurto(c.data)}: marcou “${ameaca.map((v) => rotulo('bullying', 'aconteceu', v)).join('” e “')}” na escola.`)
    if (intrusivosFrequentes(c)) alertas.push(`${diaCurto(c.data)}: pensamentos assustadores “muitas vezes”.`)
  }

  return { frases, temas, alertas, escalas: resumirEscalas(escalas), crisesDoPeriodo: crisesPeriodo }
}

// Regras dos pontos de atenção, usadas no Resumo ("Para conferir com atenção") e na lista de pacientes.
const itemRiscoMarcado = (e) => {
  const escala = ESCALAS[e.tipo]
  return escala?.itemRisco !== undefined && e.respostas[escala.itemRisco] > 0
}
const ameacaNaEscola = (c) => (c.modulos?.bullying?.aconteceu ?? []).filter((v) => v === 'ameaca' || v === 'fisico')
const intrusivosFrequentes = (c) => c.modulos?.puerperio?.intrusivos === 2

// A partir de quantas crises na semana o paciente aparece em "Precisam de atenção".
export const CRISES_PARA_ATENCAO = 2

// Sinais clínicos de um paciente nos registros recebidos (a lista usa os últimos 7 dias).
// Etiquetas curtas e descritivas, para a lista de pacientes.
export function sinaisClinicos({ checkins = [], crises = [], escalas = [] }) {
  const sinais = []
  if (escalas.some(itemRiscoMarcado)) sinais.push('EPDS: item de risco marcado')
  if (crises.length >= CRISES_PARA_ATENCAO) sinais.push(`${crises.length} crises na semana`)
  if (checkins.some((c) => intrusivosFrequentes(c))) sinais.push('Pensamentos assustadores “muitas vezes”')
  if (checkins.some((c) => ameacaNaEscola(c).length)) sinais.push('Ameaça ou agressão na escola')
  return sinais
}
