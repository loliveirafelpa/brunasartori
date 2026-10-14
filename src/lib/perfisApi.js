import { supabase } from './supabaseClient'

function deBanco(linha) {
  return {
    id: linha.id,
    role: linha.role,
    nome: linha.nome,
    registroPensamentosAtivo: linha.registro_pensamentos_ativo,
    acompanhamentoEncerradoEm: linha.acompanhamento_encerrado_em,
    createdAt: linha.created_at,
  }
}

export async function buscarMeuPerfil(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) throw error
  return deBanco(data)
}

// Só a Admin consegue ver outros perfis (garantido pelo RLS).
export async function listarPacientes() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'paciente')
    .order('nome')
  if (error) throw error
  return data.map(deBanco)
}

export async function buscarPerfil(id) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (error) throw error
  return deBanco(data)
}

// Só a Admin consegue alterar (garantido por gatilho no banco).
export async function definirRegistroPensamentos(id, ativo) {
  const { error } = await supabase.from('profiles').update({ registro_pensamentos_ativo: ativo }).eq('id', id)
  if (error) throw error
}

// Data (AAAA-MM-DD) para encerrar o acompanhamento ou null para reabrir. Só a Admin (gatilho no banco).
export async function definirEncerramento(id, data) {
  const { error } = await supabase.from('profiles').update({ acompanhamento_encerrado_em: data }).eq('id', id)
  if (error) throw error
}

export async function atualizarMeuNome(userId, nome) {
  const { error } = await supabase.from('profiles').update({ nome }).eq('id', userId)
  if (error) throw error
}
