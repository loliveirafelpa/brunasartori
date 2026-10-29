// Aba "Gráficos" do painel do paciente: evolução no tempo, padrões e coincidências entre registros,
// e uma série por módulo/protocolo ligado. Tudo descritivo — o rodapé de cada seção lembra isso.
// Cada gráfico tem espaço para anotações da psicóloga, que também aparecem na aba Anotações clínicas.
import { MoveRight, TrendingDown, TrendingUp } from 'lucide-react'
import { BarrasHorizontais, ComparacaoGrupos, GraficoDiario } from '../../../components/Graficos'
import { Comentarios, useComentarios } from '../../../components/AnotacoesTopico'
import {
  ansiedadePorSituacao,
  distribuicaoHumor,
  emocoesMaisRegistradas,
  energiaPorMovimento,
  humorPorDiaDaSemana,
  humorPorSono,
  porDia,
  resumoSerie,
  SERIES_MODULOS,
} from '../../../lib/analises'
import { HUMORES } from '../../../data/checkinOpcoes'
import { MODULOS } from '../../../data/modulos'
import { ESCALAS } from '../../../data/escalas'
import { formatarDia } from '../../../lib/sintese'

const dec = (v) => v.toFixed(1).replace('.', ',')

const TENDENCIAS = {
  subindo: { Icone: TrendingUp, rotulo: 'subindo' },
  descendo: { Icone: TrendingDown, rotulo: 'descendo' },
  estavel: { Icone: MoveRight, rotulo: 'estável' },
}

// Média do período e tendência (1ª metade dos registros × 2ª metade), acima do gráfico de linha.
function MediaETendencia({ resumo, unidade = '' }) {
  if (!resumo) return null
  const t = resumo.tendencia && TENDENCIAS[resumo.tendencia.direcao]
  return (
    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-interface text-xs text-textoSecundario">
      <span>
        Média do período: <strong className="font-semibold text-texto">{dec(resumo.media)}{unidade}</strong>
      </span>
      {t ? (
        <span className="inline-flex items-center gap-1" title="Média da primeira metade dos registros comparada com a da segunda metade">
          Tendência: <t.Icone size={14} className="text-texto" aria-hidden />
          <strong className="font-semibold text-texto">{t.rotulo}</strong>
          <span>
            ({dec(resumo.tendencia.inicio)}{unidade} → {dec(resumo.tendencia.fim)}{unidade})
          </span>
        </span>
      ) : (
        <span>Tendência: poucos registros para calcular</span>
      )}
    </div>
  )
}

function Cartao({ titulo, subtitulo, rodape, resumo, topico, notas, largo = false, children }) {
  return (
    <section className={`flex flex-col rounded-2xl bg-branco p-5 shadow-sm sm:p-6 ${largo ? 'md:col-span-2' : ''}`}>
      <h3 className="font-interface text-sm font-semibold text-texto">{titulo}</h3>
      {subtitulo && <p className="mt-0.5 text-xs text-textoSecundario">{subtitulo}</p>}
      {resumo}
      <div className="mt-4">{children}</div>
      {rodape && <p className="mt-3 text-xs text-textoSecundario">{rodape}</p>}
      {/* Anotações sempre no pé do cartão, alinhadas entre cartões da mesma linha. */}
      <div className="mt-auto pt-4">
        <div className="border-t border-borda pt-3">
          <Comentarios
            topico={topico}
            origem={`Gráficos · ${titulo}`}
            comentarios={notas.comentarios}
            acoes={notas.acoes}
            placeholder="Seu insight sobre este gráfico…"
          />
        </div>
      </div>
    </section>
  )
}

function Secao({ titulo, descricao, children }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl sm:text-2xl">{titulo}</h2>
        {descricao && <p className="mt-1 text-sm text-textoSecundario">{descricao}</p>}
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </div>
  )
}

const SemDados = () => <p className="text-sm text-textoSecundario">Poucos registros neste período para montar o gráfico.</p>

// `desde`: primeiro dia do período — mostra as anotações feitas a partir dele.
export default function Graficos({ userId, desde, perfil, dias, checkins, crises, escalas }) {
  const notas = useComentarios(userId, desde)
  if (!checkins.length) return <p className="text-textoSecundario">Nenhum check-in neste período.</p>

  const series = {
    humor: porDia(checkins, (c) => c.humor),
    ansiedade: porDia(checkins, (c) => c.ansiedade),
    sono: porDia(checkins, (c) => c.sonoHoras),
    energia: porDia(checkins, (c) => c.energia),
  }
  const situacoes = ansiedadePorSituacao(checkins)
  const sono = humorPorSono(checkins)
  const movimento = energiaPorMovimento(checkins)
  const semana = humorPorDiaDaSemana(checkins)
  const emocoes = emocoesMaisRegistradas(checkins)
  const humores = distribuicaoHumor(checkins, HUMORES)
  const semRegistro = dias.length - checkins.length
  const modulos = MODULOS.filter((m) => checkins.some((c) => c.modulos?.[m.id]))
  const intensidadeCrises = Object.fromEntries(
    crises.map((c) => [c.ocorridoEm.slice(0, 10), c.intensidade]),
  )
  const comuns = { notas }

  return (
    <div className="space-y-10">
      {notas.erro && <p className="text-sm text-alerta">{notas.erro}</p>}
      <Secao
        titulo="Evolução no período"
        descricao="Pontos: o valor registrado em cada dia, ligados pela linha. Tracejado: média do período. A tendência compara a média da primeira metade dos registros com a da segunda."
      >
        <Cartao {...comuns} topico="grafico-humor" titulo="Humor (1 a 5)" resumo={<MediaETendencia resumo={resumoSerie(dias, series.humor, 4)} />}>
          <GraficoDiario dias={dias} valores={series.humor} min={1} max={5} rotuloValor="Humor" />
        </Cartao>
        <Cartao {...comuns} topico="grafico-ansiedade" titulo="Ansiedade ou estresse (0 a 10)" resumo={<MediaETendencia resumo={resumoSerie(dias, series.ansiedade, 10)} />}>
          <GraficoDiario dias={dias} valores={series.ansiedade} max={10} rotuloValor="Ansiedade" />
        </Cartao>
        <Cartao {...comuns} topico="grafico-sono" titulo="Horas de sono" resumo={<MediaETendencia resumo={resumoSerie(dias, series.sono, 10)} unidade="h" />}>
          <GraficoDiario dias={dias} valores={series.sono} max={10} unidade="h" rotuloValor="Sono" />
        </Cartao>
        <Cartao {...comuns} topico="grafico-energia" titulo="Energia (1 a 5)" resumo={<MediaETendencia resumo={resumoSerie(dias, series.energia, 4)} />}>
          <GraficoDiario dias={dias} valores={series.energia} min={1} max={5} rotuloValor="Energia" />
        </Cartao>
      </Secao>

      <Secao titulo="Padrões">
        <Cartao
          {...comuns}
          topico="grafico-humor-dias"
          titulo="Como foram os dias"
          subtitulo={`Quantos dias o paciente marcou cada humor no check-in.${semRegistro > 0 ? ` ${semRegistro} ${semRegistro === 1 ? 'dia' : 'dias'} sem registro.` : ''}`}
        >
          <BarrasHorizontais itens={humores} formatar={(v) => `${v} ${v === 1 ? 'dia' : 'dias'}`} />
        </Cartao>
        <Cartao {...comuns} topico="grafico-dia-semana" titulo="Humor médio por dia da semana" subtitulo="Ajuda a ver rotinas: fins de semana, dias de trabalho, dia da sessão.">
          {semana.length ? <BarrasHorizontais itens={semana} max={5} formatar={(v) => `${dec(v)}/5`} /> : <SemDados />}
        </Cartao>
        <Cartao {...comuns} topico="grafico-emocoes" titulo="Emoções mais presentes" subtitulo="Número de dias em que cada emoção foi a mais marcada.">
          <BarrasHorizontais itens={emocoes} formatar={(v) => String(v)} />
        </Cartao>
      </Secao>

      <Secao
        titulo="O que aparece junto"
        descricao="Coincidências entre registros do mesmo dia. Grupos com poucos dias pedem cautela: não indicam causa e não substituem a avaliação clínica."
      >
        <Cartao {...comuns} topico="grafico-situacoes" titulo="Ansiedade média por situação marcada" subtitulo="Só situações marcadas em 2 dias ou mais.">
          {situacoes.itens.length ? (
            <BarrasHorizontais
              itens={situacoes.itens}
              max={10}
              formatar={(v) => `${dec(v)}/10`}
              referencia={situacoes.geral !== null ? { valor: situacoes.geral, rotulo: `Média geral do período: ${dec(situacoes.geral)}/10` } : null}
            />
          ) : (
            <SemDados />
          )}
        </Cartao>
        {sono && (
          <Cartao
            {...comuns}
            topico="grafico-sono-humor"
            titulo="Humor depois de uma noite ruim"
            subtitulo="Noite ruim = o paciente marcou o sono como “ruim” ou “muito ruim” no check-in."
          >
            <p className="mb-4 text-texto">
              Nos {sono[0].n} dias depois de uma noite ruim, o humor médio foi <strong>{dec(sono[0].valor)}/5</strong>. Nos outros {sono[1].n} dias,{' '}
              <strong>{dec(sono[1].valor)}/5</strong>.
            </p>
            <ComparacaoGrupos grupos={sono} max={5} formatar={(v) => `${dec(v)}/5`} />
          </Cartao>
        )}
        {movimento && (
          <Cartao {...comuns} topico="grafico-movimento" titulo="Energia média com e sem movimento">
            <ComparacaoGrupos grupos={movimento} max={5} formatar={(v) => `${dec(v)}/5`} />
          </Cartao>
        )}
      </Secao>

      {(modulos.length > 0 || escalas.length > 0 || crises.length > 0) && (
        <Secao titulo="Protocolos e hábitos">
          {modulos.map((m) => {
            const s = SERIES_MODULOS[m.id]
            const valores = porDia(
              checkins.filter((c) => c.modulos?.[m.id]),
              (c) => s.ler(c.modulos[m.id]),
            )
            const amplitude = s.max !== undefined ? s.max - (s.min ?? 0) : undefined
            return (
              <Cartao
                {...comuns}
                key={m.id}
                topico={`grafico-${m.id}`}
                titulo={`${m.nome} · ${s.titulo}`}
                resumo={s.tipo === 'linha' ? <MediaETendencia resumo={resumoSerie(dias, valores, amplitude)} unidade={s.unidade ?? ''} /> : null}
              >
                <GraficoDiario
                  dias={dias}
                  valores={valores}
                  tipo={s.tipo}
                  min={s.min ?? 0}
                  max={s.max}
                  unidade={s.unidade ?? ''}
                  referencia={s.referencia}
                  rotuloValor={s.rotuloValor}
                />
              </Cartao>
            )
          })}
          {(perfil.modulos.crise || crises.length > 0) && (
            <Cartao
              {...comuns}
              topico="grafico-crises"
              titulo="Crises registradas · intensidade (0 a 10)"
              subtitulo={`${crises.length} ${crises.length === 1 ? 'crise' : 'crises'} no período.`}
            >
              <GraficoDiario dias={dias} valores={intensidadeCrises} tipo="colunas" max={10} rotuloValor="Intensidade" />
            </Cartao>
          )}
          {escalas.map(({ escala, historico }) => {
            const ordem = [...historico].reverse()
            return (
              <Cartao {...comuns} key={escala.id} topico={`grafico-escala-${escala.id}`} titulo={`${escala.nome} · todas as aplicações`} rodape={escala.referencia}>
                <BarrasHorizontais
                  itens={ordem.map((h) => ({
                    rotulo: formatarDia(h.data, { day: '2-digit', month: '2-digit', year: '2-digit' }),
                    valor: h.total,
                    detalhe: `${h.total} de ${ESCALAS[escala.id].maximo} pontos`,
                  }))}
                  max={escala.maximo}
                  formatar={(v) => `${v}/${escala.maximo}`}
                  referencia={{ valor: escala.corte, rotulo: `Ponto de corte de referência: ${escala.corte}` }}
                />
              </Cartao>
            )
          })}
        </Secao>
      )}

      <p className="border-t border-borda pt-4 text-xs italic text-textoSecundario">
        Os gráficos mostram só o que o paciente registrou. Coincidências entre dias não indicam causa e não substituem a avaliação clínica. Os mesmos dados, dia a dia e na íntegra, estão na aba “Detalhamento”.
      </p>
    </div>
  )
}
