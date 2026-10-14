import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, KeyRound } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from '../../../lib/AuthContext'
import Campo from '../../../components/Campo'
import Botao from '../../../components/Botao'

// Troca de senha da psicóloga já logada. Pede a senha atual antes, para que ninguém
// troque a senha de uma sessão deixada aberta.
export default function AlterarSenha() {
  const { usuario } = useAuth()
  const [atual, setAtual] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    if (senha.length < 8) return setErro('A nova senha precisa ter pelo menos 8 caracteres.')
    if (senha !== confirmacao) return setErro('As novas senhas não são iguais.')
    if (senha === atual) return setErro('A nova senha precisa ser diferente da atual.')
    setEnviando(true)
    const { error: erroAtual } = await supabase.auth.signInWithPassword({ email: usuario.email, password: atual })
    if (erroAtual) {
      setEnviando(false)
      return setErro('A senha atual não confere.')
    }
    const { error } = await supabase.auth.updateUser({ password: senha })
    setEnviando(false)
    if (error) return setErro('Não foi possível salvar a nova senha. Tente novamente.')
    setAtual('')
    setSenha('')
    setConfirmacao('')
    setSalvo(true)
  }

  return (
    <section className="mx-auto max-w-xl space-y-6">
      <Link to="/app/admin" className="inline-flex items-center gap-1 font-interface text-sm text-textoSecundario hover:text-petroleo">
        <ArrowLeft size={16} aria-hidden /> Pacientes
      </Link>
      <h1 className="flex items-center gap-3 text-3xl">
        <KeyRound className="text-verdeAgua" aria-hidden /> Alterar senha
      </h1>

      {salvo ? (
        <div className="space-y-4 rounded-2xl bg-branco p-6 shadow-sm">
          <p className="flex items-center gap-2 text-petroleo">
            <Check size={18} className="text-verdeAgua" aria-hidden /> Senha alterada. Use a nova senha no próximo acesso.
          </p>
          <Link to="/app/admin" className="font-interface text-sm font-semibold text-petroleo underline">
            Voltar aos pacientes
          </Link>
        </div>
      ) : (
        <form onSubmit={salvar} className="space-y-5 rounded-2xl bg-branco p-6 shadow-sm">
          <Campo rotulo="Senha atual" id="atual" type="password" autoComplete="current-password" required value={atual} onChange={(e) => setAtual(e.target.value)} />
          <Campo rotulo="Nova senha" id="senha" type="password" autoComplete="new-password" required value={senha} onChange={(e) => setSenha(e.target.value)} ajuda="Mínimo de 8 caracteres." />
          <Campo rotulo="Repita a nova senha" id="confirmacao" type="password" autoComplete="new-password" required value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} />
          {erro && <p className="text-sm text-alerta" role="alert">{erro}</p>}
          <Botao type="submit" disabled={enviando}>
            {enviando ? 'Salvando…' : 'Salvar nova senha'}
          </Botao>
        </form>
      )}
    </section>
  )
}
