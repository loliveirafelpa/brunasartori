import { supabase } from './supabaseClient'
import { hojeLocal } from './checkinsApi'

// Anotações da psicóloga nos tópicos do Resumo e nos gráficos. Só a Admin lê e grava (RLS).
// `origem` é o título legível do tópico ("Resumo · Humor", "Gráficos · Humor (1 a 5)"), usado na aba Anotações clínicas.

const deBanco = (l) => ({
  id: l.id,
  userId: l.user_id,
  topico: l.topico,
  origem: l.origem,
  data: l.data,
  texto: l.texto,
  updatedAt: l.updated_at,
})

// Sem `desde`, devolve todas as anotações do paciente.
export async function listarComentarios(userId, desde = '') {
  let consulta = supabase.from('comentarios_resumo').select('*').eq('user_id', userId)
  if (desde) consulta = consulta.gte('data', desde)
  const { data, error } = await consulta.order('created_at', { ascending: true })
  if (error) throw error
  return data.map(deBanco)
}

export async function salvarComentario(userId, { id, topico, origem, texto }) {
  const consulta = id
    ? supabase.from('comentarios_resumo').update({ texto: texto.trim() }).eq('id', id)
    : supabase.from('comentarios_resumo').insert({ user_id: userId, topico, origem: origem ?? null, texto: texto.trim(), data: hojeLocal() })
  const { data, error } = await consulta.select().single()
  if (error) throw error
  return deBanco(data)
}

export async function apagarComentario(id) {
  const { error } = await supabase.from('comentarios_resumo').delete().eq('id', id)
  if (error) throw error
}
