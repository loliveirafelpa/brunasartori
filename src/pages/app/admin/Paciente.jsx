import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Lock } from 'lucide-react'
import { buscarPerfil, definirEncerramento } from '../../../lib/perfisApi'
import { hojeLocal, listarCheckins } from '../../../lib/checkinsApi'
import { listarRegistrosPensamento } from '../../../lib/pensamentosApi'
import { listarReflexoes } from '../../../lib/reflexoesApi'
import { listarObjetivosSemana } from '../../../lib/objetivosApi'
import { listarCrises, listarQuestionarios } from '../../../lib/protocolosApi'
import { diasDoPeriodo, diasEntre, formatarDia, gerarSintese } from '../../../lib/sintese'
import { gerarSinteseModulos } from '../../../lib/sinteseModulos'
import { deslocar } from '../../../lib/datas'
import ResumoPaciente from './ResumoPaciente'
import AnotacoesClinicas from './AnotacoesClinicas'
import Protocolos from './Protocolos'
import Graficos from './Graficos'
import Detalhamento from './Detalhamento'
import { Pensamentos, Reflexoes } from './AbasRegistros'
import Botao from '../../../components/Botao'

const PERIODOS = [7, 14, 30]

const ABAS = [
  { id: 'resumo', rotulo: 'Resumo', usaPeriodo: true },
  { id: 'graficos', rotulo: 'Gráficos', usaPeriodo: true },
  { id: 'detalhamento', rotulo: 'Detalhamento', usaPeriodo: true },
  { id: 'protocolos', rotulo: 'Protocolos', usaPeriodo: true },
  { id: 'reflexoes', rotulo: 'Objetivo da semana' },
  { id: 'pensamentos', rotulo: 'Registro de pensamentos', usaPeriodo: true },
  { id: 'anotacoes', rotulo: 'Anotações clínicas', restrita: true },
]

const dataBr = (iso) => formatarDia(iso, { day: '2-digit', month: '2-digit', year: 'numeric' })

// Períodos prontos (7 a 30 dias) ou datas escolhidas pela psicóloga ("datas"): um dia só ou um intervalo.
function SeletorPeriodo({ periodo, onPeriodo, intervalo, onIntervalo }) {
  const hoje = hojeLocal()
  const umDia = intervalo.inicio === intervalo.fim
  const [modo, setModo] = useState(umDia ? 'dia' : 'intervalo')
  const botao = (ativo) =>
    `inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-interface text-xs font-semibold ${
      ativo ? 'bg-petroleo text-branco' : 'text-textoSecundario hover:text-petroleo'
    }`
  // Ignora o campo vazio (enquanto a data é apagada para digitar outra).
  const muda = (campo) => (e) => e.target.value && onIntervalo({ ...intervalo, [campo]: e.target.value })
  const mudaDia = (e) => e.target.value && onIntervalo({ inicio: e.target.value, fim: e.target.value })
  const campoData = 'rounded-lg border border-borda bg-branco px-2 py-1 text-texto focus:border-petroleo'
  const opcaoModo = (ativo) =>
    `rounded-full px-2.5 py-1 font-semibold ${ativo ? 'bg-nevoa text-petroleo' : 'text-textoSecundario hover:text-petroleo'}`

  function escolherModo(novo) {
    setModo(novo)
    // Um dia: fica com a data final. Intervalo: se era um dia só, abre a última semana até ele.
    if (novo === 'dia') onIntervalo({ inicio: intervalo.fim, fim: intervalo.fim })
    else if (umDia) onIntervalo({ inicio: deslocar(intervalo.fim, -6), fim: intervalo.fim })
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap rounded-3xl border border-borda bg-branco p-1" role="group" aria-label="Período">
        {PERIODOS.map((p) => (
          <button key={p} onClick={() => onPeriodo(p)} aria-pressed={periodo === p} className={botao(periodo === p)}>
            {p} dias
          </button>
        ))}
        <button onClick={() => onPeriodo('datas')} aria-pressed={periodo === 'datas'} className={botao(periodo === 'datas')}>
          <CalendarDays size={13} aria-hidden /> Escolher data
        </button>
      </div>
      {periodo === 'datas' && (
        <div className="flex flex-wrap items-center gap-2 font-interface text-xs text-textoSecundario">
          <div className="flex" role="group" aria-label="Tipo de data">
            <button onClick={() => escolherModo('dia')} aria-pressed={modo === 'dia'} className={opcaoModo(modo === 'dia')}>
              Um dia
            </button>
            <button onClick={() => escolherModo('intervalo')} aria-pressed={modo === 'intervalo'} className={opcaoModo(modo === 'intervalo')}>
              Intervalo
            </button>
          </div>
          {modo === 'dia' ? (
            <label className="flex items-center gap-1.5">
              <span className="sr-only">Dia</span>
              <input type="date" className={campoData} value={intervalo.fim} max={hoje} onChange={mudaDia} />
            </label>
          ) : (
            <>
              <label className="flex items-center gap-1.5">
                De
                <input type="date" className={campoData} value={intervalo.inicio} max={intervalo.fim} onChange={muda('inicio')} />
              </label>
              <label className="flex items-center gap-1.5">
                até
                <input type="date" className={campoData} value={intervalo.fim} min={intervalo.inicio} max={hoje} onChange={muda('fim')} />
              </label>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Fica presa no topo ao rolar: nas abas longas (Gráficos, Detalhamento) dá para trocar sem voltar ao início.
// No celular, rola de lado; o degradê à direita mostra que há mais abas.
function Abas({ ativa, onChange }) {
  return (
    <div className="sticky top-0 z-20 -mx-4 bg-papel/95 px-4 pt-2 backdrop-blur sm:mx-0 sm:px-0">
      <div className="relative">
        <div className="sem-barra -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
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
                  className={`-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 pb-3 pt-2 font-interface text-sm font-semibold transition-colors ${
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
        <span className="pointer-events-none absolute inset-y-0 -right-4 w-10 bg-gradient-to-l from-papel sm:hidden" aria-hidden />
      </div>
    </div>
  )
}

export default function Paciente() {
  const { id } = useParams()
  const [busca, setBusca] = useSearchParams()
  const aba = ABAS.some((a) => a.id === busca.get('aba')) ? busca.get('aba') : 'resumo'
  const [periodo, setPeriodo] = useState(7) // número de dias ou 'datas'
  // "Escolher data" abre em um dia só (hoje); "Intervalo" amplia para a semana até ele.
  const [intervalo, setIntervalo] = useState(() => ({ inicio: hojeLocal(), fim: hojeLocal() }))
  const [perfil, setPerfil] = useState(null)
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const dias = useMemo(
    () => (periodo === 'datas' ? diasEntre(intervalo.inicio, intervalo.fim) : diasDoPeriodo(periodo)),
    [periodo, intervalo],
  )
  const rotuloPeriodo =
    periodo !== 'datas'
      ? `últimos ${periodo} dias`
      : dias.length === 1
        ? `em ${dataBr(dias[0])}`
        : `de ${dataBr(dias[0])} a ${dataBr(dias[dias.length - 1])}`

  useEffect(() => {
    buscarPerfil(id).then(setPerfil).catch(() => setErro('Paciente não encontrado.'))
  }, [id])

  useEffect(() => {
    const [a, m, d] = dias[0].split('-').map(Number)
    const inicioLocal = new Date(a, m - 1, d).toISOString()
    setDados(null)
    Promise.all([
      listarCheckins(id, dias[0]),
      listarRegistrosPensamento(id, inicioLocal),
      listarReflexoes(id),
      listarObjetivosSemana(id),
      listarCrises(id),
      listarQuestionarios(id),
    ])
      .then(([checkins, registros, reflexoes, objetivosSemana, crises, escalas]) =>
        setDados({ checkins, registros, reflexoes, objetivosSemana, crises, escalas }),
      )
      .catch(() => setErro('Não foi possível carregar os registros.'))
  }, [id, dias])

  // Síntese do check-in básico + síntese dos módulos e protocolos (frases e temas juntos no Resumo).
  const sintese = useMemo(() => {
    if (!dados || !perfil) return null
    const base = gerarSintese({ ...dados, dias })
    const modulos = gerarSinteseModulos({ perfil, checkins: base.checkinsDoPeriodo, crises: dados.crises, escalas: dados.escalas, dias })
    return { ...base, frases: [...base.frases, ...modulos.frases], temas: [...modulos.temas, ...base.temas], modulos }
  }, [dados, dias, perfil])

  async function alternarEncerramento() {
    const reabrir = Boolean(perfil.acompanhamentoEncerradoEm)
    const pergunta = reabrir
      ? 'Reabrir o acompanhamento? O paciente volta para a lista de ativos.'
      : 'Marcar o acompanhamento como encerrado? O paciente sai da lista de ativos, mas a conta e os registros continuam como estão.'
    if (!window.confirm(pergunta)) return
    const novaData = reabrir ? null : hojeLocal()
    setSalvando(true)
    try {
      await definirEncerramento(id, novaData)
      setPerfil((p) => ({ ...p, acompanhamentoEncerradoEm: novaData }))
    } catch {
      setErro('Não foi possível alterar o encerramento agora.')
    } finally {
      setSalvando(false)
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
          <div>
            <h1 className="text-3xl">{perfil.nome || 'Sem nome'}</h1>
            {perfil.acompanhamentoEncerradoEm && (
              <p className="mt-1 text-sm text-textoSecundario">
                Acompanhamento encerrado em {formatarDia(perfil.acompanhamentoEncerradoEm, { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            )}
          </div>
          {abaAtual.usaPeriodo && (
            <SeletorPeriodo periodo={periodo} onPeriodo={setPeriodo} intervalo={intervalo} onIntervalo={setIntervalo} />
          )}
        </div>
        {erro && <p className="text-sm text-alerta">{erro}</p>}
      </div>
      <Abas ativa={aba} onChange={(nova) => setBusca(nova === 'resumo' ? {} : { aba: nova }, { replace: true })} />

      <div id="painel-aba" role="tabpanel" aria-labelledby={`aba-${aba}`}>
        {precisaDosRegistros && !sintese ? (
          <p className="text-textoSecundario">Carregando registros…</p>
        ) : aba === 'resumo' ? (
          <ResumoPaciente userId={id} sintese={sintese} rotuloPeriodo={rotuloPeriodo} desde={dias[0]} />
        ) : aba === 'detalhamento' ? (
          <Detalhamento perfil={perfil} dias={dias} checkins={sintese.checkinsDoPeriodo} escalas={sintese.modulos.escalas} />
        ) : aba === 'graficos' ? (
          <Graficos
            userId={id}
            desde={dias[0]}
            perfil={perfil}
            dias={dias}
            checkins={sintese.checkinsDoPeriodo}
            crises={sintese.modulos.crisesDoPeriodo}
            escalas={sintese.modulos.escalas}
          />
        ) : aba === 'protocolos' ? (
          <Protocolos
            perfil={perfil}
            onPerfilAlterado={(mudancas) => setPerfil((p) => ({ ...p, ...mudancas }))}
            crises={sintese.modulos.crisesDoPeriodo}
            escalas={sintese.modulos.escalas}
          />
        ) : aba === 'pensamentos' ? (
          <Pensamentos registros={sintese.registrosDoPeriodo} />
        ) : aba === 'reflexoes' ? (
          <Reflexoes userId={id} reflexoes={dados.reflexoes} objetivosSemana={dados.objetivosSemana} />
        ) : (
          <div className="space-y-6">
            <AnotacoesClinicas userId={id} />
            <div className="flex flex-wrap items-center gap-3 border-t border-borda pt-5 text-sm text-textoSecundario">
              <Botao variante="secundario" onClick={alternarEncerramento} disabled={salvando}>
                {perfil.acompanhamentoEncerradoEm ? 'Reabrir acompanhamento' : 'Encerrar acompanhamento'}
              </Botao>
              Só organiza a lista de pacientes: a conta e os registros continuam como estão.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
