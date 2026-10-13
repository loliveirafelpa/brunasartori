import { supabase } from './supabaseClient'

// Objetivos definidos pela psicóloga. A Admin grava; o paciente só lê (RLS).

export async function buscarObjetivosTerapeuticos(userId) {
  const { data, error } = await supabase.from('objetivos_terapeuticos').select('texto, updated_at').eq('user_id', userId).limit(1)
  if (error) throw error
  return data[0] ? { texto: data[0].texto, updatedAt: data[0].updated_at } : null
}

// Texto vazio apaga os objetivos.
export async function salvarObjetivosTerapeuticos(userId, texto) {
  const limpo = texto.trim()
  const consulta = limpo
    ? supabase.from('objetivos_terapeuticos').upsert({ user_id: userId, texto: limpo }, { onConflict: 'user_id' })
    : supabase.from('objetivos_terapeuticos').delete().eq('user_id', userId)
  const { error } = await consulta
  if (error) throw error
}

const objetivoSemanaDeBanco = (l) => ({ id: l.id, semanaInicio: l.semana_inicio, texto: l.texto, updatedAt: l.updated_at })

export async function buscarObjetivoSemana(userId, semanaInicio) {
  const { data, error } = await supabase
    .from('objetivos_semana')
    .select('*')
    .eq('user_id', userId)
    .eq('semana_inicio', semanaInicio)
    .limit(1)
  if (error) throw error
  return data[0] ? objetivoSemanaDeBanco(data[0]) : null
}

export async function listarObjetivosSemana(userId, limite = 12) {
  const { data, error } = await supabase
    .from('objetivos_semana')
    .select('*')
    .eq('user_id', userId)
    .order('semana_inicio', { ascending: false })
    .limit(limite)
  if (error) throw error
  return data.map(objetivoSemanaDeBanco)
}

// Texto vazio apaga o objetivo daquela semana.
export async function salvarObjetivoSemana(userId, semanaInicio, texto) {
  const limpo = texto.trim()
  const consulta = limpo
    ? supabase
        .from('objetivos_semana')
        .upsert({ user_id: userId, semana_inicio: semanaInicio, texto: limpo }, { onConflict: 'user_id,semana_inicio' })
    : supabase.from('objetivos_semana').delete().eq('user_id', userId).eq('semana_inicio', semanaInicio)
  const { error } = await consulta
  if (error) throw error
}
