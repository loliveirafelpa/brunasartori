import { supabase } from './supabaseClient'

// Ficha do paciente: só a Admin lê e grava (garantido pelo RLS).

function deBanco(l) {
  return {
    userId: l.user_id,
    email: l.email,
    whatsapp: l.whatsapp,
    inicioAcompanhamento: l.inicio_acompanhamento,
    historico: l.historico,
    consulta: l.consulta, // horário fixo { diaSemana, hora, frequencia, referencia } ou null (ver data/consulta.js)
    updatedAt: l.updated_at,
  }
}

export async function buscarFicha(userId) {
  const { data, error } = await supabase.from('fichas_pacientes').select('*').eq('user_id', userId).limit(1)
  if (error) throw error
  return data[0] ? deBanco(data[0]) : null
}

// Fichas de todos os pacientes (para a lista: consulta mais próxima).
export async function listarFichas() {
  const { data, error } = await supabase.from('fichas_pacientes').select('*')
  if (error) throw error
  return data.map(deBanco)
}

export async function salvarFicha(f) {
  const { data, error } = await supabase
    .from('fichas_pacientes')
    .upsert(
      {
        user_id: f.userId,
        email: f.email,
        whatsapp: f.whatsapp?.trim() || null,
        inicio_acompanhamento: f.inicioAcompanhamento,
        historico: f.historico?.trim() || null,
        consulta: f.consulta ?? null,
      },
      { onConflict: 'user_id' },
    )
    .select()
    .single()
  if (error) throw error
  return deBanco(data)
}

// Cria a conta do paciente pela Edge Function `criar-paciente` (precisa da chave de serviço,
// que fica só no servidor). Devolve { id, email, senhaProvisoria }.
export async function criarPaciente(dados) {
  const { data, error } = await supabase.functions.invoke('criar-paciente', { body: dados })
  if (error) {
    let mensagem = 'Não foi possível cadastrar agora. Tente novamente.'
    try {
      mensagem = (await error.context.json()).erro ?? mensagem
    } catch {
      // resposta sem corpo JSON: mantém a mensagem padrão
    }
    throw new Error(mensagem)
  }
  return data
}
