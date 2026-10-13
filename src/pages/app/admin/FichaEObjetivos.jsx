import { useEffect, useState } from 'react'
import { ClipboardList, Lock, Pencil, Target } from 'lucide-react'
import { buscarFicha, salvarFicha } from '../../../lib/fichasApi'
import {
  buscarObjetivoSemana,
  buscarObjetivosTerapeuticos,
  salvarObjetivoSemana,
  salvarObjetivosTerapeuticos,
} from '../../../lib/objetivosApi'
import { inicioDaSemana } from '../../../lib/reflexoesApi'
import { hojeLocal } from '../../../lib/checkinsApi'
import { formatarDia } from '../../../lib/sintese'
import Campo from '../../../components/Campo'
import Botao from '../../../components/Botao'

const dataBr = (iso) => formatarDia(iso, { day: '2-digit', month: '2-digit', year: 'numeric' })

function Cartao({ titulo, icone, acao, children }) {
  return (
    <div className="space-y-3 rounded-2xl bg-branco p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-titulo text-xl text-petroleo">
          <span className="text-verdeAgua" aria-hidden>{icone}</span>
          {titulo}
        </h2>
        {acao}
      </div>
      {children}
    </div>
  )
}

const BotaoEditar = ({ onClick }) => (
  <button onClick={onClick} className="inline-flex items-center gap-1 font-interface text-xs font-semibold text-petroleo hover:underline">
    <Pencil size={14} aria-hidden /> Editar
  </button>
)

// Ficha: cadastro e histórico — só a psicóloga vê.
function Ficha({ userId }) {
  const [ficha, setFicha] = useState(undefined)
  const [form, setForm] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    buscarFicha(userId).then(setFicha).catch(() => setErro('Não foi possível carregar a ficha.'))
  }, [userId])

  const muda = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    try {
      setFicha(await salvarFicha({ ...form, userId }))
      setForm(null)
    } catch {
      setErro('Não foi possível salvar a ficha.')
    }
  }

  if (ficha === undefined) return null

  return (
    <Cartao
      titulo="Ficha"
      icone={<ClipboardList size={20} />}
      acao={!form && <BotaoEditar onClick={() => setForm({ email: '', whatsapp: '', inicioAcompanhamento: hojeLocal(), historico: '', ...ficha })} />}
    >
      {form ? (
        <form onSubmit={salvar} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="E-mail de contato" id="ficha-email" type="email" required value={form.email} onChange={muda('email')} />
            <Campo rotulo="WhatsApp" id="ficha-whatsapp" type="tel" maxLength={30} value={form.whatsapp ?? ''} onChange={muda('whatsapp')} />
          </div>
          <Campo rotulo="Início do acompanhamento" id="ficha-inicio" type="date" required value={form.inicioAcompanhamento} onChange={muda('inicioAcompanhamento')} />
          <Campo rotulo="Histórico do paciente" id="ficha-historico" multilinha maxLength={10000} value={form.historico ?? ''} onChange={muda('historico')} />
          <div className="flex gap-3">
            <Botao type="submit">Salvar ficha</Botao>
            <Botao type="button" variante="discreto" onClick={() => setForm(null)}>Cancelar</Botao>
          </div>
        </form>
      ) : !ficha ? (
        <p className="text-sm text-textoSecundario">Sem ficha cadastrada. Clique em Editar para preencher.</p>
      ) : (
        <div className="space-y-2 text-sm">
          <p><span className="text-textoSecundario">E-mail:</span> {ficha.email}</p>
          {ficha.whatsapp && <p><span className="text-textoSecundario">WhatsApp:</span> {ficha.whatsapp}</p>}
          <p><span className="text-textoSecundario">Em acompanhamento desde</span> {dataBr(ficha.inicioAcompanhamento)}</p>
          <div className="pt-1">
            <p className="flex items-center gap-1 font-interface text-xs font-semibold text-textoSecundario">
              <Lock size={12} aria-hidden /> Histórico (só você vê)
            </p>
            <p className="mt-1 whitespace-pre-wrap">{ficha.historico || '—'}</p>
          </div>
        </div>
      )}
      {erro && <p className="text-sm text-alerta">{erro}</p>}
    </Cartao>
  )
}

// Texto editável simples (objetivos gerais e objetivo da semana).
function TextoEditavel({ id, valor, vazio, ajuda, maxLength, onSalvar }) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState('')

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    try {
      await onSalvar(texto)
      setEditando(false)
    } catch {
      setErro('Não foi possível salvar.')
    }
  }

  if (editando) {
    return (
      <form onSubmit={salvar} className="space-y-3">
        <Campo id={id} rotulo="" multilinha maxLength={maxLength} ajuda={ajuda} value={texto} onChange={(e) => setTexto(e.target.value)} />
        {erro && <p className="text-sm text-alerta">{erro}</p>}
        <div className="flex gap-3">
          <Botao type="submit">Salvar</Botao>
          <Botao type="button" variante="discreto" onClick={() => setEditando(false)}>Cancelar</Botao>
        </div>
      </form>
    )
  }
  return (
    <div className="space-y-2">
      <p className={`whitespace-pre-wrap text-sm ${valor ? '' : 'text-textoSecundario'}`}>{valor || vazio}</p>
      <BotaoEditar
        onClick={() => {
          setTexto(valor ?? '')
          setEditando(true)
        }}
      />
    </div>
  )
}

function Objetivos({ userId }) {
  const semana = inicioDaSemana()
  const [gerais, setGerais] = useState(undefined)
  const [daSemana, setDaSemana] = useState(undefined)

  useEffect(() => {
    buscarObjetivosTerapeuticos(userId).then((o) => setGerais(o?.texto ?? null)).catch(() => setGerais(null))
    buscarObjetivoSemana(userId, semana).then((o) => setDaSemana(o?.texto ?? null)).catch(() => setDaSemana(null))
  }, [userId, semana])

  if (gerais === undefined || daSemana === undefined) return null

  return (
    <Cartao titulo="Objetivos" icone={<Target size={20} />}>
      <div className="space-y-5">
        <div className="space-y-1">
          <p className="font-interface text-xs font-semibold uppercase tracking-wide text-textoSecundario">Objetivos terapêuticos</p>
          <TextoEditavel
            id="objetivos-gerais"
            valor={gerais}
            vazio="Nenhum objetivo cadastrado."
            maxLength={4000}
            ajuda="O paciente vê estes objetivos na aba Semana. Deixe em branco para remover."
            onSalvar={async (t) => {
              await salvarObjetivosTerapeuticos(userId, t)
              setGerais(t.trim() || null)
            }}
          />
        </div>
        <div className="space-y-1 border-t border-borda pt-4">
          <p className="font-interface text-xs font-semibold uppercase tracking-wide text-textoSecundario">
            Combinado na sessão · semana de {formatarDia(semana, { day: '2-digit', month: '2-digit' })}
          </p>
          <TextoEditavel
            id="objetivo-semana"
            valor={daSemana}
            vazio="Nada combinado para esta semana. O paciente pode escrever o próprio objetivo."
            maxLength={2000}
            ajuda="Aparece para o paciente como “Combinado na sessão”. Deixe em branco para remover."
            onSalvar={async (t) => {
              await salvarObjetivoSemana(userId, semana, t)
              setDaSemana(t.trim() || null)
            }}
          />
        </div>
      </div>
    </Cartao>
  )
}

export default function FichaEObjetivos({ userId }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Ficha userId={userId} />
      <Objetivos userId={userId} />
    </div>
  )
}
