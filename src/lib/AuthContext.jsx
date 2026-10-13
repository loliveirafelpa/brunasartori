import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'
import { buscarMeuPerfil } from './perfisApi'
import { temConsentimentoSaudeVigente } from './consentimentosApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [consentiu, setConsentiu] = useState(false)
  const [carregando, setCarregando] = useState(true)

  const carregarPerfil = useCallback(async (userId) => {
    if (!userId) {
      setPerfil(null)
      setConsentiu(false)
      return
    }
    const [p, c] = await Promise.all([buscarMeuPerfil(userId), temConsentimentoSaudeVigente(userId)])
    setPerfil(p)
    setConsentiu(c)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSessao(data.session)
      await carregarPerfil(data.session?.user.id).catch(() => {})
      setCarregando(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSessao(novaSessao)
      // Fora do callback para não travar o cliente do Supabase.
      setTimeout(() => carregarPerfil(novaSessao?.user.id).catch(() => {}), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [carregarPerfil])

  const valor = {
    sessao,
    usuario: sessao?.user ?? null,
    perfil,
    ehAdmin: perfil?.role === 'admin',
    consentiu,
    carregando,
    recarregar: () => carregarPerfil(sessao?.user.id),
    sair: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
