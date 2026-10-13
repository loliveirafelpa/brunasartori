import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'
import LayoutAcesso from '../components/LayoutAcesso'
import { Destaque } from '../components/Pagina'
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
    <LayoutAcesso
      titulo={
        <>
          Seu espaço <Destaque>entre as sessões</Destaque>
        </>
      }
    >
        <form onSubmit={entrar} className="space-y-4 rounded-3xl bg-branco p-6 shadow-cartao sm:p-7">
          <h2 className="font-titulo text-2xl text-petroleo">Entrar</h2>
          <Campo rotulo="E-mail" id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Campo rotulo="Senha" id="senha" type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
          {erro && <p className="text-sm text-alerta" role="alert">{erro}</p>}
          {aviso && <p className="text-sm text-petroleo" role="status">{aviso}</p>}
          <Botao type="submit" className="w-full py-3" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </Botao>
          <Botao type="button" variante="discreto" className="w-full" onClick={esqueciSenha}>
            Esqueci minha senha
          </Botao>
        </form>

        <p className="mt-6 text-center text-xs text-textoSecundario">
          O acesso é feito por convite da sua psicóloga.
        </p>
    </LayoutAcesso>
  )
}
