import { supabase } from './supabaseClient'
import { hojeLocal } from './checkinsApi'

// Comentários da psicóloga nos tópicos do Resumo. Só a Admin lê e grava (RLS).

const deBanco = (l) => ({ id: l.id, topico: l.topico, data: l.data, texto: l.texto })

export async function listarComentarios(userId, desde) {
  const { data, error } = await supabase
    .from('comentarios_resumo')
    .select('*')
    .eq('user_id', userId)
    .gte('data', desde)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data.map(deBanco)
}

export async function salvarComentario(userId, { id, topico, texto }) {
  const consulta = id
    ? supabase.from('comentarios_resumo').update({ texto: texto.trim() }).eq('id', id)
    : supabase.from('comentarios_resumo').insert({ user_id: userId, topico, texto: texto.trim(), data: hojeLocal() })
  const { data, error } = await consulta.select().single()
  if (error) throw error
  return deBanco(data)
}

export async function apagarComentario(id) {
  const { error } = await supabase.from('comentarios_resumo').delete().eq('id', id)
  if (error) throw error
}
