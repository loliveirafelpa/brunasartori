import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'
import Logo from '../components/Logo'
import Campo from '../components/Campo'
import Botao from '../components/Botao'

export default function Login() {
  const { sessao } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (sessao) return <Navigate to="/app" replace />

  async function entrar(e) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    setEnviando(false)
    if (error) setErro('E-mail ou senha incorretos.')
  }

  async function esqueciSenha() {
    setErro('')
    if (!email) return setErro('Digite seu e-mail acima para receber o link.')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/definir-senha`,
    })
    if (error) return setErro('Não foi possível enviar agora. Tente novamente em alguns minutos.')
    setAviso('Se este e-mail estiver cadastrado, você vai receber um link para criar uma nova senha.')
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo tamanho={96} />
          <h1 className="mt-5 text-3xl">
            Seu espaço <em className="text-salvia">entre as sessões</em>
          </h1>
          <p className="mt-2 text-textoSecundario">Acolher a própria história é o primeiro passo.</p>
        </div>

        <form onSubmit={entrar} className="space-y-4 rounded-2xl bg-branco p-6 shadow-sm">
          <Campo rotulo="E-mail" id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Campo rotulo="Senha" id="senha" type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
          {erro && <p className="text-sm text-alerta" role="alert">{erro}</p>}
          {aviso && <p className="text-sm text-petroleo" role="status">{aviso}</p>}
          <Botao type="submit" className="w-full" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </Botao>
          <Botao type="button" variante="discreto" className="w-full" onClick={esqueciSenha}>
            Esqueci minha senha
          </Botao>
        </form>

        <p className="mt-6 text-center text-xs text-textoSecundario">
          O acesso é feito por convite da sua psicóloga.
        </p>
      </div>
    </main>
  )
}
