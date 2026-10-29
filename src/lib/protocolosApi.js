import { supabase } from './supabaseClient'
import { hojeLocal, paraIso } from './datas'

// Questionários periódicos (EPDS, GAD-7) e crises de ansiedade registradas.
// Tabelas `questionarios` e `crises`: RLS do próprio paciente + leitura pela Admin.
// A pontuação total do questionário é calculada no banco.

// ---------------------------------------------------------------- Questionários

const questionarioDeBanco = (l) => ({
  id: l.id,
  userId: l.user_id,
  tipo: l.tipo,
  data: l.data,
  respostas: l.respostas,
  total: l.total,
  createdAt: new Date(l.created_at).toISOString(), // mesmo formato de ativadaEm/pedidoEm, para comparar
})

export async function listarQuestionarios(userId) {
  const { data, error } = await supabase
    .from('questionarios')
    .select('*')
    .eq('user_id', userId)
    .order('data', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(questionarioDeBanco)
}

// Questionários de todos os pacientes a partir de uma data (lista de pacientes: sinais de atenção). Só a Admin (RLS).
export async function listarQuestionariosDeTodos(desde) {
  const { data, error } = await supabase.from('questionarios').select('*').gte('data', desde)
  if (error) throw error
  return data.map(questionarioDeBanco)
}

// `respostas`: a pontuação de cada item, na ordem do questionário.
export async function salvarQuestionario(userId, tipo, respostas) {
  const { data, error } = await supabase
    .from('questionarios')
    .insert({ user_id: userId, tipo, data: hojeLocal(), respostas })
    .select()
    .single()
  if (error) throw error
  return questionarioDeBanco(data)
}

// "Responder mais tarde": o aviso do questionário pendente some só até o dia seguinte.
export async function listarAdiadosHoje(userId) {
  const { data, error } = await supabase
    .from('questionarios_adiados')
    .select('tipo')
    .eq('user_id', userId)
    .eq('dia', hojeLocal())
  if (error) throw error
  return data.map((l) => l.tipo)
}

export async function adiarQuestionarios(userId, tipos) {
  const dia = hojeLocal()
  const { error } = await supabase
    .from('questionarios_adiados')
    .upsert(tipos.map((tipo) => ({ user_id: userId, tipo, dia })), { onConflict: 'user_id,tipo' })
  if (error) throw error
}

// ---------------------------------------------------------------- Crises

// Instante no fuso do aparelho ('2026-10-29T22:15:00-03:00'): os 10 primeiros caracteres são o dia local.
function instanteLocal(iso) {
  const d = new Date(iso)
  const p = (n) => String(Math.abs(n)).padStart(2, '0')
  const fuso = -d.getTimezoneOffset()
  return `${paraIso(d)}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}${fuso >= 0 ? '+' : '-'}${p(Math.trunc(fuso / 60))}:${p(fuso % 60)}`
}

const criseDeBanco = (l) => ({
  id: l.id,
  userId: l.user_id,
  ocorridoEm: instanteLocal(l.ocorrido_em),
  intensidade: l.intensidade,
  duracao: l.duracao,
  lugar: l.lugar,
  sintomas: l.sintomas ?? [],
  estrategias: l.estrategias ?? [],
  ajudou: l.ajudou,
  createdAt: l.created_at,
})

// Início do dia local (AAAA-MM-DD) como instante, para filtrar `ocorrido_em`.
const inicioDoDia = (iso) => {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d).toISOString()
}

// Crises de todos os pacientes a partir de uma data (lista de pacientes: sinais de atenção). Só a Admin (RLS).
export async function listarCrisesDeTodos(desde) {
  const { data, error } = await supabase.from('crises').select('*').gte('ocorrido_em', inicioDoDia(desde))
  if (error) throw error
  return data.map(criseDeBanco)
}

// `desde`: instante (ISO) a partir do qual listar; sem ele, todas.
export async function listarCrises(userId, desde = null) {
  let consulta = supabase.from('crises').select('*').eq('user_id', userId)
  if (desde) consulta = consulta.gte('ocorrido_em', desde)
  const { data, error } = await consulta.order('ocorrido_em', { ascending: false })
  if (error) throw error
  return data.map(criseDeBanco)
}

export async function registrarCrise(userId, crise) {
  const { data, error } = await supabase
    .from('crises')
    .insert({
      user_id: userId,
      ocorrido_em: crise.ocorridoEm,
      intensidade: crise.intensidade,
      duracao: crise.duracao,
      lugar: crise.lugar,
      sintomas: crise.sintomas ?? [],
      estrategias: crise.estrategias ?? [],
      ajudou: crise.ajudou?.trim() || null,
    })
    .select()
    .single()
  if (error) throw error
  return criseDeBanco(data)
}

export async function apagarCrise(id) {
  const { error } = await supabase.from('crises').delete().eq('id', id)
  if (error) throw error
}
