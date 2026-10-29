import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, BellRing, ChevronRight, Search, UserPlus, Users } from 'lucide-react'
import { listarPacientes } from '../../../lib/perfisApi'
import { listarFichas } from '../../../lib/fichasApi'
import { listarCrisesDeTodos, listarQuestionariosDeTodos } from '../../../lib/protocolosApi'
import { sinaisClinicos } from '../../../lib/sinteseModulos'
import { partesProxima, proximaConsulta } from '../../../data/consulta'
import { listarCheckinsDeTodos } from '../../../lib/checkinsApi'
import { listarSemConsentimentoVigente, listarSolicitacoesAbertas, marcarSolicitacaoResolvida } from '../../../lib/privacidadeApi'
import { diasDoPeriodo, formatarDia } from '../../../lib/sintese'

const FILTROS = [
  { id: 'ativos', rotulo: 'Ativos' },
  { id: 'atencao', rotulo: 'Precisam de atenção' },
  { id: 'encerrados', rotulo: 'Encerrados' },
]

const VAZIO_POR_FILTRO = {
  ativos: 'Nenhum paciente ativo.',
  atencao: 'Nenhum paciente precisando de atenção agora.',
  encerrados: 'Nenhum acompanhamento encerrado. Para encerrar, abra o paciente na aba “Anotações clínicas”.',
}

// Busca sem diferenciar maiúsculas nem acentos ("joao" encontra "João").
const normalizar = (t) =>
  (t ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

// Pedidos de privacidade em aberto (ex.: encerrar conta), para a psicóloga dar andamento.
function Pedidos({ pedidos, nomes, onResolver }) {
  if (!pedidos.length) return null
  return (
    <section className="rounded-2xl border-l-4 border-alerta bg-branco p-5 shadow-cartao">
      <h2 className="flex items-center gap-2 font-interface text-xs font-semibold uppercase tracking-[0.14em] text-alerta">
        <BellRing size={14} aria-hidden /> Pedidos dos pacientes
      </h2>
      <ul className="mt-3 divide-y divide-borda">
        {pedidos.map((p) => (
          <li key={p.id} className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="text-sm">
              <p>
                <Link to={`/app/admin/pacientes/${p.userId}`} className="font-semibold text-petroleo underline">
                  {nomes[p.userId] || 'Paciente'}
                </Link>{' '}
                pediu o encerramento da conta em {new Date(p.criadoEm).toLocaleDateString('pt-BR')}.
              </p>
              {p.mensagem && <p className="mt-1 italic text-textoSecundario">“{p.mensagem}”</p>}
            </div>
            <button onClick={() => onResolver(p)} className="font-interface text-xs font-semibold text-petroleo underline">
              Marcar como resolvido
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

// Colunas da lista: paciente (nome, semana de check-ins, etiquetas) · próxima consulta · seta.
const COLUNAS = 'grid grid-cols-[minmax(0,1fr),6rem,1rem] items-center gap-3 px-4 sm:grid-cols-[minmax(0,1fr),8rem,1.25rem] sm:gap-5 sm:px-6'

// Os últimos 7 dias, um ponto por dia: cheio = fez check-in; vazio = não fez. Hoje é o último.
function SemanaDeCheckins({ semana, registrados }) {
  const feitos = semana.filter((d) => registrados.has(d)).length
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex gap-1" aria-hidden>
        {semana.map((d) => (
          <span
            key={d}
            title={`${formatarDia(d)}: ${registrados.has(d) ? 'fez check-in' : 'sem check-in'}`}
            className={`h-2.5 w-2.5 rounded-full ${registrados.has(d) ? 'bg-salvia' : 'border border-borda bg-branco'}`}
          />
        ))}
      </span>
      <span className="font-interface text-xs text-textoSecundario">
        {feitos} de 7 dias
      </span>
    </span>
  )
}

// Coluna da direita, alinhada em todas as linhas como uma agenda: o dia em cima, o horário embaixo.
// A consulta de hoje ganha destaque.
function ColunaConsulta({ proxima, encerradoEm }) {
  if (encerradoEm) {
    return (
      <span className="pr-2.5 text-right font-interface text-xs text-textoSecundario sm:pr-3">
        {formatarDia(encerradoEm, { day: '2-digit', month: '2-digit', year: 'numeric' })}
      </span>
    )
  }
  const p = partesProxima(proxima)
  if (!p) return <span className="pr-2.5 text-right font-interface text-xs text-textoSecundario sm:pr-3">Sem horário</span>
  return (
    <span className={`justify-self-end whitespace-nowrap rounded-xl px-2.5 py-1.5 text-right sm:px-3 ${p.hoje ? 'bg-petroleo text-branco' : ''}`}>
      <span className={`block font-interface text-xs font-semibold uppercase tracking-normal sm:tracking-wider ${p.hoje ? 'text-verdeAgua' : 'text-textoSecundario'}`}>
        {p.dia.replace('.', '').replace(',', '')}
      </span>
      <span className={`block font-titulo text-xl leading-tight ${p.hoje ? 'text-branco' : 'text-petroleo'}`}>{p.hora}</span>
    </span>
  )
}

// Painel da psicóloga: lista de pacientes com um resumo rápido dos últimos 7 dias.
export default function Pacientes() {
  const semana = useMemo(() => diasDoPeriodo(7), [])
  const [pacientes, setPacientes] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [semConsentimento, setSemConsentimento] = useState(new Set())
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('ativos')
  const [ordem, setOrdem] = useState('consulta') // abre pela consulta mais próxima
  const [consultas, setConsultas] = useState({}) // userId → horário fixo da consulta (da ficha)
  const [crises, setCrises] = useState([]) // dos últimos 7 dias, de todos
  const [questionarios, setQuestionarios] = useState([]) // dos últimos 7 dias, de todos

  useEffect(() => {
    const dias = diasDoPeriodo(7)
    Promise.all([
      listarPacientes(),
      listarCheckinsDeTodos(dias[0]),
      listarSolicitacoesAbertas(),
      listarFichas(),
      listarCrisesDeTodos(dias[0]),
      listarQuestionariosDeTodos(dias[0]),
    ])
      .then(async ([ps, cs, sol, fs, cr, qs]) => {
        setPacientes(ps)
        setCheckins(cs)
        setPedidos(sol)
        setCrises(cr)
        setQuestionarios(qs)
        setConsultas(Object.fromEntries(fs.map((f) => [f.userId, f.consulta ?? null])))
        setSemConsentimento(await listarSemConsentimentoVigente(ps.map((p) => p.id)))
      })
      .catch(() => setErro('Não foi possível carregar os pacientes.'))
  }, [])

  async function resolver(p) {
    if (!window.confirm('Marcar este pedido como resolvido? Faça isso depois de combinar o encerramento com o paciente.')) return
    try {
      await marcarSolicitacaoResolvida(p.id)
      setPedidos((l) => l.filter((x) => x.id !== p.id))
    } catch {
      setErro('Não foi possível atualizar o pedido.')
    }
  }

  const nomes = Object.fromEntries((pacientes ?? []).map((p) => [p.id, p.nome]))

  // Resumo de cada paciente para a lista: check-ins da semana, último registro e o que pede atenção.
  // `sinais`: clínicos (mesmas regras do "Para conferir com atenção" do Resumo, mais crises seguidas);
  // `avisos`: administrativos (consentimento, pedido de encerramento, falta de check-in).
  const linhas = useMemo(
    () =>
      (pacientes ?? []).map((p) => {
        const meus = checkins.filter((c) => c.userId === p.id)
        const avisos = []
        let sinais = []
        if (!p.acompanhamentoEncerradoEm) {
          sinais = sinaisClinicos({
            checkins: meus,
            crises: crises.filter((c) => c.userId === p.id),
            escalas: questionarios.filter((q) => q.userId === p.id),
          })
          if (semConsentimento.has(p.id)) avisos.push('Sem consentimento vigente')
          if (pedidos.some((x) => x.userId === p.id)) avisos.push('Pediu encerramento')
          if (meus.length === 0) avisos.push('Sem check-in na semana')
        }
        const proxima = p.acompanhamentoEncerradoEm ? null : proximaConsulta(consultas[p.id])
        return { ...p, diasRegistrados: new Set(meus.map((c) => c.data)), ultimo: meus[0]?.data ?? null, sinais, avisos, proxima }
      }),
    [pacientes, checkins, semConsentimento, pedidos, consultas, crises, questionarios],
  )

  const grupos = {
    ativos: linhas.filter((l) => !l.acompanhamentoEncerradoEm),
    atencao: linhas.filter((l) => l.sinais.length > 0 || l.avisos.length > 0),
    encerrados: linhas.filter((l) => l.acompanhamentoEncerradoEm),
  }

  const termo = normalizar(busca.trim())
  const porNome = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR')
  // Consulta mais próxima primeiro; quem não tem horário fixo vai para o fim.
  const porConsulta = (a, b) => (a.proxima?.getTime() ?? Infinity) - (b.proxima?.getTime() ?? Infinity) || porNome(a, b)
  // Em "Precisam de atenção", quem tem sinal clínico vem antes, qualquer que seja a ordenação.
  const clinicoPrimeiro = (a, b) => (filtro === 'atencao' ? (b.sinais.length > 0) - (a.sinais.length > 0) : 0)
  const visiveis = grupos[filtro]
    .filter((l) => !termo || normalizar(l.nome).includes(termo))
    .sort((a, b) =>
      clinicoPrimeiro(a, b) ||
      (ordem === 'ultimo'
        ? (a.ultimo ?? '').localeCompare(b.ultimo ?? '') || porNome(a, b)
        : ordem === 'consulta'
          ? porConsulta(a, b)
          : porNome(a, b)),
    )

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-3 text-3xl">
          <Users className="text-verdeAgua" aria-hidden /> Pacientes
        </h1>
        <Link
          to="/app/admin/pacientes/novo"
          className="inline-flex items-center gap-2 rounded-full bg-petroleo px-5 py-2.5 font-interface text-sm font-semibold text-branco hover:bg-petroleoEscuro"
        >
          <UserPlus size={16} aria-hidden /> Novo paciente
        </Link>
      </div>
      {erro && <p className="text-alerta">{erro}</p>}

      <Pedidos pedidos={pedidos} nomes={nomes} onResolver={resolver} />

      {pacientes?.length === 0 && (
        <p className="rounded-2xl bg-branco p-6 text-textoSecundario">Nenhum paciente cadastrado ainda. Use “Novo paciente” para começar.</p>
      )}

      {pacientes?.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative min-w-0 flex-1 basis-60">
              <span className="sr-only">Buscar paciente</span>
              <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-textoSecundario" aria-hidden />
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar paciente…"
                className="w-full rounded-full border border-borda bg-branco py-2.5 pl-10 pr-4 text-sm placeholder:text-textoSecundario/80 focus:border-petroleo"
              />
            </label>
            <label className="flex items-center gap-2 font-interface text-xs font-semibold text-textoSecundario">
              Ordenar
              <select
                value={ordem}
                onChange={(e) => setOrdem(e.target.value)}
                className="rounded-full border border-borda bg-branco py-2.5 pl-4 pr-8 text-sm font-normal text-texto focus:border-petroleo"
              >
                <option value="consulta">Consulta mais próxima</option>
                <option value="nome">Nome</option>
                <option value="ultimo">Sem check-in há mais tempo</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar pacientes">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                aria-pressed={filtro === f.id}
                className={`rounded-full px-4 py-1.5 font-interface text-xs font-semibold ${
                  filtro === f.id ? 'bg-petroleo text-branco' : 'border border-borda bg-branco text-textoSecundario hover:text-petroleo'
                }`}
              >
                {f.rotulo} <span className={filtro === f.id ? 'text-nevoa' : 'text-textoSecundario/80'}>{grupos[f.id].length}</span>
              </button>
            ))}
          </div>

          {visiveis.length === 0 ? (
            <p className="rounded-2xl bg-branco p-6 text-sm text-textoSecundario">
              {termo ? 'Nenhum paciente encontrado com esse nome.' : VAZIO_POR_FILTRO[filtro]}
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-branco shadow-cartao">
              <div className={`${COLUNAS} border-b border-borda py-2.5 font-interface text-xs font-semibold uppercase tracking-wider text-textoSecundario`}>
                <span>
                  Paciente<span className="hidden sm:inline"> · check-ins dos últimos 7 dias</span>
                </span>
                <span className="pr-2.5 text-right sm:pr-3">{filtro === 'encerrados' ? 'Encerrado em' : 'Consulta'}</span>
                <span aria-hidden />
              </div>
              <ul className="divide-y divide-borda">
                {visiveis.map((l) => (
                  <li key={l.id}>
                    <Link to={`/app/admin/pacientes/${l.id}`} className={`${COLUNAS} py-4 transition-colors hover:bg-papel`}>
                      <span className="min-w-0 space-y-1.5">
                        <span className="block truncate font-titulo text-lg leading-tight text-petroleo">{l.nome || 'Sem nome'}</span>
                        {!l.acompanhamentoEncerradoEm && <SemanaDeCheckins semana={semana} registrados={l.diasRegistrados} />}
                        {(l.sinais.length > 0 || l.avisos.length > 0) && (
                          <span className="flex flex-wrap gap-1.5 pt-0.5">
                            {l.sinais.map((s) => (
                              <span key={s} className="inline-flex items-start gap-1 rounded-lg bg-alertaFundo px-2.5 py-0.5 font-interface text-xs font-semibold text-alerta sm:items-center sm:rounded-full">
                                <AlertTriangle size={12} className="mt-0.5 shrink-0 sm:mt-0" aria-hidden /> {s}
                              </span>
                            ))}
                            {l.avisos.map((a) => (
                              <span key={a} className="rounded-full bg-nevoa px-2.5 py-0.5 font-interface text-xs font-semibold text-textoSecundario">
                                {a}
                              </span>
                            ))}
                          </span>
                        )}
                      </span>
                      <ColunaConsulta proxima={l.proxima} encerradoEm={l.acompanhamentoEncerradoEm} />
                      <ChevronRight size={18} className="text-textoSecundario" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
