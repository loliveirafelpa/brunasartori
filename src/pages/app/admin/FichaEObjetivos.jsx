import { useEffect, useState } from 'react'
import { ClipboardList, Handshake, Lock, Pencil, Plus, Trash2 } from 'lucide-react'
import { buscarFicha, salvarFicha } from '../../../lib/fichasApi'
import {
  buscarObjetivosTerapeuticos,
  listarObjetivosSemana,
  salvarObjetivoSemana,
  salvarObjetivosTerapeuticos,
} from '../../../lib/objetivosApi'
import { inicioDaSemana } from '../../../lib/reflexoesApi'
import { hojeLocal } from '../../../lib/checkinsApi'
import { formatarDia } from '../../../lib/sintese'
import Campo from '../../../components/Campo'
import Botao from '../../../components/Botao'

const dataBr = (iso) => formatarDia(iso, { day: '2-digit', month: '2-digit', year: 'numeric' })
const diaMes = (iso) => formatarDia(iso, { day: '2-digit', month: '2-digit' })

function intervaloDaSemana(segunda) {
  const [a, m, d] = segunda.split('-').map(Number)
  const domingo = new Date(a, m - 1, d + 6).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  return `${diaMes(segunda)} a ${domingo}`
}

const segundaDe = (iso) => {
  const [a, m, d] = iso.split('-').map(Number)
  return inicioDaSemana(new Date(a, m - 1, d))
}

// ---------------------------------------------------------------------------
// Objetivos terapêuticos — em destaque, no petróleo da marca
// ---------------------------------------------------------------------------
function ObjetivosTerapeuticos({ userId }) {
  const [objetivos, setObjetivos] = useState(undefined)
  const [texto, setTexto] = useState(null) // null = não está editando
  const [erro, setErro] = useState('')

  useEffect(() => {
    buscarObjetivosTerapeuticos(userId).then(setObjetivos).catch(() => setObjetivos(null))
  }, [userId])

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    try {
      await salvarObjetivosTerapeuticos(userId, texto)
      setObjetivos(texto.trim() ? { texto: texto.trim(), updatedAt: new Date().toISOString() } : null)
      setTexto(null)
    } catch {
      setErro('Não foi possível salvar os objetivos.')
    }
  }

  if (objetivos === undefined) return null

  return (
    <section className="rounded-2xl bg-petroleo p-6 text-branco shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-interface text-[11px] font-semibold uppercase tracking-wider text-nevoa">Objetivos terapêuticos</p>
        {texto === null && (
          <button
            onClick={() => setTexto(objetivos?.texto ?? '')}
            className="inline-flex items-center gap-1 font-interface text-xs font-semibold text-nevoa hover:text-branco hover:underline"
          >
            <Pencil size={13} aria-hidden /> {objetivos ? 'Editar' : 'Definir objetivos'}
          </button>
        )}
      </div>

      {texto !== null ? (
        <form onSubmit={salvar} className="mt-4 space-y-3">
          <label htmlFor="objetivos-gerais" className="sr-only">Objetivos terapêuticos</label>
          <textarea
            id="objetivos-gerais"
            rows={5}
            maxLength={4000}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="w-full rounded-xl border-0 bg-branco px-4 py-3 text-texto"
          />
          <p className="text-xs text-nevoa">O paciente vê estes objetivos na aba Semana. Deixe em branco para remover.</p>
          {erro && <p className="text-sm text-alertaFundo">{erro}</p>}
          <div className="flex gap-3">
            <button type="submit" className="rounded-full bg-branco px-5 py-2.5 font-interface text-sm font-semibold text-petroleo hover:bg-nevoa">
              Salvar objetivos
            </button>
            <button type="button" onClick={() => setTexto(null)} className="px-3 font-interface text-sm text-nevoa hover:text-branco">
              Cancelar
            </button>
          </div>
        </form>
      ) : objetivos ? (
        <>
          <p className="mt-3 whitespace-pre-wrap font-titulo text-xl leading-relaxed sm:text-2xl">{objetivos.texto}</p>
          <p className="mt-4 text-xs text-nevoa">
            Atualizado em {new Date(objetivos.updatedAt).toLocaleDateString('pt-BR')} · visível para o paciente
          </p>
        </>
      ) : (
        <p className="mt-3 font-titulo text-xl italic text-nevoa">Nenhum objetivo definido ainda.</p>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Combinados na sessão — um por semana, com histórico completo
// ---------------------------------------------------------------------------
function FormCombinado({ inicial, combinados, onSalvar, onCancelar }) {
  const [dia, setDia] = useState(inicial?.semanaInicio ?? hojeLocal())
  const semana = segundaDe(dia)
  const existente = !inicial && combinados.find((c) => c.semanaInicio === semana)
  const [texto, setTexto] = useState(inicial?.texto ?? '')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function salvar(e) {
    e.preventDefault()
    if (!texto.trim()) return setErro('Escreva o que foi combinado.')
    setErro('')
    setEnviando(true)
    try {
      await onSalvar(semana, texto)
    } catch {
      setErro('Não foi possível salvar o combinado.')
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-3 rounded-xl border border-borda bg-papel p-4">
      {!inicial && (
        <div>
          <div className="w-48">
            <Campo rotulo="Semana" id="combinado-dia" type="date" required value={dia} onChange={(e) => setDia(e.target.value)} />
          </div>
          <p className="mt-1 text-xs text-textoSecundario">
            Vale para a semana de {intervaloDaSemana(semana)}.
            {existente && ' Já existe um combinado nesta semana; ao salvar, ele será substituído.'}
          </p>
        </div>
      )}
      <Campo
        rotulo={inicial ? `Semana de ${intervaloDaSemana(inicial.semanaInicio)}` : 'O que foi combinado'}
        id={`combinado-texto-${inicial?.id ?? 'novo'}`}
        multilinha
        maxLength={2000}
        placeholder="Ex.: quando o chefe demorar a responder, anotar o pensamento antes de tirar conclusões."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      {erro && <p className="text-sm text-alerta">{erro}</p>}
      <div className="flex gap-3">
        <Botao type="submit" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar combinado'}</Botao>
        <Botao type="button" variante="discreto" onClick={onCancelar}>Cancelar</Botao>
      </div>
    </form>
  )
}

function Combinados({ userId }) {
  const semanaAtual = inicioDaSemana()
  const [combinados, setCombinados] = useState(null)
  const [form, setForm] = useState(null) // 'novo' | id em edição
  const [erro, setErro] = useState('')

  useEffect(() => {
    listarObjetivosSemana(userId, 200).then(setCombinados).catch(() => setErro('Não foi possível carregar os combinados.'))
  }, [userId])

  const recarregar = async () => setCombinados(await listarObjetivosSemana(userId, 200))

  async function salvar(semana, texto) {
    await salvarObjetivoSemana(userId, semana, texto)
    await recarregar()
    setForm(null)
  }

  async function apagar(c) {
    if (!window.confirm(`Apagar o combinado da semana de ${intervaloDaSemana(c.semanaInicio)}?`)) return
    try {
      await salvarObjetivoSemana(userId, c.semanaInicio, '')
      setCombinados((l) => l.filter((x) => x.id !== c.id))
    } catch {
      setErro('Não foi possível apagar o combinado.')
    }
  }

  return (
    <section className="space-y-4 rounded-2xl bg-branco p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl">
          <Handshake size={20} className="text-verdeAgua" aria-hidden /> Combinados na sessão
        </h2>
        {form !== 'novo' && (
          <button
            onClick={() => setForm('novo')}
            aria-label="Novo combinado"
            title="Novo combinado"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-petroleo text-branco hover:bg-petroleoEscuro"
          >
            <Plus size={18} aria-hidden />
          </button>
        )}
      </div>
      <p className="text-sm text-textoSecundario">O paciente vê o combinado da semana na aba Semana, como “Combinado na sessão”.</p>

      {form === 'novo' && combinados && <FormCombinado combinados={combinados} onSalvar={salvar} onCancelar={() => setForm(null)} />}
      {erro && <p className="text-sm text-alerta">{erro}</p>}

      {combinados?.length === 0 && form !== 'novo' && (
        <p className="rounded-xl bg-nevoa p-4 text-sm text-textoSecundario">Nenhum combinado registrado. Use o + para registrar o primeiro.</p>
      )}

      <ol className="space-y-0">
        {combinados?.map((c) => {
          const atual = c.semanaInicio === semanaAtual
          return (
            <li key={c.id} className="relative border-l-2 border-borda pb-5 pl-5 last:pb-0">
              <span
                className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full ${atual ? 'bg-petroleo' : 'border-2 border-borda bg-branco'}`}
                aria-hidden
              />
              {form === c.id ? (
                <FormCombinado inicial={c} combinados={combinados} onSalvar={salvar} onCancelar={() => setForm(null)} />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-interface text-xs font-semibold text-textoSecundario">
                      Semana de {intervaloDaSemana(c.semanaInicio)}
                      {atual && <span className="ml-2 rounded-full bg-petroleo px-2 py-0.5 text-[10px] uppercase tracking-wider text-branco">esta semana</span>}
                    </p>
                    <div className="flex shrink-0 gap-3 text-textoSecundario">
                      <button onClick={() => setForm(c.id)} className="hover:text-petroleo" aria-label="Editar combinado">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => apagar(c)} className="hover:text-alerta" aria-label="Apagar combinado">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <p className={`mt-1 whitespace-pre-wrap leading-relaxed ${atual ? 'text-texto' : 'text-textoSecundario'}`}>{c.texto}</p>
                </>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Ficha — cadastro e histórico (só a psicóloga vê)
// ---------------------------------------------------------------------------
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
    <section className="space-y-4 rounded-2xl bg-branco p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl">
          <ClipboardList size={20} className="text-verdeAgua" aria-hidden /> Ficha
        </h2>
        {!form && (
          <button
            onClick={() => setForm({ email: '', whatsapp: '', inicioAcompanhamento: hojeLocal(), historico: '', ...ficha })}
            className="inline-flex items-center gap-1 font-interface text-xs font-semibold text-petroleo hover:underline"
          >
            <Pencil size={13} aria-hidden /> Editar
          </button>
        )}
      </div>

      {form ? (
        <form onSubmit={salvar} className="space-y-4">
          <Campo rotulo="E-mail de contato" id="ficha-email" type="email" required value={form.email} onChange={muda('email')} />
          <Campo rotulo="WhatsApp" id="ficha-whatsapp" type="tel" maxLength={30} value={form.whatsapp ?? ''} onChange={muda('whatsapp')} />
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
        <>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="font-interface text-[11px] font-semibold uppercase tracking-wider text-textoSecundario">E-mail</dt>
              <dd className="break-all">{ficha.email}</dd>
            </div>
            {ficha.whatsapp && (
              <div>
                <dt className="font-interface text-[11px] font-semibold uppercase tracking-wider text-textoSecundario">WhatsApp</dt>
                <dd>{ficha.whatsapp}</dd>
              </div>
            )}
            <div>
              <dt className="font-interface text-[11px] font-semibold uppercase tracking-wider text-textoSecundario">Em acompanhamento desde</dt>
              <dd>{dataBr(ficha.inicioAcompanhamento)}</dd>
            </div>
          </dl>
          <div className="rounded-xl bg-nevoa p-4">
            <p className="flex items-center gap-1.5 font-interface text-[11px] font-semibold uppercase tracking-wider text-petroleo">
              <Lock size={12} aria-hidden /> Histórico · só você vê
            </p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{ficha.historico || '—'}</p>
          </div>
        </>
      )}
      {erro && <p className="text-sm text-alerta">{erro}</p>}
    </section>
  )
}

export default function FichaEObjetivos({ userId }) {
  return (
    <div className="space-y-6">
      <ObjetivosTerapeuticos userId={userId} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr),22rem]">
        <Combinados userId={userId} />
        <Ficha userId={userId} />
      </div>
    </div>
  )
}
