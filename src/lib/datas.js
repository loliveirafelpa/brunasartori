// Datas locais do paciente (não UTC), no formato AAAA-MM-DD.
const p2 = (n) => String(n).padStart(2, '0')
export const paraIso = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`

export const hojeLocal = () => paraIso(new Date())

// Soma `n` dias a uma data AAAA-MM-DD (meio-dia evita surpresas com horário de verão).
export function deslocar(iso, n) {
  const [a, m, d] = iso.split('-').map(Number)
  return paraIso(new Date(a, m - 1, d + n, 12))
}

export const diasAtras = (n) => deslocar(hojeLocal(), -n)

// Dia da semana de uma data AAAA-MM-DD (0 = domingo).
export function diaDaSemana(iso) {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d, 12).getDay()
}
