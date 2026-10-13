import { supabase } from './supabaseClient'

function deBanco(l) {
  return {
    id: l.id,
    userId: l.user_id,
    data: l.data,
    humor: l.humor,
    emocao: l.emocao,
    emocaoOutra: l.emocao_outra,
    ansiedade: l.ansiedade,
    sonoHoras: l.sono_horas === null ? null : Number(l.sono_horas),
    sonoQualidade: l.sono_qualidade,
    energia: l.energia,
    exercicio: l.exercicio,
    acontecimento: l.acontecimento,
    situacoes: l.situacoes ?? [],
    situacaoOutra: l.situacao_outra,
    createdAt: l.created_at,
  }
}

function paraBanco(c) {
  return {
    user_id: c.userId,
    data: c.data,
    humor: c.humor,
    emocao: c.emocao,
    emocao_outra: c.emocao === 'outra' ? c.emocaoOutra || null : null,
    ansiedade: c.ansiedade,
    sono_horas: c.sonoHoras,
    sono_qualidade: c.sonoQualidade,
    energia: c.energia,
    exercicio: c.exercicio ?? null,
    acontecimento: c.acontecimento?.trim() || null,
    situacoes: c.situacoes ?? [],
    situacao_outra: c.situacoes?.includes('outra') ? c.situacaoOutra?.trim() || null : null,
  }
}

// Data local do paciente (não UTC), no formato AAAA-MM-DD.
export function hojeLocal() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export async function buscarCheckinDoDia(userId, data) {
  const { data: linhas, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', userId)
    .eq('data', data)
    .limit(1)
  if (error) throw error
  return linhas[0] ? deBanco(linhas[0]) : null
}

// Um check-in por dia: se já existir, atualiza.
export async function salvarCheckin(checkin) {
  const { data, error } = await supabase
    .from('checkins')
    .upsert(paraBanco(checkin), { onConflict: 'user_id,data' })
    .select()
    .single()
  if (error) throw error
  return deBanco(data)
}

// Para o painel da Admin: check-ins de todos os pacientes desde uma data (RLS limita à Admin).
export async function listarCheckinsDeTodos(desde) {
  const { data, error } = await supabase
    .from('checkins')
    .select('user_id, data, humor, ansiedade')
    .gte('data', desde)
    .order('data', { ascending: false })
  if (error) throw error
  return data.map((l) => ({ userId: l.user_id, data: l.data, humor: l.humor, ansiedade: l.ansiedade }))
}

export async function listarCheckins(userId, desde) {
  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', userId)
    .gte('data', desde)
    .order('data', { ascending: false })
  if (error) throw error
  return data.map(deBanco)
}
