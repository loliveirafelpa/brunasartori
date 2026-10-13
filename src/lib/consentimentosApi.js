import { supabase } from './supabaseClient'
import { VERSAO_TERMOS } from '../data/textosLegais'

export async function temConsentimentoSaudeVigente(userId) {
  const { data, error } = await supabase
    .from('consentimentos')
    .select('id')
    .eq('user_id', userId)
    .eq('tipo', 'dado_saude')
    .is('revogado_em', null)
    .limit(1)
  if (error) throw error
  return data.length > 0
}

// Último consentimento de dado de saúde (vigente ou revogado), para mostrar ao paciente.
export async function buscarConsentimentoSaude(userId) {
  const { data, error } = await supabase
    .from('consentimentos')
    .select('aceito_em, revogado_em')
    .eq('user_id', userId)
    .eq('tipo', 'dado_saude')
    .order('aceito_em', { ascending: false })
    .limit(1)
  if (error) throw error
  return data[0] ? { aceitoEm: data[0].aceito_em, revogadoEm: data[0].revogado_em } : null
}

// Grava os dois aceites separadamente, cada um com data e hora (LGPD, Art. 11).
export async function registrarConsentimentos(userId) {
  const { error } = await supabase.from('consentimentos').insert([
    { user_id: userId, tipo: 'termos_de_uso', versao: VERSAO_TERMOS },
    { user_id: userId, tipo: 'dado_saude', versao: VERSAO_TERMOS },
  ])
  if (error) throw error
}

export async function revogarConsentimentoSaude(userId) {
  const { error } = await supabase
    .from('consentimentos')
    .update({ revogado_em: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('tipo', 'dado_saude')
    .is('revogado_em', null)
  if (error) throw error
}
