import { useEffect, useState } from 'react'
import { ChevronDown, Lock, Pencil, Pill, Plus, Search, Trash2 } from 'lucide-react'
import {
  apagarAnotacao,
  apagarMedicacao,
  listarAnotacoes,
  listarMedicacoes,
  salvarAnotacao,
  salvarMedicacao,
} from '../../../lib/anotacoesApi'
import { apagarComentario, listarComentarios, salvarComentario } from '../../../lib/comentariosApi'
import { hojeLocal } from '../../../lib/checkinsApi'
import { formatarDia } from '../../../lib/sintese'
import Campo from '../../../components/Campo'
import Botao from '../../../components/Botao'
import BotaoAcao from '../../../components/BotaoAcao'
import { FormComentario } from '../../../components/AnotacoesTopico'
import { Combinados, Ficha, ObjetivosTerapeuticos } from './FichaEObjetivos'

const dataBr = (iso) => formatarDia(iso, { day: '2-digit', month: '2-digit', year: 'numeric' })
const diaPorExtenso = (iso) => formatarDia(iso, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
const nomeDoMes = (mes) => formatarDia(`${mes}-01`, { month: 'long', year: 'numeric' })
const diaDaSemanaCurto = (iso) => formatarDia(iso, { weekday: 'short' }).replace('.', '')
const semAcento = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const FILTROS = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'diario', rotulo: 'Diário clínico' },
  { id: 'resumo', rotulo: 'Resumo' },
  { id: 'graficos', rotulo: 'Gráficos' },
]

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

// Reúne, dia a dia, o diário clínico e as anotações feitas no Resumo e nos Gráficos.
// Cada anotação leva no título a sua origem; no mesmo dia, o diário vem primeiro.
// Para não lotar com o tempo: agrupado por mês (só o mais recente aberto), com busca e filtro por origem.
function Diario({ userId }) {
  const [anotacoes, setAnotacoes] = useState(null)
  const [comentarios, setComentarios] = useState(null)
  const [editando, setEditando] = useState(null) // chave `tipo-id` da anotação em edição
  const [escrevendo, setEscrevendo] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [abertos, setAbertos] = useState(null) // meses abertos ('AAAA-MM'); null = só o mais recente
  const [erro, setErro] = useState('')

  useEffect(() => {
    Promise.all([listarAnotacoes(userId), listarComentarios(userId)])
      .then(([a, c]) => {
        setAnotacoes(a)
        setComentarios(c)
      })
      .catch(() => setErro('Não foi possível carregar as anotações.'))
  }, [userId])

  async function salvarDiario(a) {
    const salva = await salvarAnotacao(userId, a)
    setAnotacoes((lista) => (a.id ? lista.map((x) => (x.id === salva.id ? salva : x)) : [salva, ...lista]))
    setEditando(null)
  }

  async function salvarTopico(c, texto) {
    const salvo = await salvarComentario(userId, { id: c.id, texto })
    setComentarios((lista) => lista.map((x) => (x.id === salvo.id ? salvo : x)))
    setEditando(null)
  }

  async function apagar(item) {
    if (!window.confirm('Apagar esta anotação? Esta ação não pode ser desfeita.')) return
    try {
      if (item.tipo === 'diario') {
        await apagarAnotacao(item.id)
        setAnotacoes((lista) => lista.filter((x) => x.id !== item.id))
      } else {
        await apagarComentario(item.id)
        setComentarios((lista) => lista.filter((x) => x.id !== item.id))
      }
    } catch {
      setErro('Não foi possível apagar a anotação.')
    }
  }

  const todos = anotacoes && comentarios
    ? [
        ...anotacoes.map((a) => ({ ...a, tipo: 'diario', grupo: 'diario', origem: 'Diário clínico' })),
        ...comentarios.map((c) => {
          const origem = c.origem ?? `Resumo · ${c.topico}`
          return { ...c, tipo: 'topico', grupo: origem.startsWith('Gráficos') ? 'graficos' : 'resumo', origem }
        }),
      ].sort(
        (a, b) =>
          b.data.localeCompare(a.data) ||
          (a.tipo === b.tipo ? (a.updatedAt ?? '').localeCompare(b.updatedAt ?? '') : a.tipo === 'diario' ? -1 : 1),
      )
    : null

  // Busca e filtro por origem. Com um dos dois ativo, todos os meses com resultado ficam abertos.
  const termo = semAcento(busca.trim())
  const filtrando = Boolean(termo) || filtro !== 'todas'
  const itens = todos?.filter(
    (i) => (filtro === 'todas' || i.grupo === filtro) && (!termo || semAcento(`${i.origem} ${i.texto}`).includes(termo)),
  )
  const meses = itens ? [...new Set(itens.map((i) => i.data.slice(0, 7)))] : []
  const estaAberto = (mes) => filtrando || (abertos ? abertos.has(mes) : mes === meses[0])
  function alternarMes(mes) {
    setAbertos((atual) => {
      const novo = new Set(atual ?? [meses[0]])
      if (novo.has(mes)) novo.delete(mes)
      else novo.add(mes)
      return novo
    })
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-branco shadow-sm">
      {/* Escrever, buscar e filtrar: tudo no topo do mesmo cartão */}
      <div className="space-y-4 p-5 sm:p-6">
        {escrevendo ? (
          <FormAnotacao
            onSalvar={async (a) => {
              await salvarDiario(a)
              setEscrevendo(false)
            }}
            onCancelar={() => setEscrevendo(false)}
          />
        ) : (
          <button
            onClick={() => setEscrevendo(true)}
            className="flex w-full items-center gap-2 rounded-xl border border-borda/70 bg-papel px-4 py-3 text-left text-textoSecundario hover:border-petroleo"
          >
            <Plus size={16} className="text-petroleo" aria-hidden /> Escrever no diário clínico…
          </button>
        )}

        {todos?.length > 0 && (
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="relative block md:flex-1">
              <span className="sr-only">Buscar nas anotações</span>
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-textoSecundario" aria-hidden />
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar (ex.: metrô, GAD-7, sono)"
                className="w-full rounded-full border border-borda bg-branco py-2 pl-10 pr-4 text-sm text-texto placeholder:text-textoSecundario focus:border-petroleo"
              />
            </label>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por origem">
              {FILTROS.map((f) => {
                const n = f.id === 'todas' ? todos.length : todos.filter((i) => i.grupo === f.id).length
                const ativo = filtro === f.id
                return (
                  <button
                    key={f.id}
                    onClick={() => setFiltro(f.id)}
                    aria-pressed={ativo}
                    className={`h-8 rounded-full px-3 font-interface text-xs font-semibold ${
                      ativo ? 'bg-petroleo text-branco' : 'bg-nevoa text-textoSecundario hover:text-petroleo'
                    }`}
                  >
                    {f.rotulo} <span className={ativo ? 'text-nevoa' : 'text-textoSecundario/70'}>{n}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
        {erro && <p className="text-sm text-alerta">{erro}</p>}
      </div>

      {todos?.length === 0 && <p className="border-t border-borda p-5 text-sm text-textoSecundario sm:p-6">Nenhuma anotação ainda. Comece pelo diário clínico acima.</p>}
      {todos?.length > 0 && itens.length === 0 && (
        <p className="border-t border-borda p-5 text-sm text-textoSecundario sm:p-6">Nenhuma anotação encontrada. Tente outra palavra ou o filtro “Todas”.</p>
      )}

      {/* Linha do tempo: um mês por faixa; em cada dia, a data na margem e as anotações ao lado */}
      {meses.map((mes) => {
        const doMes = itens.filter((i) => i.data.startsWith(mes))
        const diasDoMes = [...new Set(doMes.map((i) => i.data))]
        const aberto = estaAberto(mes)
        return (
          <div key={mes} className="border-t border-borda">
            <button
              onClick={() => alternarMes(mes)}
              disabled={filtrando}
              aria-expanded={aberto}
              className="flex w-full items-center justify-between gap-3 bg-papel px-5 py-3 text-left hover:bg-nevoa/60 disabled:cursor-default disabled:hover:bg-papel sm:px-6"
            >
              <span className="font-interface text-xs font-semibold uppercase tracking-wider text-petroleo">{nomeDoMes(mes)}</span>
              <span className="flex items-center gap-2 font-interface text-xs text-textoSecundario">
                {diasDoMes.length} {diasDoMes.length === 1 ? 'dia' : 'dias'} · {doMes.length} {doMes.length === 1 ? 'anotação' : 'anotações'}
                {!filtrando && <ChevronDown size={16} className={`transition-transform ${aberto ? 'rotate-180' : ''}`} aria-hidden />}
              </span>
            </button>
            {aberto && (
              <ol>
                {diasDoMes.map((dia) => (
                  <li key={dia} className="grid grid-cols-[2.75rem,1fr] gap-4 border-t border-borda px-5 py-5 sm:grid-cols-[3.5rem,1fr] sm:gap-6 sm:px-6">
                    <p className="text-center" title={diaPorExtenso(dia)}>
                      <span className="block font-titulo text-3xl leading-none text-petroleo">{dia.slice(8)}</span>
                      <span className="mt-1 block font-interface text-xs uppercase tracking-wider text-textoSecundario">{diaDaSemanaCurto(dia)}</span>
                    </p>
                    <ul className="min-w-0 space-y-4">
                      {doMes
                        .filter((i) => i.data === dia)
                        .map((i) => {
                          const chave = `${i.tipo}-${i.id}`
                          const doDiario = i.tipo === 'diario'
                          return (
                            <li key={chave} className="group">
                              {editando === chave ? (
                                doDiario ? (
                                  <FormAnotacao inicial={i} onSalvar={salvarDiario} onCancelar={() => setEditando(null)} />
                                ) : (
                                  <FormComentario inicial={i.texto} onSalvar={(t) => salvarTopico(i, t)} onCancelar={() => setEditando(null)} />
                                )
                              ) : (
                                <>
                                  <div className="flex min-h-7 items-start justify-between gap-3">
                                    <p className={`flex min-w-0 items-baseline gap-2 pt-1.5 font-interface text-xs font-semibold ${doDiario ? 'text-petroleo' : 'text-textoSecundario'}`}>
                                      <span
                                        className={`h-2 w-2 shrink-0 rounded-full ${doDiario ? 'bg-petroleo' : 'border-2 border-salvia'}`}
                                        aria-hidden
                                      />
                                      <span>{i.origem}</span>
                                    </p>
                                    {/* No computador, as ações aparecem ao passar o mouse; no celular, ficam sempre visíveis */}
                                    <div className="-mr-1.5 flex shrink-0 text-textoSecundario transition-opacity sm:opacity-0 sm:focus-within:opacity-100 sm:group-hover:opacity-100">
                                      <button onClick={() => setEditando(chave)} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-nevoa hover:text-petroleo" aria-label="Editar anotação">
                                        <Pencil size={14} />
                                      </button>
                                      <button onClick={() => apagar(i)} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-nevoa hover:text-alerta" aria-label="Apagar anotação">
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="mt-0.5 whitespace-pre-wrap leading-relaxed">{i.texto}</p>
                                </>
                              )}
                            </li>
                          )
                        })}
                    </ul>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )
      })}
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
    <section className="space-y-4 rounded-2xl bg-branco p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl">
          <Pill size={18} className="shrink-0 text-salvia" aria-hidden /> Medicações
        </h2>
        {formAberto !== 'nova' && (
          <BotaoAcao icone={Plus} className="-mr-3" onClick={() => setFormAberto('nova')}>
            Adicionar
          </BotaoAcao>
        )}
      </div>

      {formAberto === 'nova' && <FormMedicacao onSalvar={salvar} onCancelar={() => setFormAberto(null)} />}
      {erro && <p className="text-sm text-alerta">{erro}</p>}

      {emUso.length === 0 ? (
        formAberto !== 'nova' && <p className="text-sm text-textoSecundario">Nenhuma medicação em uso. Use “Adicionar” para registrar.</p>
      ) : (
        <div>
          <p className="mb-3 font-interface text-xs font-semibold uppercase tracking-wider text-textoSecundario">Em uso</p>
          <ul className="divide-y divide-borda">{emUso.map(renderizar)}</ul>
        </div>
      )}

      {encerradas.length > 0 && (
        <div className="border-t border-borda pt-4">
          <button
            onClick={() => setVerHistorico((v) => !v)}
            aria-expanded={verHistorico}
            className="font-interface text-xs font-semibold uppercase tracking-wider text-textoSecundario hover:text-petroleo"
          >
            {verHistorico ? 'Ocultar histórico' : `Ver histórico (${encerradas.length})`}
          </button>
          {verHistorico && <ul className="mt-3 divide-y divide-borda">{encerradas.map(renderizar)}</ul>}
        </div>
      )}
    </section>
  )
}

const SUBABAS = [
  { id: 'diario', rotulo: 'Diário' },
  { id: 'ficha', rotulo: 'Ficha e tratamento' },
]

// Aba "Anotações clínicas", em duas sub-abas:
// "Diário" — o diário clínico e as anotações do Resumo e dos Gráficos, numa linha do tempo;
// "Ficha e tratamento" — objetivos terapêuticos, combinados, medicações e ficha, em grade.
export default function AnotacoesClinicas({ userId }) {
  const [subaba, setSubaba] = useState('diario')
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-borda bg-branco p-1" role="tablist" aria-label="Anotações clínicas">
          {SUBABAS.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={subaba === s.id}
              onClick={() => setSubaba(s.id)}
              className={`h-9 rounded-full px-4 font-interface text-sm font-semibold transition-colors ${
                subaba === s.id ? 'bg-petroleo text-branco' : 'text-textoSecundario hover:text-petroleo'
              }`}
            >
              {s.rotulo}
            </button>
          ))}
        </div>
        <p className="flex items-center gap-1.5 text-xs text-textoSecundario">
          <Lock size={12} aria-hidden /> Só você vê{subaba === 'ficha' ? ', exceto os objetivos e os combinados, que o paciente também vê' : ''}.
        </p>
      </div>

      {subaba === 'diario' ? (
        <Diario userId={userId} />
      ) : (
        // Grade em duas linhas: os cartões da mesma linha têm a mesma altura.
        <div className="grid gap-5 md:grid-cols-2 [&>section]:h-full">
          <ObjetivosTerapeuticos userId={userId} />
          <Combinados userId={userId} />
          <Medicacoes userId={userId} />
          <Ficha userId={userId} />
        </div>
      )}
    </div>
  )
}
