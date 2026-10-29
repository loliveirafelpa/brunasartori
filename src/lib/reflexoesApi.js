import { supabase } from './supabaseClient'

// Reflexão semanal do paciente (avanço percebido, avanços e dificuldades). O objetivo da semana
// não fica aqui: é escrito só pela psicóloga (objetivosApi.js, "objetivos_semana").
// A coluna antiga `objetivo` continua no banco só para não perder o que já foi escrito.

function deBanco(l) {
  return {
    id: l.id,
    userId: l.user_id,
    semanaInicio: l.semana_inicio,
    percepcaoAvanco: l.percepcao_avanco,
    avancos: l.avancos,
    dificuldades: l.dificuldades,
    updatedAt: l.updated_at,
  }
}

// Segunda-feira da semana atual, na data local do paciente (AAAA-MM-DD).
export function inicioDaSemana(data = new Date()) {
  const d = new Date(data)
  const diasDesdeSegunda = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - diasDesdeSegunda)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export async function buscarReflexaoDaSemana(userId, semanaInicio) {
  const { data, error } = await supabase
    .from('reflexoes_semanais')
    .select('*')
    .eq('user_id', userId)
    .eq('semana_inicio', semanaInicio)
    .limit(1)
  if (error) throw error
  return data[0] ? deBanco(data[0]) : null
}

export async function listarReflexoes(userId, limite = 4) {
  const { data, error } = await supabase
    .from('reflexoes_semanais')
    .select('*')
    .eq('user_id', userId)
    .order('semana_inicio', { ascending: false })
    .limit(limite)
  if (error) throw error
  return data.map(deBanco)
}

// Uma reflexão por semana: se já existir, atualiza.
export async function salvarReflexao(r) {
  const { data, error } = await supabase
    .from('reflexoes_semanais')
    .upsert(
      {
        user_id: r.userId,
        semana_inicio: r.semanaInicio,
        percepcao_avanco: r.percepcaoAvanco,
        avancos: r.avancos?.trim() || null,
        dificuldades: r.dificuldades?.trim() || null,
      },
      { onConflict: 'user_id,semana_inicio' },
    )
    .select()
    .single()
  if (error) throw error
  return deBanco(data)
}
