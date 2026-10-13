import { useEffect, useState } from 'react'
import { Lock, Pencil, Pill, Plus, Trash2 } from 'lucide-react'
import {
  apagarAnotacao,
  apagarMedicacao,
  listarAnotacoes,
  listarMedicacoes,
  salvarAnotacao,
  salvarMedicacao,
} from '../../../lib/anotacoesApi'
import { hojeLocal } from '../../../lib/checkinsApi'
import { formatarDia } from '../../../lib/sintese'
import Campo from '../../../components/Campo'
import Botao from '../../../components/Botao'

const dataBr = (iso) => formatarDia(iso, { day: '2-digit', month: '2-digit', year: 'numeric' })
const diaPorExtenso = (iso) => formatarDia(iso, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

// ---------------------------------------------------------------------------
// Diário clínico
// ---------------------------------------------------------------------------
function FormAnotacao({ inicial, onSalvar, onCancelar }) {
  const [data, setData] = useState(inicial?.data ?? hojeLocal())
  const [texto, setTexto] = useState(inicial?.texto ?? '')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function salvar(e) {
    e.preventDefault()
    if (!texto.trim()) return setErro('Escreva a anotação antes de salvar.')
    setErro('')
    setEnviando(true)
    try {
      await onSalvar({ id: inicial?.id, data, texto })
      if (!inicial) setTexto('')
    } catch {
      setErro('Não foi possível salvar a anotação.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-3">
      <div className="w-44">
        <Campo rotulo="Data" id={`anotacao-data-${inicial?.id ?? 'nova'}`} type="date" required value={data} onChange={(e) => setData(e.target.value)} />
      </div>
      <Campo
        rotulo={inicial ? 'Anotação' : 'Nova anotação'}
        id={`anotacao-texto-${inicial?.id ?? 'nova'}`}
        multilinha
        maxLength={20000}
        placeholder="Percepções da sessão, hipóteses, pontos para acompanhar…"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      {erro && <p className="text-sm text-alerta">{erro}</p>}
      <div className="flex gap-3">
        <Botao type="submit" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar anotação'}</Botao>
        {onCancelar && <Botao type="button" variante="discreto" onClick={onCancelar}>Cancelar</Botao>}
      </div>
    </form>
  )
}

function Diario({ userId }) {
  const [anotacoes, setAnotacoes] = useState(null)
  const [editando, setEditando] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    listarAnotacoes(userId).then(setAnotacoes).catch(() => setErro('Não foi possível carregar as anotações.'))
  }, [userId])

  const ordenar = (lista) => [...lista].sort((a, b) => b.data.localeCompare(a.data))

  async function salvar(a) {
    const salva = await salvarAnotacao(userId, a)
    setAnotacoes((lista) => ordenar(a.id ? lista.map((x) => (x.id === salva.id ? salva : x)) : [salva, ...lista]))
    setEditando(null)
  }

  async function apagar(a) {
    if (!window.confirm('Apagar esta anotação? Esta ação não pode ser desfeita.')) return
    try {
      await apagarAnotacao(a.id)
      setAnotacoes((lista) => lista.filter((x) => x.id !== a.id))
    } catch {
      setErro('Não foi possível apagar a anotação.')
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-branco p-6 shadow-sm">
        <h2 className="text-2xl">Diário clínico</h2>
        <p className="mb-4 mt-1 flex items-center gap-1.5 text-xs text-textoSecundario">
          <Lock size={12} aria-hidden /> Só você vê. O paciente não tem acesso a estas anotações.
        </p>
        <FormAnotacao onSalvar={salvar} />
      </div>

      {erro && <p className="text-sm text-alerta">{erro}</p>}
      {anotacoes?.length === 0 && <p className="text-sm text-textoSecundario">Nenhuma anotação ainda.</p>}

      <ol className="space-y-3">
        {anotacoes?.map((a) => (
          <li key={a.id} className="rounded-2xl bg-branco p-5 shadow-sm">
            {editando === a.id ? (
              <FormAnotacao inicial={a} onSalvar={salvar} onCancelar={() => setEditando(null)} />
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-titulo text-lg capitalize text-petroleo">{diaPorExtenso(a.data)}</p>
                  <div className="flex shrink-0 gap-3 text-textoSecundario">
                    <button onClick={() => setEditando(a.id)} className="hover:text-petroleo" aria-label="Editar anotação">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => apagar(a)} className="hover:text-alerta" aria-label="Apagar anotação">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap leading-relaxed">{a.texto}</p>
              </>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Medicações
// ---------------------------------------------------------------------------
const MED_VAZIA = { nome: '', dosagem: '', posologia: '', prescritoPor: '', inicio: '', fim: '', observacoes: '' }

function FormMedicacao({ inicial, onSalvar, onCancelar }) {
  const [m, setM] = useState({ ...MED_VAZIA, ...Object.fromEntries(Object.entries(inicial ?? {}).map(([k, v]) => [k, v ?? ''])) })
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const muda = (campo) => (e) => setM((x) => ({ ...x, [campo]: e.target.value }))
  const id = inicial?.id ?? 'nova'

  async function salvar(e) {
    e.preventDefault()
    if (m.fim && m.inicio && m.fim < m.inicio) return setErro('A data de fim não pode ser anterior ao início.')
    setErro('')
    setEnviando(true)
    try {
      await onSalvar(m)
    } catch {
      setErro('Não foi possível salvar a medicação.')
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-3 rounded-2xl border border-borda bg-papel p-4">
      <Campo rotulo="Medicação" id={`med-nome-${id}`} required maxLength={120} placeholder="Ex.: Sertralina" value={m.nome} onChange={muda('nome')} />
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Dose" id={`med-dose-${id}`} maxLength={60} placeholder="Ex.: 50 mg" value={m.dosagem} onChange={muda('dosagem')} />
        <Campo rotulo="Como toma" id={`med-posologia-${id}`} maxLength={200} placeholder="Ex.: 1x ao dia, manhã" value={m.posologia} onChange={muda('posologia')} />
      </div>
      <Campo rotulo="Prescrito por" id={`med-prescritor-${id}`} maxLength={120} placeholder="Ex.: Dra. Ana (psiquiatra)" value={m.prescritoPor} onChange={muda('prescritoPor')} />
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Início" id={`med-inicio-${id}`} type="date" value={m.inicio} onChange={muda('inicio')} />
        {inicial && <Campo rotulo="Fim" id={`med-fim-${id}`} type="date" value={m.fim} onChange={muda('fim')} ajuda="Vazio = em uso." />}
      </div>
      <Campo
        rotulo="Observações"
        id={`med-obs-${id}`}
        multilinha
        maxLength={2000}
        placeholder="Efeitos relatados, ajustes de dose…"
        value={m.observacoes}
        onChange={muda('observacoes')}
      />
      {erro && <p className="text-sm text-alerta">{erro}</p>}
      <div className="flex gap-3">
        <Botao type="submit" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar medicação'}</Botao>
        <Botao type="button" variante="discreto" onClick={onCancelar}>Cancelar</Botao>
      </div>
    </form>
  )
}

function CartaoMedicacao({ m, onEditar, onEncerrar, onApagar }) {
  const emUso = !m.fim
  return (
    <li className="space-y-1.5 py-4 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <p className={`font-interface font-semibold ${emUso ? 'text-petroleo' : 'text-textoSecundario'}`}>
          {m.nome}
          {m.dosagem && <span className="font-normal"> · {m.dosagem}</span>}
        </p>
        <div className="flex shrink-0 gap-3 text-textoSecundario">
          <button onClick={onEditar} className="hover:text-petroleo" aria-label={`Editar ${m.nome}`}>
            <Pencil size={15} />
          </button>
          <button onClick={onApagar} className="hover:text-alerta" aria-label={`Apagar ${m.nome}`}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {m.posologia && <p className="text-sm">{m.posologia}</p>}
      <p className="text-xs text-textoSecundario">
        {emUso
          ? m.inicio
            ? `Desde ${dataBr(m.inicio)}`
            : 'Em uso'
          : `${m.inicio ? `${dataBr(m.inicio)} até ` : 'Até '}${dataBr(m.fim)}`}
        {m.prescritoPor && ` · ${m.prescritoPor}`}
      </p>
      {m.observacoes && <p className="whitespace-pre-wrap text-sm text-textoSecundario">{m.observacoes}</p>}
      {emUso && (
        <button onClick={onEncerrar} className="font-interface text-xs font-semibold text-petroleo underline">
          Encerrar uso
        </button>
      )}
    </li>
  )
}

function Medicacoes({ userId }) {
  const [lista, setLista] = useState(null)
  const [formAberto, setFormAberto] = useState(null) // 'nova' | id da medicação em edição
  const [verHistorico, setVerHistorico] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    listarMedicacoes(userId).then(setLista).catch(() => setErro('Não foi possível carregar as medicações.'))
  }, [userId])

  async function salvar(m) {
    const salva = await salvarMedicacao(userId, m)
    setLista((l) => (m.id ? l.map((x) => (x.id === salva.id ? salva : x)) : [salva, ...l]))
    setFormAberto(null)
  }

  async function encerrar(m) {
    if (!window.confirm(`Marcar ${m.nome} como encerrada hoje?`)) return
    try {
      await salvar({ ...m, fim: hojeLocal() })
    } catch {
      setErro('Não foi possível encerrar a medicação.')
    }
  }

  async function apagar(m) {
    if (!window.confirm(`Apagar ${m.nome} do registro? Para manter o histórico, prefira “Encerrar uso”.`)) return
    try {
      await apagarMedicacao(m.id)
      setLista((l) => l.filter((x) => x.id !== m.id))
    } catch {
      setErro('Não foi possível apagar a medicação.')
    }
  }

  if (!lista) return erro ? <p className="text-sm text-alerta">{erro}</p> : null

  const emUso = lista.filter((m) => !m.fim)
  const encerradas = lista.filter((m) => m.fim).sort((a, b) => b.fim.localeCompare(a.fim))

  const renderizar = (m) =>
    formAberto === m.id ? (
      <li key={m.id} className="py-4 first:pt-0">
        <FormMedicacao inicial={m} onSalvar={(dados) => salvar({ ...dados, id: m.id })} onCancelar={() => setFormAberto(null)} />
      </li>
    ) : (
      <CartaoMedicacao
        key={m.id}
        m={m}
        onEditar={() => setFormAberto(m.id)}
        onEncerrar={() => encerrar(m)}
        onApagar={() => apagar(m)}
      />
    )

  return (
    <section className="space-y-4 rounded-2xl bg-branco p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl">
          <Pill size={20} className="text-verdeAgua" aria-hidden /> Medicações
        </h2>
        {formAberto !== 'nova' && (
          <button onClick={() => setFormAberto('nova')} className="inline-flex items-center gap-1 font-interface text-xs font-semibold text-petroleo hover:underline">
            <Plus size={14} aria-hidden /> Adicionar
          </button>
        )}
      </div>

      {formAberto === 'nova' && <FormMedicacao onSalvar={salvar} onCancelar={() => setFormAberto(null)} />}
      {erro && <p className="text-sm text-alerta">{erro}</p>}

      <div>
        <p className="mb-3 font-interface text-[11px] font-semibold uppercase tracking-wider text-textoSecundario">Em uso</p>
        {emUso.length === 0 ? (
          <p className="text-sm text-textoSecundario">Nenhuma medicação em uso registrada.</p>
        ) : (
          <ul className="divide-y divide-borda">{emUso.map(renderizar)}</ul>
        )}
      </div>

      {encerradas.length > 0 && (
        <div className="border-t border-borda pt-4">
          <button
            onClick={() => setVerHistorico((v) => !v)}
            aria-expanded={verHistorico}
            className="font-interface text-[11px] font-semibold uppercase tracking-wider text-textoSecundario hover:text-petroleo"
          >
            {verHistorico ? 'Ocultar histórico' : `Ver histórico (${encerradas.length})`}
          </button>
          {verHistorico && <ul className="mt-3 divide-y divide-borda">{encerradas.map(renderizar)}</ul>}
        </div>
      )}
    </section>
  )
}

export default function AnotacoesClinicas({ userId }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr),22rem]">
      <Diario userId={userId} />
      <Medicacoes userId={userId} />
    </div>
  )
}
