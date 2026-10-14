import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BellRing, ChevronRight, Search, UserPlus, Users } from 'lucide-react'
import { listarPacientes } from '../../../lib/perfisApi'
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
  encerrados: 'Nenhum acompanhamento encerrado. Para encerrar, abra o paciente na aba “Ficha e objetivos”.',
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
      <h2 className="flex items-center gap-2 font-interface text-[11px] font-semibold uppercase tracking-[0.14em] text-alerta">
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

// Painel da Bruna: lista de pacientes com um resumo rápido dos últimos 7 dias.
export default function Pacientes() {
  const [pacientes, setPacientes] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [semConsentimento, setSemConsentimento] = useState(new Set())
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('ativos')
  const [ordem, setOrdem] = useState('nome')

  useEffect(() => {
    const dias = diasDoPeriodo(7)
    Promise.all([listarPacientes(), listarCheckinsDeTodos(dias[0]), listarSolicitacoesAbertas()])
      .then(async ([ps, cs, sol]) => {
        setPacientes(ps)
        setCheckins(cs)
        setPedidos(sol)
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
  const linhas = useMemo(
    () =>
      (pacientes ?? []).map((p) => {
        const meus = checkins.filter((c) => c.userId === p.id)
        const avisos = []
        if (!p.acompanhamentoEncerradoEm) {
          if (semConsentimento.has(p.id)) avisos.push('Sem consentimento vigente')
          if (pedidos.some((x) => x.userId === p.id)) avisos.push('Pediu encerramento')
          if (meus.length === 0) avisos.push('Sem check-in na semana')
        }
        return { ...p, diasComCheckin: meus.length, ultimo: meus[0]?.data ?? null, avisos }
      }),
    [pacientes, checkins, semConsentimento, pedidos],
  )

  const grupos = {
    ativos: linhas.filter((l) => !l.acompanhamentoEncerradoEm),
    atencao: linhas.filter((l) => l.avisos.length > 0),
    encerrados: linhas.filter((l) => l.acompanhamentoEncerradoEm),
  }

  const termo = normalizar(busca.trim())
  const visiveis = grupos[filtro]
    .filter((l) => !termo || normalizar(l.nome).includes(termo))
    .sort((a, b) =>
      ordem === 'ultimo'
        ? (a.ultimo ?? '').localeCompare(b.ultimo ?? '') || a.nome.localeCompare(b.nome, 'pt-BR')
        : a.nome.localeCompare(b.nome, 'pt-BR'),
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
                className="rounded-full border border-borda bg-branco px-3 py-2 text-sm font-normal text-texto focus:border-petroleo"
              >
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
            <ul className="divide-y divide-borda overflow-hidden rounded-2xl bg-branco shadow-cartao">
              {visiveis.map((l) => (
                <li key={l.id}>
                  <Link
                    to={`/app/admin/pacientes/${l.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-nevoa"
                  >
                    <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="font-titulo text-lg text-petroleo">{l.nome || 'Sem nome'}</span>
                      <span className="text-sm text-textoSecundario">
                        {l.acompanhamentoEncerradoEm
                          ? `Encerrado em ${formatarDia(l.acompanhamentoEncerradoEm, { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                          : `${l.diasComCheckin}/7 dias${l.ultimo ? ` · último ${formatarDia(l.ultimo, { day: '2-digit', month: '2-digit' })}` : ''}`}
                      </span>
                      {l.avisos.map((a) => (
                        <span key={a} className="rounded-full bg-alertaFundo px-2.5 py-0.5 font-interface text-[11px] font-semibold text-alerta">
                          {a}
                        </span>
                      ))}
                    </span>
                    <ChevronRight className="shrink-0 text-textoSecundario" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
