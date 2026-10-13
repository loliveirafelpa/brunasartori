import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Copy, KeyRound, MessageCircle, UserPlus } from 'lucide-react'
import { criarPaciente } from '../../../lib/fichasApi'
import { hojeLocal } from '../../../lib/checkinsApi'
import Campo from '../../../components/Campo'
import Botao from '../../../components/Botao'

// Link do WhatsApp com a mensagem pronta. Número brasileiro sem DDI ganha o 55.
function linkWhatsapp(numero, texto) {
  let digitos = (numero ?? '').replace(/\D/g, '')
  if (!digitos) return null
  if (digitos.length <= 11) digitos = `55${digitos}`
  return `https://wa.me/${digitos}?text=${encodeURIComponent(texto)}`
}

function Credenciais({ paciente, onOutro }) {
  const [copiado, setCopiado] = useState(false)
  const primeiroNome = paciente.nome.split(' ')[0]
  const mensagem =
    `Olá, ${primeiroNome}! Aqui é a Bruna. Criei seu acesso ao nosso espaço de acompanhamento entre as sessões:\n\n` +
    `${window.location.origin}/entrar\n` +
    `E-mail: ${paciente.email}\n` +
    `Senha provisória: ${paciente.senhaProvisoria}\n\n` +
    'No primeiro acesso, você vai criar sua própria senha.'
  const whatsapp = linkWhatsapp(paciente.whatsapp, mensagem)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensagem)
      setCopiado(true)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <section className="mx-auto max-w-xl space-y-6">
      <h1 className="flex items-center gap-3 text-3xl">
        <Check className="text-verdeAgua" aria-hidden /> {paciente.nome} cadastrado
      </h1>

      <div className="space-y-3 rounded-2xl bg-branco p-6 shadow-sm">
        <p className="flex items-center gap-2 font-interface text-sm font-semibold text-petroleo">
          <KeyRound size={16} aria-hidden /> Dados de acesso
        </p>
        <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-textoSecundario">E-mail</dt>
          <dd className="break-all">{paciente.email}</dd>
          <dt className="text-textoSecundario">Senha provisória</dt>
          <dd className="font-interface text-lg font-bold tracking-wider text-petroleo">{paciente.senhaProvisoria}</dd>
        </dl>
        <p className="rounded-xl bg-alertaFundo p-3 text-xs text-alerta">
          Esta senha aparece só agora. Envie ao paciente antes de sair desta tela. No primeiro acesso, ele cria a própria senha.
        </p>
      </div>

      <div className="space-y-2">
        <p className="font-interface text-sm font-semibold text-texto">Mensagem pronta para enviar</p>
        <pre className="whitespace-pre-wrap rounded-2xl bg-nevoa p-4 font-corpo text-sm">{mensagem}</pre>
        <div className="flex flex-wrap gap-3">
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-petroleo px-5 py-2.5 font-interface text-sm font-semibold text-branco hover:bg-petroleoEscuro"
            >
              <MessageCircle size={16} aria-hidden /> Enviar pelo WhatsApp
            </a>
          )}
          <Botao variante="secundario" onClick={copiar}>
            <Copy size={16} aria-hidden /> {copiado ? 'Copiada!' : 'Copiar mensagem'}
          </Botao>
        </div>
      </div>

      <div className="flex flex-wrap gap-6 pt-2">
        <Link to={`/app/admin/pacientes/${paciente.id}`} className="font-interface text-sm font-semibold text-petroleo underline">
          Ver painel do paciente
        </Link>
        <button onClick={onOutro} className="font-interface text-sm font-semibold text-petroleo underline">
          Cadastrar outro paciente
        </button>
      </div>
    </section>
  )
}

const VAZIO = {
  nome: '',
  email: '',
  whatsapp: '',
  inicioAcompanhamento: hojeLocal(),
  historico: '',
  objetivosTerapeuticos: '',
  registroPensamentosAtivo: true,
}

export default function NovoPaciente() {
  const [form, setForm] = useState(VAZIO)
  const [criado, setCriado] = useState(null)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const muda = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      const r = await criarPaciente(form)
      setCriado({ ...r, nome: form.nome.trim(), whatsapp: form.whatsapp })
      window.scrollTo({ top: 0 })
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (criado) {
    return (
      <Credenciais
        paciente={criado}
        onOutro={() => {
          setCriado(null)
          setForm({ ...VAZIO, inicioAcompanhamento: hojeLocal() })
        }}
      />
    )
  }

  return (
    <section className="mx-auto max-w-xl space-y-6">
      <Link to="/app/admin" className="inline-flex items-center gap-1 font-interface text-sm text-textoSecundario hover:text-petroleo">
        <ArrowLeft size={16} aria-hidden /> Pacientes
      </Link>
      <h1 className="flex items-center gap-3 text-3xl">
        <UserPlus className="text-verdeAgua" aria-hidden /> Novo paciente
      </h1>

      <form onSubmit={salvar} className="space-y-5 rounded-2xl bg-branco p-6 shadow-sm">
        <Campo rotulo="Nome" id="nome" required maxLength={120} autoComplete="off" value={form.nome} onChange={muda('nome')} />
        <Campo
          rotulo="E-mail"
          id="email"
          type="email"
          required
          autoComplete="off"
          ajuda="Será o login do paciente."
          value={form.email}
          onChange={muda('email')}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo rotulo="WhatsApp" id="whatsapp" type="tel" maxLength={30} placeholder="(11) 99999-9999" value={form.whatsapp} onChange={muda('whatsapp')} />
          <Campo rotulo="Início do acompanhamento" id="inicio" type="date" value={form.inicioAcompanhamento} onChange={muda('inicioAcompanhamento')} />
        </div>
        <Campo
          rotulo="Histórico do paciente"
          id="historico"
          multilinha
          maxLength={10000}
          ajuda="Visível só para você. O paciente não tem acesso a este campo."
          value={form.historico}
          onChange={muda('historico')}
        />
        <Campo
          rotulo="Objetivos terapêuticos"
          id="objetivos"
          multilinha
          maxLength={4000}
          ajuda="O paciente vê estes objetivos na aba Semana."
          value={form.objetivosTerapeuticos}
          onChange={muda('objetivosTerapeuticos')}
        />
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-petroleo" checked={form.registroPensamentosAtivo} onChange={muda('registroPensamentosAtivo')} />
          Registro de pensamentos ativo
        </label>

        {erro && <p className="text-sm text-alerta" role="alert">{erro}</p>}
        <Botao type="submit" className="w-full" disabled={enviando}>
          {enviando ? 'Cadastrando…' : 'Cadastrar paciente'}
        </Botao>
      </form>
    </section>
  )
}
