import { supabase } from './supabaseClient'

function deBanco(linha) {
  return {
    id: linha.id,
    role: linha.role,
    nome: linha.nome,
    modulos: linha.modulos ?? {}, // { tabagismo: true, ... } (ver data/modulos.js)
    escalas: linha.escalas ?? {}, // { epds: { frequencia, ativadaEm, pedidoEm } } (ver data/escalas.js)
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

async function lerJson(id, coluna) {
  const { data, error } = await supabase.from('profiles').select(coluna).eq('id', id).single()
  if (error) throw error
  return data[coluna] ?? {}
}

// Liga ou desliga um módulo/protocolo (ver data/modulos.js) para o paciente. Só a Admin (gatilho no banco).
export async function definirModulo(id, moduloId, ativo) {
  const modulos = { ...(await lerJson(id, 'modulos')), [moduloId]: ativo }
  const { error } = await supabase.from('profiles').update({ modulos }).eq('id', id)
  if (error) throw error
}

// Liga, ajusta ou desliga (`config` null) o questionário de um módulo. Só a Admin (gatilho no banco).
// `config`: { frequencia: 'unica' | 14 | 30, ativadaEm, pedidoEm }.
export async function definirEscala(id, escalaId, config) {
  const escalas = { ...(await lerJson(id, 'escalas')) }
  if (config) escalas[escalaId] = config
  else delete escalas[escalaId]
  const { error } = await supabase.from('profiles').update({ escalas }).eq('id', id)
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
