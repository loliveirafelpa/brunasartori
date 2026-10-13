import { createClient } from '@supabase/supabase-js'

// Único cliente Supabase do app. Usa só a chave pública (anon/publishable):
// a proteção dos dados vem do RLS no banco, não de esconder esta chave.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
