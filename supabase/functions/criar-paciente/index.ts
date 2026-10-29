// Cria a conta de um paciente novo. Só a Admin (psicóloga) pode chamar.
// Roda no servidor porque precisa da chave de serviço do Supabase (nunca vai para o navegador).
// Devolve uma senha provisória, que a Admin envia ao paciente; ele troca no primeiro acesso.
import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const resposta = (status: number, corpo: unknown) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

// Sem caracteres ambíguos (0/O, 1/l/I) para facilitar digitar a senha recebida por WhatsApp.
function gerarSenhaProvisoria(tamanho = 10) {
  const letras = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(tamanho))
  return Array.from(bytes, (b) => letras[b % letras.length]).join('')
}

// Módulos e questionários conhecidos (iguais a src/data/modulos.js e src/data/escalas.js).
const MODULOS = ['tabagismo', 'alcool', 'puerperio', 'crise', 'bullying', 'luto', 'burnout', 'insonia']
const ESCALA_DO_MODULO: Record<string, string> = { puerperio: 'epds', crise: 'gad7' }
const INTERVALO_SUGERIDO = 14 // dias; a psicóloga ajusta depois na aba Protocolos

// Horário fixo da consulta: { diaSemana: 0–6, hora: 'HH:MM', frequencia, referencia } ou null.
function lerConsulta(c: unknown) {
  if (c === undefined || c === null) return null
  const v = c as Record<string, unknown>
  const ok =
    Number.isInteger(v.diaSemana) && (v.diaSemana as number) >= 0 && (v.diaSemana as number) <= 6 &&
    typeof v.hora === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v.hora) &&
    (v.frequencia === 'semanal' || v.frequencia === 'quinzenal') &&
    (v.referencia === null || v.referencia === undefined || (typeof v.referencia === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.referencia)))
  if (!ok) throw new Error('consulta inválida')
  return { diaSemana: v.diaSemana, hora: v.hora, frequencia: v.frequencia, referencia: v.referencia ?? null }
}

const textoOpcional = (v: unknown, max: number) => {
  if (v === undefined || v === null) return null
  if (typeof v !== 'string' || v.length > max) throw new Error('campo inválido')
  return v.trim() || null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return resposta(405, { erro: 'Método não permitido.' })

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // 1) Quem está pedindo precisa ser a Admin — checado aqui no servidor, não na tela.
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  const { data: quem } = await admin.auth.getUser(token ?? '')
  if (!quem?.user) return resposta(401, { erro: 'Sessão inválida. Entre novamente.' })
  const { data: perfilQuem } = await admin.from('profiles').select('role').eq('id', quem.user.id).single()
  if (perfilQuem?.role !== 'admin') return resposta(403, { erro: 'Apenas a psicóloga pode cadastrar pacientes.' })

  // 2) Validação dos dados
  // deno-lint-ignore no-explicit-any
  let dados: any
  try {
    const corpo = await req.json()
    const nome = typeof corpo.nome === 'string' ? corpo.nome.trim() : ''
    const email = typeof corpo.email === 'string' ? corpo.email.trim().toLowerCase() : ''
    if (!nome || nome.length > 120) return resposta(400, { erro: 'Informe o nome do paciente.' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return resposta(400, { erro: 'Informe um e-mail válido.' })
    }
    const inicio = textoOpcional(corpo.inicioAcompanhamento, 10)
    if (inicio && !/^\d{4}-\d{2}-\d{2}$/.test(inicio)) return resposta(400, { erro: 'Data de início inválida.' })
    dados = {
      nome,
      email,
      whatsapp: textoOpcional(corpo.whatsapp, 30),
      inicio,
      historico: textoOpcional(corpo.historico, 10000),
      objetivos: textoOpcional(corpo.objetivosTerapeuticos, 4000),
      modulos: Object.fromEntries(MODULOS.map((m) => [m, corpo.modulos?.[m] === true])),
      consulta: lerConsulta(corpo.consulta),
    }
    // Questionários marcados, só dos módulos ligados, na frequência sugerida.
    const ativadaEm = new Date().toISOString()
    dados.escalas = Object.fromEntries(
      Object.entries(ESCALA_DO_MODULO)
        .filter(([modulo, escala]) => dados.modulos[modulo] && corpo.escalas?.[escala] === true)
        .map(([, escala]) => [escala, { frequencia: INTERVALO_SUGERIDO, ativadaEm, pedidoEm: null }]),
    )
  } catch {
    return resposta(400, { erro: 'Dados inválidos.' })
  }

  // 3) Cria a conta com senha provisória (troca obrigatória no primeiro acesso)
  const senha = gerarSenhaProvisoria()
  const { data: criado, error: erroCriar } = await admin.auth.admin.createUser({
    email: dados.email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome: dados.nome, trocar_senha: true },
  })
  if (erroCriar || !criado.user) {
    const jaExiste = /already|registered|exists/i.test(erroCriar?.message ?? '')
    return resposta(jaExiste ? 409 : 500, {
      erro: jaExiste ? 'Já existe uma conta com este e-mail.' : 'Não foi possível criar a conta agora.',
    })
  }
  const id = criado.user.id

  // 4) Perfil, ficha e objetivos. Se algo falhar, desfaz a conta para não deixar cadastro pela metade.
  try {
    const { error: e1 } = await admin
      .from('profiles')
      .update({ nome: dados.nome, modulos: dados.modulos, escalas: dados.escalas })
      .eq('id', id)
    if (e1) throw e1
    const { error: e2 } = await admin.from('fichas_pacientes').insert({
      user_id: id,
      email: dados.email,
      whatsapp: dados.whatsapp,
      historico: dados.historico,
      consulta: dados.consulta,
      ...(dados.inicio ? { inicio_acompanhamento: dados.inicio } : {}),
    })
    if (e2) throw e2
    if (dados.objetivos) {
      const { error: e3 } = await admin.from('objetivos_terapeuticos').insert({ user_id: id, texto: dados.objetivos })
      if (e3) throw e3
    }
  } catch (e) {
    console.error('falha ao completar cadastro', e)
    await admin.auth.admin.deleteUser(id)
    return resposta(500, { erro: 'Não foi possível concluir o cadastro. Nada foi salvo; tente novamente.' })
  }

  return resposta(200, { id, email: dados.email, senhaProvisoria: senha })
})
