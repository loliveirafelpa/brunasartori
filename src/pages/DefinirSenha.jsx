import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'
import LayoutAcesso from '../components/LayoutAcesso'
import { Destaque } from '../components/Pagina'
import Campo from '../components/Campo'
import Botao from '../components/Botao'

// Página aberta pelo link do convite ou de "esqueci minha senha".
// O Supabase já cria a sessão a partir do link; aqui o paciente só escolhe a senha.
export default function DefinirSenha() {
  const { sessao, carregando } = useAuth()
  const senhaProvisoria = sessao?.user.user_metadata?.trocar_senha
  const navigate = useNavigate()
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    if (senha.length < 8) return setErro('A senha precisa ter pelo menos 8 caracteres.')
    if (senha !== confirmacao) return setErro('As senhas não são iguais.')
    setEnviando(true)
    const { error } = await supabase.auth.updateUser({ password: senha, data: { trocar_senha: false } })
    setEnviando(false)
    if (error) return setErro('Não foi possível salvar a senha. Tente abrir o link do e-mail novamente.')
    navigate('/app', { replace: true })
  }

  return (
    <LayoutAcesso
      titulo={
        <>
          Crie sua <Destaque>senha</Destaque>
        </>
      }
    >
        {carregando ? null : !sessao ? (
          <p className="rounded-3xl bg-branco p-6 text-center text-textoSecundario shadow-cartao">
            Este link expirou ou já foi usado. Peça um novo convite à sua psicóloga ou use “Esqueci minha senha” na tela de entrada.
          </p>
        ) : (
          <form onSubmit={salvar} className="space-y-4 rounded-3xl bg-branco p-6 shadow-cartao sm:p-7">
            {senhaProvisoria && (
              <p className="rounded-xl bg-nevoa px-4 py-3 text-sm text-petroleo">
                Boas-vindas! Para sua segurança, troque a senha provisória por uma só sua.
              </p>
            )}
            <Campo rotulo="Nova senha" id="senha" type="password" autoComplete="new-password" required value={senha} onChange={(e) => setSenha(e.target.value)} ajuda="Mínimo de 8 caracteres." />
            <Campo rotulo="Repita a senha" id="confirmacao" type="password" autoComplete="new-password" required value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} />
            {erro && <p className="text-sm text-alerta" role="alert">{erro}</p>}
            <Botao type="submit" className="w-full py-3" disabled={enviando}>
              {enviando ? 'Salvando…' : 'Salvar e continuar'}
            </Botao>
          </form>
        )}
    </LayoutAcesso>
  )
}
