import { supabase } from './supabaseClient'

function deBanco(l) {
  return {
    id: l.id,
    userId: l.user_id,
    ocorridoEm: l.ocorrido_em,
    situacao: l.situacao,
    pensamento: l.pensamento,
    emocao: l.emocao,
    intensidade: l.intensidade,
    comportamento: l.comportamento,
  }
}

export async function listarRegistrosPensamento(userId, desde = null) {
  let consulta = supabase
    .from('registros_pensamento')
    .select('*')
    .eq('user_id', userId)
    .order('ocorrido_em', { ascending: false })
    .limit(50)
  if (desde) consulta = consulta.gte('ocorrido_em', desde)
  const { data, error } = await consulta
  if (error) throw error
  return data.map(deBanco)
}

export async function criarRegistroPensamento(r) {
  const { data, error } = await supabase
    .from('registros_pensamento')
    .insert({
      user_id: r.userId,
      situacao: r.situacao.trim(),
      pensamento: r.pensamento.trim(),
      emocao: r.emocao.trim(),
      intensidade: r.intensidade,
      comportamento: r.comportamento?.trim() || null,
    })
    .select()
    .single()
  if (error) throw error
  return deBanco(data)
}

export async function apagarRegistroPensamento(id) {
  const { error } = await supabase.from('registros_pensamento').delete().eq('id', id)
  if (error) throw error
}
