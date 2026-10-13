import { supabase } from './supabaseClient'

// Anotações clínicas e medicações: exclusivas da psicóloga (RLS só libera a Admin).

const anotacaoDeBanco = (l) => ({ id: l.id, data: l.data, texto: l.texto, updatedAt: l.updated_at })

export async function listarAnotacoes(userId) {
  const { data, error } = await supabase
    .from('anotacoes_clinicas')
    .select('*')
    .eq('user_id', userId)
    .order('data', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(anotacaoDeBanco)
}

export async function salvarAnotacao(userId, { id, data, texto }) {
  const linha = { user_id: userId, data, texto: texto.trim() }
  const consulta = id
    ? supabase.from('anotacoes_clinicas').update(linha).eq('id', id)
    : supabase.from('anotacoes_clinicas').insert(linha)
  const { data: salva, error } = await consulta.select().single()
  if (error) throw error
  return anotacaoDeBanco(salva)
}

export async function apagarAnotacao(id) {
  const { error } = await supabase.from('anotacoes_clinicas').delete().eq('id', id)
  if (error) throw error
}

const medicacaoDeBanco = (l) => ({
  id: l.id,
  nome: l.nome,
  dosagem: l.dosagem,
  posologia: l.posologia,
  prescritoPor: l.prescrito_por,
  inicio: l.inicio,
  fim: l.fim,
  observacoes: l.observacoes,
})

const vazioParaNulo = (v) => (typeof v === 'string' ? v.trim() || null : v ?? null)

export async function listarMedicacoes(userId) {
  const { data, error } = await supabase
    .from('medicacoes')
    .select('*')
    .eq('user_id', userId)
    .order('inicio', { ascending: false, nullsFirst: false })
  if (error) throw error
  return data.map(medicacaoDeBanco)
}

export async function salvarMedicacao(userId, m) {
  const linha = {
    user_id: userId,
    nome: m.nome.trim(),
    dosagem: vazioParaNulo(m.dosagem),
    posologia: vazioParaNulo(m.posologia),
    prescrito_por: vazioParaNulo(m.prescritoPor),
    inicio: vazioParaNulo(m.inicio),
    fim: vazioParaNulo(m.fim),
    observacoes: vazioParaNulo(m.observacoes),
  }
  const consulta = m.id ? supabase.from('medicacoes').update(linha).eq('id', m.id) : supabase.from('medicacoes').insert(linha)
  const { data, error } = await consulta.select().single()
  if (error) throw error
  return medicacaoDeBanco(data)
}

export async function apagarMedicacao(id) {
  const { error } = await supabase.from('medicacoes').delete().eq('id', id)
  if (error) throw error
}
