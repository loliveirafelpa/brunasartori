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

export async function atualizarMeuNome(userId, nome) {
  const { error } = await supabase.from('profiles').update({ nome }).eq('id', userId)
  if (error) throw error
}
