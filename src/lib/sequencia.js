// Sequência de check-ins (a "ofensiva"): quantos dias seguidos o paciente registrou.
// A sequência continua viva enquanto o check-in de hoje ainda pode ser feito:
// se ontem foi registrado e hoje ainda não, ela não zera.
import { hojeLocal } from './checkinsApi'

const p2 = (n) => String(n).padStart(2, '0')

// Soma `n` dias a uma data AAAA-MM-DD (meio-dia evita surpresas com horário de verão).
function deslocar(iso, n) {
  const [a, m, d] = iso.split('-').map(Number)
  const r = new Date(a, m - 1, d + n, 12)
  return `${r.getFullYear()}-${p2(r.getMonth() + 1)}-${p2(r.getDate())}`
}

export function calcularSequencia(datas, hoje = hojeLocal()) {
  const feitos = new Set(datas)
  const feitoHoje = feitos.has(hoje)

  let atual = 0
  let dia = feitoHoje ? hoje : deslocar(hoje, -1)
  while (feitos.has(dia)) {
    atual++
    dia = deslocar(dia, -1)
  }

  let recorde = 0
  let corrida = 0
  let anterior = null
  for (const d of [...feitos].sort()) {
    corrida = anterior && deslocar(anterior, 1) === d ? corrida + 1 : 1
    recorde = Math.max(recorde, corrida)
    anterior = d
  }

  const semana = Array.from({ length: 7 }, (_, i) => {
    const data = deslocar(hoje, i - 6)
    return { data, feito: feitos.has(data), ehHoje: data === hoje }
  })

  return { atual, recorde, feitoHoje, total: feitos.size, semana }
}
