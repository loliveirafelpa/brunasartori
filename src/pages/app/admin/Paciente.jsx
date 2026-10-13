import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BrainCircuit, CalendarDays, Info, MessageCircleQuestion, Sprout } from 'lucide-react'
import { buscarPerfil, definirRegistroPensamentos } from '../../../lib/perfisApi'
import { listarCheckins } from '../../../lib/checkinsApi'
import { listarRegistrosPensamento } from '../../../lib/pensamentosApi'
import { listarReflexoes } from '../../../lib/reflexoesApi'
import { diasDoPeriodo, formatarDia, gerarSintese, rotuloEmocao, rotuloSituacao } from '../../../lib/sintese'
import { ESCALA_ANSIEDADE, ESCALA_ENERGIA, ESCALA_SONO, HUMORES } from '../../../data/checkinOpcoes'

const PERIODOS = [7, 14, 30]

const decimal = (v, casas = 1) => (v === null ? '—' : v.toFixed(casas).replace('.', ','))

function Indicador({ rotulo, valor, sufixo, detalhe }) {
  return (
    <div className="rounded-2xl bg-branco p-4 shadow-sm">
      <p className="font-interface text-xs font-semibold uppercase tracking-wide text-textoSecundario">{rotulo}</p>
      <p className="mt-1 font-titulo text-3xl text-petroleo">
        {valor}
        {sufixo && <span className="font-corpo text-base text-textoSecundario">{sufixo}</span>}
      </p>
      {detalhe && <p className="text-xs text-textoSecundario">{detalhe}</p>}
    </div>
  )
}

function Secao({ titulo, icone, children }) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-2xl">
        <span className="text-verdeAgua" aria-hidden>{icone}</span>
        {titulo}
      </h2>
      {children}
    </section>
  )
}

const rotuloEscala = (escala, v) => (v ? escala[v - 1] : '—')

function LinhaDoTempo({ dias, checkins }) {
  const porDia = Object.fromEntries(checkins.map((c) => [c.data, c]))
  return (
    <div className="overflow-x-auto rounded-2xl bg-branco shadow-sm">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-borda font-interface text-xs uppercase tracking-wide text-textoSecundario">
          <tr>
            <th className="px-4 py-3">Dia</th>
            <th className="px-4 py-3">Humor</th>
            <th className="px-4 py-3">Emoção</th>
            <th className="px-4 py-3">Ansiedade</th>
            <th className="px-4 py-3">Sono</th>
            <th className="px-4 py-3">Energia</th>
            <th className="px-4 py-3">Situações</th>
          </tr>
        </thead>
        <tbody>
          {[...dias].reverse().map((dia) => {
            const c = porDia[dia]
            if (!c) {
              return (
                <tr key={dia} className="border-b border-borda last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 font-interface text-xs font-semibold capitalize">{formatarDia(dia)}</td>
                  <td colSpan={6} className="px-4 py-3 italic text-textoSecundario">sem registro</td>
                </tr>
              )
            }
            const humor = HUMORES.find((h) => h.valor === c.humor)
            return [
              <tr key={dia} className={c.acontecimento ? '' : 'border-b border-borda last:border-0'}>
                <td className="whitespace-nowrap px-4 py-3 font-interface text-xs font-semibold capitalize">{formatarDia(dia)}</td>
                <td className="whitespace-nowrap px-4 py-3"><span aria-hidden>{humor.emoji}</span> {humor.rotulo}</td>
                <td className="px-4 py-3">{rotuloEmocao(c)}</td>
                <td className="px-4 py-3">{rotuloEscala(ESCALA_ANSIEDADE, c.ansiedade)}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  {rotuloEscala(ESCALA_SONO, c.sonoQualidade)}
                  {c.sonoHoras !== null && <span className="text-textoSecundario"> · {decimal(c.sonoHoras)}h</span>}
                </td>
                <td className="px-4 py-3">{rotuloEscala(ESCALA_ENERGIA, c.energia)}</td>
                <td className="px-4 py-3">
                  {c.situacoes.map((s) => (s === 'outra' && c.situacaoOutra ? c.situacaoOutra : rotuloSituacao(s))).join(', ') || '—'}
                </td>
              </tr>,
              c.acontecimento && (
                <tr key={`${dia}-acontecimento`} className="border-b border-borda last:border-0">
                  <td />
                  <td colSpan={6} className="px-4 pb-3 text-textoSecundario">
                    <span className="font-interface text-xs font-semibold text-petroleo">Acontecimento: </span>
                    {c.acontecimento}
                  </td>
                </tr>
              ),
            ]
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function Paciente() {
  const { id } = useParams()
  const [periodo, setPeriodo] = useState(7)
  const [perfil, setPerfil] = useState(null)
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState('')
  const [salvandoModulo, setSalvandoModulo] = useState(false)

  const dias = useMemo(() => diasDoPeriodo(periodo), [periodo])

  useEffect(() => {
    buscarPerfil(id).then(setPerfil).catch(() => setErro('Paciente não encontrado.'))
  }, [id])

  useEffect(() => {
    const [a, m, d] = dias[0].split('-').map(Number)
    const inicioLocal = new Date(a, m - 1, d).toISOString()
    setDados(null)
    Promise.all([listarCheckins(id, dias[0]), listarRegistrosPensamento(id, inicioLocal), listarReflexoes(id)])
      .then(([checkins, registros, reflexoes]) => setDados({ checkins, registros, reflexoes }))
      .catch(() => setErro('Não foi possível carregar os registros.'))
  }, [id, dias])

  const sintese = useMemo(() => (dados ? gerarSintese({ ...dados, dias }) : null), [dados, dias])

  async function alternarModulo() {
    setSalvandoModulo(true)
    try {
      await definirRegistroPensamentos(id, !perfil.registroPensamentosAtivo)
      setPerfil((p) => ({ ...p, registroPensamentosAtivo: !p.registroPensamentosAtivo }))
    } catch {
      setErro('Não foi possível alterar o módulo agora.')
    } finally {
      setSalvandoModulo(false)
    }
  }

  if (erro && !perfil) return <p className="text-alerta">{erro}</p>
  if (!perfil) return <p className="text-textoSecundario">Carregando…</p>

  const ind = sintese?.indicadores

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <Link to="/app/admin" className="inline-flex items-center gap-1 font-interface text-sm text-textoSecundario hover:text-petroleo">
          <ArrowLeft size={16} aria-hidden /> Pacientes
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-3xl">{perfil.nome || 'Sem nome'}</h1>
          <div className="flex rounded-full border border-borda bg-branco p-1" role="group" aria-label="Período">
            {PERIODOS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                aria-pressed={periodo === p}
                className={`rounded-full px-4 py-1.5 font-interface text-xs font-semibold ${
                  periodo === p ? 'bg-petroleo text-branco' : 'text-textoSecundario hover:text-petroleo'
                }`}
              >
                {p} dias
              </button>
            ))}
          </div>
        </div>
        <label className="flex w-fit cursor-pointer items-center gap-3 rounded-xl bg-branco px-4 py-2 text-sm shadow-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-petroleo"
            checked={perfil.registroPensamentosAtivo}
            disabled={salvandoModulo}
            onChange={alternarModulo}
          />
          Registro de pensamentos ativo para este paciente
        </label>
        {erro && <p className="text-sm text-alerta">{erro}</p>}
      </div>

      {!sintese ? (
        <p className="text-textoSecundario">Carregando registros…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Indicador rotulo="Registros" valor={ind.registros} sufixo={` de ${ind.dias}`} detalhe="dias com check-in" />
            <Indicador rotulo="Humor médio" valor={decimal(ind.humorMedio)} sufixo="/5" />
            <Indicador rotulo="Ansiedade alta" valor={ind.diasAnsiedadeAlta} sufixo=" dias" detalhe="alta ou muito alta" />
            <Indicador
              rotulo="Sono"
              valor={decimal(ind.sonoQualidadeMedia)}
              sufixo="/5"
              detalhe={ind.sonoHorasMedia !== null ? `média de ${decimal(ind.sonoHorasMedia)}h por noite` : null}
            />
            <Indicador rotulo="Energia média" valor={decimal(ind.energiaMedia)} sufixo="/5" />
            <Indicador rotulo="Acontecimentos" valor={ind.acontecimentos} detalhe="relatos escritos" />
            <Indicador rotulo="Pensamentos" valor={ind.registrosPensamento} detalhe="registros no período" />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Secao titulo="Síntese" icone={<Info size={22} />}>
              <div className="space-y-2 rounded-2xl bg-branco p-5 shadow-sm">
                {sintese.frases.map((f) => <p key={f}>{f}</p>)}
                <p className="pt-2 text-xs text-textoSecundario">
                  Resumo descritivo do que o paciente registrou. Não indica causas nem substitui a avaliação clínica.
                </p>
              </div>
            </Secao>
            <Secao titulo="Possíveis temas para a sessão" icone={<MessageCircleQuestion size={22} />}>
              <ul className="space-y-2 rounded-2xl bg-nevoa p-5">
                {sintese.temas.length ? (
                  sintese.temas.map((t) => <li key={t} className="italic">{t}</li>)
                ) : (
                  <li className="text-textoSecundario">Sem sugestões para este período.</li>
                )}
              </ul>
            </Secao>
          </div>

          <Secao titulo="Linha do tempo" icone={<CalendarDays size={22} />}>
            <LinhaDoTempo dias={dias} checkins={sintese.checkinsDoPeriodo} />
          </Secao>

          <Secao titulo="Registros de pensamento" icone={<BrainCircuit size={22} />}>
            {sintese.registrosDoPeriodo.length === 0 ? (
              <p className="text-textoSecundario">Nenhum registro neste período.</p>
            ) : (
              <ul className="grid gap-3 md:grid-cols-2">
                {sintese.registrosDoPeriodo.map((r) => (
                  <li key={r.id} className="space-y-2 rounded-2xl bg-branco p-5 text-sm shadow-sm">
                    <p className="font-interface text-xs text-textoSecundario">
                      {new Date(r.ocorridoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                    <p><strong className="font-interface text-petroleo">Situação: </strong>{r.situacao}</p>
                    <p><strong className="font-interface text-petroleo">Pensamento: </strong><em>“{r.pensamento}”</em></p>
                    <p><strong className="font-interface text-petroleo">Emoção: </strong>{r.emocao} · {r.intensidade}/10</p>
                    {r.comportamento && <p><strong className="font-interface text-petroleo">Comportamento: </strong>{r.comportamento}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Secao>

          <Secao titulo="Reflexões semanais" icone={<Sprout size={22} />}>
            {dados.reflexoes.length === 0 ? (
              <p className="text-textoSecundario">Nenhuma reflexão registrada.</p>
            ) : (
              <ul className="grid gap-3 md:grid-cols-2">
                {dados.reflexoes.map((r) => (
                  <li key={r.id} className="space-y-2 rounded-2xl bg-branco p-5 text-sm shadow-sm">
                    <p className="font-interface text-xs font-semibold text-textoSecundario">
                      Semana de {formatarDia(r.semanaInicio, { day: '2-digit', month: '2-digit' })}
                      {r.percepcaoAvanco && ` · percepção de avanço ${r.percepcaoAvanco}/5`}
                    </p>
                    {r.avancos && <p><strong className="font-interface text-petroleo">Avanços: </strong>{r.avancos}</p>}
                    {r.dificuldades && <p><strong className="font-interface text-petroleo">Dificuldades: </strong>{r.dificuldades}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Secao>
        </>
      )}
    </div>
  )
}
