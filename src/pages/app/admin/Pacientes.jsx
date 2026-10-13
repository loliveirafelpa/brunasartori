import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BellRing, ChevronRight, UserPlus, Users } from 'lucide-react'
import { listarPacientes } from '../../../lib/perfisApi'
import { listarCheckinsDeTodos } from '../../../lib/checkinsApi'
import { listarSemConsentimentoVigente, listarSolicitacoesAbertas, marcarSolicitacaoResolvida } from '../../../lib/privacidadeApi'
import { diasDoPeriodo, formatarDia } from '../../../lib/sintese'

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
      <ul className="grid gap-3 sm:grid-cols-2">
        {pacientes?.map((p) => {
          const meus = checkins.filter((c) => c.userId === p.id)
          const ultimo = meus[0]
          const pediuEncerrar = pedidos.some((x) => x.userId === p.id)
          return (
            <li key={p.id}>
              <Link
                to={`/app/admin/pacientes/${p.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-branco p-5 shadow-cartao transition-colors hover:bg-nevoa"
              >
                <span>
                  <span className="block font-titulo text-lg text-petroleo">{p.nome || 'Sem nome'}</span>
                  <span className="block text-sm text-textoSecundario">
                    {meus.length} de 7 dias com check-in
                    {ultimo && ` · último: ${formatarDia(ultimo.data, { day: '2-digit', month: '2-digit' })}`}
                  </span>
                  {(semConsentimento.has(p.id) || pediuEncerrar) && (
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      {semConsentimento.has(p.id) && (
                        <span className="rounded-full bg-alertaFundo px-2.5 py-0.5 font-interface text-[11px] font-semibold text-alerta">
                          Sem consentimento vigente
                        </span>
                      )}
                      {pediuEncerrar && (
                        <span className="rounded-full bg-alertaFundo px-2.5 py-0.5 font-interface text-[11px] font-semibold text-alerta">
                          Pediu encerramento
                        </span>
                      )}
                    </span>
                  )}
                </span>
                <ChevronRight className="shrink-0 text-textoSecundario" aria-hidden />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
