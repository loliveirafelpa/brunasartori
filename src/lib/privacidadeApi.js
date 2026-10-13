import { supabase } from './supabaseClient'

// Direitos do paciente sobre os próprios dados (LGPD, art. 18): acesso/portabilidade,
// eliminação do que ele registrou e pedido de encerramento da conta.

async function todos(tabela, userId, coluna = 'user_id') {
  const { data, error } = await supabase.from(tabela).select('*').eq(coluna, userId)
  if (error) throw error
  return data
}

// Tudo o que o paciente pode ver sobre si, num objeto pronto para virar arquivo.
export async function exportarMeusDados(userId) {
  const [perfil, consentimentos, checkins, reflexoes, pensamentos, objetivos, combinados, solicitacoes] = await Promise.all([
    todos('profiles', userId, 'id'),
    todos('consentimentos', userId),
    todos('checkins', userId),
    todos('reflexoes_semanais', userId),
    todos('registros_pensamento', userId),
    todos('objetivos_terapeuticos', userId),
    todos('objetivos_semana', userId),
    todos('solicitacoes_privacidade', userId),
  ])
  return {
    gerado_em: new Date().toISOString(),
    perfil: perfil[0] ?? null,
    consentimentos,
    checkins,
    reflexoes_semanais: reflexoes,
    registros_de_pensamento: pensamentos,
    objetivos_terapeuticos: objetivos[0] ?? null,
    combinados_na_sessao: combinados,
    solicitacoes: solicitacoes,
  }
}

// Apaga o que o próprio paciente registrou. Anotações e ficha da psicóloga não são afetadas.
export async function apagarMeusRegistros(userId) {
  for (const tabela of ['checkins', 'reflexoes_semanais', 'registros_pensamento']) {
    const { error } = await supabase.from(tabela).delete().eq('user_id', userId)
    if (error) throw error
  }
}

const solicitacaoDeBanco = (l) => ({
  id: l.id,
  userId: l.user_id,
  tipo: l.tipo,
  mensagem: l.mensagem,
  criadoEm: l.criado_em,
  resolvidoEm: l.resolvido_em,
})

export async function listarMinhasSolicitacoes(userId) {
  const { data, error } = await supabase
    .from('solicitacoes_privacidade')
    .select('*')
    .eq('user_id', userId)
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data.map(solicitacaoDeBanco)
}

export async function pedirEncerramentoDaConta(userId, mensagem) {
  const { data, error } = await supabase
    .from('solicitacoes_privacidade')
    .insert({ user_id: userId, tipo: 'encerrar_conta', mensagem: mensagem?.trim() || null })
    .select()
    .single()
  if (error) throw error
  return solicitacaoDeBanco(data)
}

// --- Admin -----------------------------------------------------------------

export async function listarSolicitacoesAbertas() {
  const { data, error } = await supabase
    .from('solicitacoes_privacidade')
    .select('*')
    .is('resolvido_em', null)
    .order('criado_em', { ascending: true })
  if (error) throw error
  return data.map(solicitacaoDeBanco)
}

export async function marcarSolicitacaoResolvida(id) {
  const { error } = await supabase.from('solicitacoes_privacidade').update({ resolvido_em: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

// Pacientes cujo consentimento para dados de saúde não está vigente (revogado ou nunca dado).
export async function listarSemConsentimentoVigente(idsPacientes) {
  const { data, error } = await supabase.from('consentimentos').select('user_id').eq('tipo', 'dado_saude').is('revogado_em', null)
  if (error) throw error
  const comConsentimento = new Set(data.map((l) => l.user_id))
  return new Set(idsPacientes.filter((id) => !comConsentimento.has(id)))
}
