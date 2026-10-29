import { useEffect, useState } from 'react'
import { ClipboardList, Handshake, Pencil, Plus, Target, Trash2 } from 'lucide-react'
import { buscarFicha, salvarFicha } from '../../../lib/fichasApi'
import {
  buscarObjetivosTerapeuticos,
  listaDeObjetivos,
  listarObjetivosSemana,
  salvarObjetivoSemana,
  salvarObjetivosTerapeuticos,
} from '../../../lib/objetivosApi'
import { inicioDaSemana } from '../../../lib/reflexoesApi'
import { hojeLocal } from '../../../lib/checkinsApi'
import { formatarDia } from '../../../lib/sintese'
import Campo from '../../../components/Campo'
import Botao from '../../../components/Botao'
import BotaoAcao from '../../../components/BotaoAcao'
import CamposConsulta from '../../../components/CamposConsulta'
import { consultaDoForm, consultaParaForm, proximaConsulta, rotuloConsulta, rotuloProxima } from '../../../data/consulta'

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

// Um objetivo por linha. Tira numeração ou marcador digitados à mão, já que a lista numera sozinha.

// ---------------------------------------------------------------------------
// Objetivos terapêuticos — numerados; o paciente vê na aba Semana
// ---------------------------------------------------------------------------
export function ObjetivosTerapeuticos({ userId }) {
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
    <section className="space-y-4 rounded-2xl bg-branco p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl">
          <Target size={18} className="shrink-0 text-salvia" aria-hidden /> Objetivos terapêuticos
        </h2>
        {texto === null && (
          <BotaoAcao icone={Pencil} className="-mr-3" onClick={() => setTexto(objetivos?.texto ?? '')}>
            {objetivos ? 'Editar' : 'Definir'}
          </BotaoAcao>
        )}
      </div>

      {texto !== null ? (
        <form onSubmit={salvar} className="space-y-3">
          <Campo
            rotulo="Um objetivo por linha"
            id="objetivos-gerais"
            multilinha
            rows={5}
            maxLength={4000}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            ajuda="A numeração é automática. O paciente vê estes objetivos na aba Semana. Deixe em branco para remover."
          />
          {erro && <p className="text-sm text-alerta">{erro}</p>}
          <div className="flex gap-3">
            <Botao type="submit">Salvar objetivos</Botao>
            <Botao type="button" variante="discreto" onClick={() => setTexto(null)}>Cancelar</Botao>
          </div>
        </form>
      ) : objetivos ? (
        <>
          <ol className="space-y-3">
            {listaDeObjetivos(objetivos.texto).map((o, i) => (
              <li key={i} className="flex items-baseline gap-3">
                <span className="w-5 shrink-0 text-right font-interface text-sm font-semibold text-salvia">{i + 1}.</span>
                <span className="font-titulo text-lg leading-snug text-petroleo">{o}</span>
              </li>
            ))}
          </ol>
          <p className="text-xs text-textoSecundario">
            Atualizado em {new Date(objetivos.updatedAt).toLocaleDateString('pt-BR')} · o paciente vê
          </p>
        </>
      ) : (
        <p className="text-sm text-textoSecundario">Nenhum objetivo definido ainda. Use “Definir” para escrever os objetivos combinados com o paciente.</p>
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

export function Combinados({ userId }) {
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
    <section className="space-y-4 rounded-2xl bg-branco p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl">
          <Handshake size={18} className="shrink-0 text-salvia" aria-hidden /> Combinados
        </h2>
        {form !== 'novo' && (
          <BotaoAcao icone={Plus} className="-mr-3" onClick={() => setForm('novo')}>
            Novo
          </BotaoAcao>
        )}
      </div>
      <p className="text-sm text-textoSecundario">O paciente vê o combinado da semana na aba Semana, como “Combinado na sessão”.</p>

      {form === 'novo' && combinados && <FormCombinado combinados={combinados} onSalvar={salvar} onCancelar={() => setForm(null)} />}
      {erro && <p className="text-sm text-alerta">{erro}</p>}

      {combinados?.length === 0 && form !== 'novo' && (
        <p className="text-sm text-textoSecundario">Nenhum combinado registrado. Use “Novo” para registrar o primeiro.</p>
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
                      {atual && (
                        <span className="ml-2 inline-block whitespace-nowrap rounded-full bg-petroleo px-2 py-0.5 text-xs uppercase tracking-wider text-branco">
                          esta semana
                        </span>
                      )}
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
export function Ficha({ userId }) {
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
      setFicha(await salvarFicha({ ...form, consulta: consultaDoForm(form.consulta), userId }))
      setForm(null)
    } catch {
      setErro('Não foi possível salvar a ficha.')
    }
  }

  if (ficha === undefined) return null

  return (
    <section className="space-y-4 rounded-2xl bg-branco p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl">
          <ClipboardList size={18} className="shrink-0 text-salvia" aria-hidden /> Ficha
        </h2>
        {!form && (
          <BotaoAcao
            icone={Pencil}
            className="-mr-3"
            onClick={() =>
              setForm({ email: '', whatsapp: '', inicioAcompanhamento: hojeLocal(), historico: '', ...ficha, consulta: consultaParaForm(ficha?.consulta) })
            }
          >
            Editar
          </BotaoAcao>
        )}
      </div>

      {form ? (
        <form onSubmit={salvar} className="space-y-4">
          <Campo rotulo="E-mail de contato" id="ficha-email" type="email" required value={form.email} onChange={muda('email')} />
          <Campo rotulo="WhatsApp" id="ficha-whatsapp" type="tel" maxLength={30} value={form.whatsapp ?? ''} onChange={muda('whatsapp')} />
          <Campo rotulo="Início do acompanhamento" id="ficha-inicio" type="date" required value={form.inicioAcompanhamento} onChange={muda('inicioAcompanhamento')} />
          <CamposConsulta id="ficha-consulta" valor={form.consulta} onChange={(consulta) => setForm((f) => ({ ...f, consulta }))} />
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
              <dt className="font-interface text-xs font-semibold uppercase tracking-wider text-textoSecundario">Consulta</dt>
              {rotuloConsulta(ficha.consulta) ? (
                <dd>
                  {rotuloConsulta(ficha.consulta)}
                  <span className="block text-xs text-textoSecundario">Próxima: {rotuloProxima(proximaConsulta(ficha.consulta))}</span>
                </dd>
              ) : (
                <dd className="text-textoSecundario">Sem horário fixo. Use “Editar” para definir.</dd>
              )}
            </div>
            <div>
              <dt className="font-interface text-xs font-semibold uppercase tracking-wider text-textoSecundario">E-mail</dt>
              <dd className="break-all">{ficha.email}</dd>
            </div>
            {ficha.whatsapp && (
              <div>
                <dt className="font-interface text-xs font-semibold uppercase tracking-wider text-textoSecundario">WhatsApp</dt>
                <dd>{ficha.whatsapp}</dd>
              </div>
            )}
            <div>
              <dt className="font-interface text-xs font-semibold uppercase tracking-wider text-textoSecundario">Em acompanhamento desde</dt>
              <dd>{dataBr(ficha.inicioAcompanhamento)}</dd>
            </div>
          </dl>
          <div className="border-t border-borda pt-4">
            <p className="font-interface text-xs font-semibold uppercase tracking-wider text-textoSecundario">Histórico</p>
            {ficha.historico ? (
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{ficha.historico}</p>
            ) : (
              <p className="mt-1.5 text-sm text-textoSecundario">Nada registrado. Use “Editar” para escrever o histórico do paciente.</p>
            )}
          </div>
        </>
      )}
      {erro && <p className="text-sm text-alerta">{erro}</p>}
    </section>
  )
}
