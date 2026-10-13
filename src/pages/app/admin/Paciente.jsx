import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Lock } from 'lucide-react'
import { buscarPerfil, definirRegistroPensamentos } from '../../../lib/perfisApi'
import { listarCheckins } from '../../../lib/checkinsApi'
import { listarRegistrosPensamento } from '../../../lib/pensamentosApi'
import { listarReflexoes } from '../../../lib/reflexoesApi'
import { listarObjetivosSemana } from '../../../lib/objetivosApi'
import { diasDoPeriodo, formatarDia, gerarSintese, rotuloEmocao, rotuloSituacao } from '../../../lib/sintese'
import { ESCALA_ENERGIA, ESCALA_SONO, HUMORES } from '../../../data/checkinOpcoes'
import ResumoPaciente from './ResumoPaciente'
import FichaEObjetivos from './FichaEObjetivos'
import AnotacoesClinicas from './AnotacoesClinicas'
import { Pensamentos, Reflexoes } from './AbasRegistros'

const PERIODOS = [7, 14, 30]

const ABAS = [
  { id: 'resumo', rotulo: 'Resumo', usaPeriodo: true },
  { id: 'linha', rotulo: 'Linha do tempo', usaPeriodo: true },
  { id: 'pensamentos', rotulo: 'Pensamentos', usaPeriodo: true },
  { id: 'reflexoes', rotulo: 'Semana' },
  { id: 'ficha', rotulo: 'Ficha e objetivos' },
  { id: 'anotacoes', rotulo: 'Anotações clínicas', restrita: true },
]

const decimal = (v, casas = 1) => (v === null ? '—' : v.toFixed(casas).replace('.', ','))

function Abas({ ativa, onChange }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div role="tablist" aria-label="Seções do paciente" className="flex min-w-max gap-1 border-b border-borda">
        {ABAS.map((a) => {
          const selecionada = a.id === ativa
          return (
            <button
              key={a.id}
              role="tab"
              id={`aba-${a.id}`}
              aria-selected={selecionada}
              aria-controls="painel-aba"
              onClick={() => onChange(a.id)}
              className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 pb-3 pt-2 font-interface text-sm font-semibold transition-colors ${
                selecionada ? 'border-petroleo text-petroleo' : 'border-transparent text-textoSecundario hover:text-petroleo'
              }`}
            >
              {a.restrita && <Lock size={13} aria-hidden />}
              {a.rotulo}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const rotuloEscala = (escala, v) => (v ? escala[v - 1] : '—')

function LinhaDoTempo({ dias, checkins }) {
  const porDia = Object.fromEntries(checkins.map((c) => [c.data, c]))
  return (
    <div className="overflow-x-auto rounded-2xl bg-branco shadow-sm">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="bg-petroleo font-interface text-[11px] uppercase tracking-wider text-nevoa">
          <tr>
            <th className="px-4 py-3">Dia</th>
            <th className="px-4 py-3">Humor</th>
            <th className="px-4 py-3">Emoção</th>
            <th className="px-4 py-3">Ansiedade</th>
            <th className="px-4 py-3">Sono</th>
            <th className="px-4 py-3">Energia</th>
            <th className="px-4 py-3">Movimento</th>
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
                  <td colSpan={7} className="px-4 py-3 italic text-textoSecundario">sem registro</td>
                </tr>
              )
            }
            const humor = HUMORES.find((h) => h.valor === c.humor)
            return [
              <tr key={dia} className={c.acontecimento ? '' : 'border-b border-borda last:border-0'}>
                <td className="whitespace-nowrap px-4 py-3 font-interface text-xs font-semibold capitalize">{formatarDia(dia)}</td>
                <td className="whitespace-nowrap px-4 py-3"><span aria-hidden>{humor.emoji}</span> {humor.rotulo}</td>
                <td className="px-4 py-3">{rotuloEmocao(c)}</td>
                <td className="px-4 py-3">{c.ansiedade === null ? '—' : `${c.ansiedade}/10`}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  {rotuloEscala(ESCALA_SONO, c.sonoQualidade)}
                  {c.sonoHoras !== null && <span className="text-textoSecundario"> · {decimal(c.sonoHoras)}h</span>}
                </td>
                <td className="px-4 py-3">{rotuloEscala(ESCALA_ENERGIA, c.energia)}</td>
                <td className="px-4 py-3">{c.exercicio === null ? '—' : c.exercicio ? 'Sim' : 'Não'}</td>
                <td className="px-4 py-3">
                  {c.situacoes.map((s) => (s === 'outra' && c.situacaoOutra ? c.situacaoOutra : rotuloSituacao(s))).join(', ') || '—'}
                </td>
              </tr>,
              c.acontecimento && (
                <tr key={`${dia}-acontecimento`} className="border-b border-borda last:border-0">
                  <td />
                  <td colSpan={7} className="px-4 pb-3 text-textoSecundario">
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
  const [busca, setBusca] = useSearchParams()
  const aba = ABAS.some((a) => a.id === busca.get('aba')) ? busca.get('aba') : 'resumo'
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
    Promise.all([listarCheckins(id, dias[0]), listarRegistrosPensamento(id, inicioLocal), listarReflexoes(id), listarObjetivosSemana(id)])
      .then(([checkins, registros, reflexoes, objetivosSemana]) => setDados({ checkins, registros, reflexoes, objetivosSemana }))
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

  const abaAtual = ABAS.find((a) => a.id === aba)
  const precisaDosRegistros = abaAtual.usaPeriodo || aba === 'reflexoes'

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link to="/app/admin" className="inline-flex items-center gap-1 font-interface text-sm text-textoSecundario hover:text-petroleo">
          <ArrowLeft size={16} aria-hidden /> Pacientes
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-3xl">{perfil.nome || 'Sem nome'}</h1>
          {abaAtual.usaPeriodo && (
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
          )}
        </div>
        <Abas ativa={aba} onChange={(nova) => setBusca(nova === 'resumo' ? {} : { aba: nova }, { replace: true })} />
        {erro && <p className="text-sm text-alerta">{erro}</p>}
      </div>

      <div id="painel-aba" role="tabpanel" aria-labelledby={`aba-${aba}`}>
        {precisaDosRegistros && !sintese ? (
          <p className="text-textoSecundario">Carregando registros…</p>
        ) : aba === 'resumo' ? (
          <ResumoPaciente userId={id} sintese={sintese} periodo={periodo} desde={dias[0]} />
        ) : aba === 'linha' ? (
          <LinhaDoTempo dias={dias} checkins={sintese.checkinsDoPeriodo} />
        ) : aba === 'pensamentos' ? (
          <Pensamentos registros={sintese.registrosDoPeriodo} />
        ) : aba === 'reflexoes' ? (
          <Reflexoes reflexoes={dados.reflexoes} objetivosSemana={dados.objetivosSemana} />
        ) : aba === 'ficha' ? (
          <div className="space-y-6">
            <label className="flex w-fit cursor-pointer items-center gap-3 rounded-xl bg-branco px-4 py-2.5 text-sm shadow-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-petroleo"
                checked={perfil.registroPensamentosAtivo}
                disabled={salvandoModulo}
                onChange={alternarModulo}
              />
              Registro de pensamentos ativo para este paciente
            </label>
            <FichaEObjetivos userId={id} />
          </div>
        ) : (
          <AnotacoesClinicas userId={id} />
        )}
      </div>
    </div>
  )
}
