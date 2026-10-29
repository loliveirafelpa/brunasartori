import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, FileText, KeyRound, ShieldOff, Trash2, UserX } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { buscarConsentimentoSaude, revogarConsentimentoSaude } from '../../lib/consentimentosApi'
import { apagarMeusRegistros, exportarMeusDados, listarMinhasSolicitacoes, pedirEncerramentoDaConta } from '../../lib/privacidadeApi'
import { hojeLocal } from '../../lib/checkinsApi'
import Pagina, { Destaque } from '../../components/Pagina'
import Bloco from '../../components/Bloco'
import Botao from '../../components/Botao'

const dataBr = (iso) => new Date(iso).toLocaleDateString('pt-BR')

// Botão para ações que não têm volta.
function BotaoCuidado({ children, ...props }) {
  return (
    <button
      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-alerta px-5 py-3 font-interface text-sm font-semibold text-alerta transition-colors hover:bg-alertaFundo disabled:opacity-40"
      {...props}
    >
      {children}
    </button>
  )
}

function Baixar({ userId }) {
  const [estado, setEstado] = useState('')

  async function baixar() {
    setEstado('gerando')
    try {
      const dados = await exportarMeusDados(userId)
      const arquivo = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(arquivo)
      link.download = `meus-dados-${hojeLocal()}.json`
      link.click()
      URL.revokeObjectURL(link.href)
      setEstado('')
    } catch {
      setEstado('erro')
    }
  }

  return (
    <Bloco titulo="Baixar meus dados" icone={<Download size={15} />}>
      <div className="space-y-4">
        <p className="leading-relaxed">Uma cópia de tudo o que você registrou e dos seus aceites, num arquivo que você pode guardar.</p>
        {estado === 'erro' && <p className="text-sm text-alerta">Não foi possível gerar o arquivo agora. Tente novamente.</p>}
        <Botao variante="secundario" className="w-full py-3" onClick={baixar} disabled={estado === 'gerando'}>
          {estado === 'gerando' ? 'Gerando arquivo…' : 'Baixar meus dados'}
        </Botao>
      </div>
    </Bloco>
  )
}

function Consentimento({ userId, onRevogado }) {
  const [consentimento, setConsentimento] = useState(undefined)
  const [erro, setErro] = useState('')

  useEffect(() => {
    buscarConsentimentoSaude(userId).then(setConsentimento).catch(() => setConsentimento(null))
  }, [userId])

  async function revogar() {
    const ok = window.confirm(
      'Revogar o consentimento? A partir de agora você não poderá fazer novos registros. O que já foi registrado continua guardado, a menos que você também apague.',
    )
    if (!ok) return
    try {
      await revogarConsentimentoSaude(userId)
      setConsentimento((c) => ({ ...c, revogadoEm: new Date().toISOString() }))
      onRevogado()
    } catch {
      setErro('Não foi possível revogar agora. Tente novamente.')
    }
  }

  if (consentimento === undefined) return null
  const vigente = consentimento && !consentimento.revogadoEm

  return (
    <Bloco titulo="Seu consentimento" icone={<ShieldOff size={15} />}>
      <div className="space-y-4">
        {vigente ? (
          <p className="leading-relaxed">
            Você autorizou o uso dos seus dados de saúde em <strong>{dataBr(consentimento.aceitoEm)}</strong>. Você pode retirar essa
            autorização quando quiser.
          </p>
        ) : (
          <p className="leading-relaxed">
            {consentimento ? (
              <>
                Você revogou o consentimento em <strong>{dataBr(consentimento.revogadoEm)}</strong>. Novos registros estão pausados.
              </>
            ) : (
              'Você ainda não autorizou o uso dos seus dados de saúde.'
            )}{' '}
            <Link to="/app/consentimento" className="font-semibold text-petroleo underline">
              Autorizar novamente
            </Link>
          </p>
        )}
        {erro && <p className="text-sm text-alerta">{erro}</p>}
        {vigente && <BotaoCuidado onClick={revogar}>Revogar consentimento</BotaoCuidado>}
      </div>
    </Bloco>
  )
}

function Apagar({ userId }) {
  const [entendi, setEntendi] = useState(false)
  const [estado, setEstado] = useState('')

  async function apagar() {
    if (!window.confirm('Apagar todos os seus check-ins, reflexões e registros de pensamento? Isso não pode ser desfeito.')) return
    setEstado('apagando')
    try {
      await apagarMeusRegistros(userId)
      setEstado('feito')
    } catch {
      setEstado('erro')
    }
  }

  return (
    <Bloco titulo="Apagar meus registros" icone={<Trash2 size={15} />}>
      <div className="space-y-4">
        <p className="leading-relaxed">
          Apaga todos os check-ins, reflexões semanais e registros de pensamento que você fez. As anotações profissionais da sua psicóloga
          seguem as regras do Conselho Federal de Psicologia e não são apagadas por aqui.
        </p>
        {estado === 'feito' ? (
          <p className="rounded-xl bg-nevoa px-4 py-3 text-sm text-petroleo" role="status">Seus registros foram apagados.</p>
        ) : (
          <>
            <label className="flex cursor-pointer gap-3 text-sm">
              <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-alerta" checked={entendi} onChange={(e) => setEntendi(e.target.checked)} />
              Entendo que os registros apagados não podem ser recuperados.
            </label>
            {estado === 'erro' && <p className="text-sm text-alerta">Não foi possível apagar agora. Tente novamente.</p>}
            <BotaoCuidado onClick={apagar} disabled={!entendi || estado === 'apagando'}>
              {estado === 'apagando' ? 'Apagando…' : 'Apagar meus registros'}
            </BotaoCuidado>
          </>
        )}
      </div>
    </Bloco>
  )
}

function Encerrar({ userId }) {
  const [pedidos, setPedidos] = useState(null)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    listarMinhasSolicitacoes(userId).then(setPedidos).catch(() => setPedidos([]))
  }, [userId])

  async function pedir() {
    setEnviando(true)
    setErro('')
    try {
      const novo = await pedirEncerramentoDaConta(userId, mensagem)
      setPedidos((p) => [novo, ...p])
    } catch {
      setErro('Não foi possível enviar o pedido agora. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (!pedidos) return null
  const aberto = pedidos.find((p) => p.tipo === 'encerrar_conta' && !p.resolvidoEm)

  return (
    <Bloco titulo="Encerrar minha conta" icone={<UserX size={15} />}>
      <div className="space-y-4">
        {aberto ? (
          <p className="rounded-xl bg-nevoa px-4 py-3 text-sm leading-relaxed text-petroleo" role="status">
            Pedido enviado em {dataBr(aberto.criadoEm)}. Sua psicóloga vai conversar com você sobre o encerramento.
          </p>
        ) : (
          <>
            <p className="leading-relaxed">
              Envie um pedido para encerrar sua conta. Sua psicóloga recebe o aviso e combina com você os próximos passos.
            </p>
            <label htmlFor="mensagem-encerrar" className="sr-only">Mensagem para a psicóloga (opcional)</label>
            <textarea
              id="mensagem-encerrar"
              rows={3}
              maxLength={2000}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Se quiser, deixe uma mensagem (opcional)."
              className="w-full rounded-xl border border-borda/70 bg-papel px-4 py-3 text-texto placeholder:text-textoSecundario/80 focus:border-petroleo focus:bg-branco"
            />
            {erro && <p className="text-sm text-alerta">{erro}</p>}
            <BotaoCuidado onClick={pedir} disabled={enviando}>
              {enviando ? 'Enviando…' : 'Pedir encerramento da conta'}
            </BotaoCuidado>
          </>
        )}
      </div>
    </Bloco>
  )
}

function Senha() {
  return (
    <Bloco titulo="Senha de acesso" icone={<KeyRound size={15} />}>
      <p className="mb-4 text-sm leading-relaxed text-textoSecundario">Troque a sua senha quando quiser. Vamos pedir a senha atual antes.</p>
      <Link to="/app/senha" className="font-interface text-sm font-semibold text-petroleo underline">
        Alterar senha
      </Link>
    </Bloco>
  )
}

export default function MeusDados() {
  const { usuario, recarregar } = useAuth()

  return (
    <Pagina
      sobretitulo="Privacidade"
      titulo={
        <>
          Meus <Destaque>dados</Destaque>
        </>
      }
      descricao="Seus registros são seus. Aqui você decide o que fazer com eles."
    >
      <Senha />
      <Baixar userId={usuario.id} />
      <Consentimento userId={usuario.id} onRevogado={recarregar} />
      <Apagar userId={usuario.id} />
      <Encerrar userId={usuario.id} />
      <Link
        to="/privacidade"
        className="flex items-center justify-center gap-2 py-2 font-interface text-sm font-semibold text-petroleo underline"
      >
        <FileText size={16} aria-hidden /> Ler a política de privacidade
      </Link>
    </Pagina>
  )
}
