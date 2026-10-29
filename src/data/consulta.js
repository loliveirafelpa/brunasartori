// Horário fixo da consulta de cada paciente (fica na ficha, só a psicóloga vê).
// `consulta`: { diaSemana: 0–6 (0 = domingo), hora: 'HH:MM', frequencia: 'semanal' | 'quinzenal', referencia }
// `referencia` (só no quinzenal): a data de uma sessão, para saber em quais semanas a consulta cai.
import { deslocar, diaDaSemana, hojeLocal, paraIso } from '../lib/datas'

export const DIAS_SEMANA = [
  { valor: 1, rotulo: 'Segunda-feira', plural: 'Segundas-feiras' },
  { valor: 2, rotulo: 'Terça-feira', plural: 'Terças-feiras' },
  { valor: 3, rotulo: 'Quarta-feira', plural: 'Quartas-feiras' },
  { valor: 4, rotulo: 'Quinta-feira', plural: 'Quintas-feiras' },
  { valor: 5, rotulo: 'Sexta-feira', plural: 'Sextas-feiras' },
  { valor: 6, rotulo: 'Sábado', plural: 'Sábados' },
  { valor: 0, rotulo: 'Domingo', plural: 'Domingos' },
]

export const FREQUENCIAS_CONSULTA = [
  { valor: 'semanal', rotulo: 'Semanal' },
  { valor: 'quinzenal', rotulo: 'Quinzenal' },
]

// Formulário (components/CamposConsulta.jsx): diaSemana '' = sem horário fixo.
export const CONSULTA_VAZIA = { diaSemana: '', hora: '', frequencia: 'semanal', referencia: '' }

// Do banco para o formulário (null → campos vazios).
export const consultaParaForm = (c) =>
  c ? { diaSemana: String(c.diaSemana), hora: c.hora, frequencia: c.frequencia, referencia: c.referencia ?? '' } : CONSULTA_VAZIA

// Do formulário para o banco: sem dia ou sem horário, não há consulta fixa.
export function consultaDoForm(f) {
  if (f.diaSemana === '' || !f.hora) return null
  const diaSemana = Number(f.diaSemana)
  return {
    diaSemana,
    hora: f.hora,
    frequencia: f.frequencia,
    referencia: f.frequencia === 'quinzenal' ? f.referencia || proximoDiaDaSemana(diaSemana) : null,
  }
}

// A sessão de hoje continua sendo "a próxima" até 50 minutos depois do horário marcado.
const DURACAO_MIN = 50

// '09:00' → '9h00'
export const horaBr = (hora) => {
  const [h, m] = hora.split(':')
  return `${Number(h)}h${m}`
}

// Próxima data (AAAA-MM-DD) em que cai esse dia da semana, a partir de `inicio` (inclusive).
export function proximoDiaDaSemana(diaSemana, inicio = hojeLocal()) {
  return deslocar(inicio, (diaSemana - diaDaSemana(inicio) + 7) % 7)
}

const diasEntre = (a, b) => Math.round((new Date(`${b}T12:00`) - new Date(`${a}T12:00`)) / 86400000)

// Data e hora da próxima consulta (Date), ou null se não houver horário definido.
export function proximaConsulta(consulta, agora = new Date()) {
  if (!consulta || consulta.diaSemana === undefined || consulta.diaSemana === null || !consulta.hora) return null
  const [h, m] = consulta.hora.split(':').map(Number)
  let dia = proximoDiaDaSemana(consulta.diaSemana, paraIso(agora))
  const inicioDe = (iso) => {
    const [a, mes, d] = iso.split('-').map(Number)
    return new Date(a, mes - 1, d, h, m)
  }
  // Hoje, mas a sessão já terminou: passa para a semana seguinte.
  if (inicioDe(dia).getTime() + DURACAO_MIN * 60000 <= agora.getTime()) dia = deslocar(dia, 7)
  // Quinzenal: só nas semanas pares em relação à sessão de referência.
  if (consulta.frequencia === 'quinzenal' && consulta.referencia && (((diasEntre(consulta.referencia, dia) / 7) % 2) + 2) % 2 === 1) {
    dia = deslocar(dia, 7)
  }
  return inicioDe(dia)
}

// "Terças-feiras, às 9h00 · semanal"
export function rotuloConsulta(consulta) {
  if (!consulta || consulta.diaSemana === undefined || consulta.diaSemana === null || !consulta.hora) return null
  const dia = DIAS_SEMANA.find((d) => d.valor === consulta.diaSemana)
  return `${dia.plural}, às ${horaBr(consulta.hora)} · ${consulta.frequencia === 'quinzenal' ? 'quinzenal' : 'semanal'}`
}

// Partes da próxima consulta: { dia: 'hoje' | 'amanhã' | 'ter., 04/11', hora: '9h00', hoje: boolean }
export function partesProxima(data, agora = new Date()) {
  if (!data) return null
  const iso = paraIso(data)
  const hora = horaBr(`${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`)
  const hoje = paraIso(agora)
  if (iso === hoje) return { dia: 'hoje', hora, hoje: true }
  if (iso === deslocar(hoje, 1)) return { dia: 'amanhã', hora, hoje: false }
  return { dia: data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }), hora, hoje: false }
}

// "hoje, às 9h00" · "amanhã, às 14h00" · "ter., 04/11, às 9h00"
export function rotuloProxima(data, agora = new Date()) {
  const p = partesProxima(data, agora)
  return p && `${p.dia}, às ${p.hora}`
}
