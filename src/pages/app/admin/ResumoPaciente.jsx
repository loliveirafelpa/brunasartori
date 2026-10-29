// Aba "Resumo" do painel do paciente: números do período, síntese e possíveis temas para a sessão,
// cada tópico com espaço para anotações da psicóloga (só ela vê). As respostas dia a dia ficam na aba "Detalhamento".
import { AlertTriangle } from 'lucide-react'
import { formatarDia } from '../../../lib/sintese'
import { Comentarios, useComentarios } from '../../../components/AnotacoesTopico'

// Respostas que pedem atenção (item de risco em questionário, ameaça na escola…). Descritivo, sem diagnóstico.
function Alertas({ alertas }) {
  if (!alertas.length) return null
  return (
    <section className="rounded-2xl border-l-4 border-alerta bg-branco p-5 shadow-sm">
      <h2 className="flex items-center gap-2 font-interface text-xs font-semibold uppercase tracking-[0.14em] text-alerta">
        <AlertTriangle size={14} aria-hidden /> Para conferir com atenção
      </h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
        {alertas.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    </section>
  )
}

// Último resultado de cada questionário, no mesmo formato dos números do período.
// As respostas item a item ficam na aba "Detalhamento".
function UltimosQuestionarios({ escalas }) {
  if (!escalas.length) return null
  return (
    <section aria-label="Questionários" className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {escalas.map(({ escala, ultimo, anterior }) => {
        const acima = ultimo.total >= escala.corte
        return (
          <div key={escala.id} className={`rounded-2xl px-4 py-4 shadow-sm sm:px-5 ${acima ? 'bg-atencaoFundo' : 'bg-branco'}`}>
            <p className="font-interface text-xs font-semibold uppercase tracking-wider text-textoSecundario">{escala.nome}</p>
            <p className="mt-1 font-titulo text-3xl leading-none text-petroleo">
              {ultimo.total}
              <span className="ml-0.5 font-corpo text-sm text-textoSecundario">/{escala.maximo}</span>
            </p>
            <p className={`mt-1.5 text-xs ${acima ? 'text-atencao' : 'text-textoSecundario'}`}>
              em {formatarDia(ultimo.data, { day: '2-digit', month: '2-digit' })}
              {anterior && ` · antes ${anterior.total}`}
              {acima && ' · a partir do corte'}
            </p>
          </div>
        )
      })}
    </section>
  )
}

const decimal = (v, casas = 1) => (v === null ? '—' : v.toFixed(casas).replace('.', ','))

function Numero({ rotulo, valor, sufixo, detalhe }) {
  return (
    <div className="bg-branco px-4 py-4 sm:px-5">
      <p className="font-interface text-xs font-semibold uppercase tracking-wider text-textoSecundario">{rotulo}</p>
      <p className="mt-1 font-titulo text-3xl leading-none text-petroleo">
        {valor}
        {sufixo && <span className="ml-0.5 font-corpo text-sm text-textoSecundario">{sufixo}</span>}
      </p>
      {detalhe && <p className="mt-1.5 text-xs text-textoSecundario">{detalhe}</p>}
    </div>
  )
}

function Numeros({ ind }) {
  return (
    <section aria-label="Números do período" className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-borda shadow-sm md:grid-cols-4">
      <Numero rotulo="Check-ins" valor={ind.registros} sufixo={`/${ind.dias}`} detalhe="dias com registro" />
      <Numero rotulo="Humor médio" valor={decimal(ind.humorMedio)} sufixo="/5" />
      <Numero rotulo="Ansiedade alta" valor={ind.diasAnsiedadeAlta} sufixo={ind.diasAnsiedadeAlta === 1 ? ' dia' : ' dias'} detalhe="7/10 ou mais" />
      <Numero
        rotulo="Sono"
        valor={decimal(ind.sonoQualidadeMedia)}
        sufixo="/5"
        detalhe={ind.sonoHorasMedia !== null ? `${decimal(ind.sonoHorasMedia)}h por noite, em média` : null}
      />
      <Numero rotulo="Energia média" valor={decimal(ind.energiaMedia)} sufixo="/5" />
      <Numero rotulo="Movimento" valor={ind.diasMovimento} sufixo={`/${ind.diasMovimentoRespondidos}`} detalhe="dias respondidos" />
      <Numero rotulo="Acontecimentos" valor={ind.acontecimentos} detalhe="relatos escritos" />
      <Numero rotulo="Pensamentos" valor={ind.registrosPensamento} detalhe="registros no período" />
    </section>
  )
}

const chaveDoTopico = (rotulo) =>
  rotulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')

// Síntese em linhas: cada frase com o rótulo da dimensão a que se refere.
function Sintese({ frases, rotuloPeriodo, comentarios, acoes }) {
  return (
    <section className="rounded-2xl bg-branco p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl sm:text-2xl">Síntese</h2>
        <p className="font-interface text-xs text-textoSecundario">{rotuloPeriodo}</p>
      </div>
      <dl className="mt-5 divide-y divide-borda">
        {frases.map((f) => (
          <div key={f.rotulo} className="grid gap-1 py-3.5 sm:grid-cols-[9rem,1fr] sm:gap-6">
            <dt className="pt-0.5 font-interface text-xs font-semibold uppercase tracking-wider text-petroleo">{f.rotulo}</dt>
            <dd className="leading-relaxed text-texto">
              {f.texto}
              <Comentarios topico={chaveDoTopico(f.rotulo)} origem={`Resumo · ${f.rotulo}`} comentarios={comentarios} acoes={acoes} />
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 border-t border-borda pt-4 text-xs italic text-textoSecundario">
        Descreve apenas o que o paciente registrou. Coincidências entre dias não indicam causa e não substituem a avaliação clínica.
      </p>
    </section>
  )
}

// Temas em destaque: fundo petróleo, perguntas em itálico.
function Temas({ temas, comentarios, acoes }) {
  return (
    <section className="rounded-2xl bg-petroleo p-6 text-branco shadow-sm sm:p-8">
      <h2 className="text-xl text-branco sm:text-2xl">Possíveis temas para a sessão</h2>
      <p className="mt-1 text-sm text-nevoa">Sugestões a partir dos registros. Use só o que fizer sentido para o momento do paciente.</p>

      {temas.length === 0 ? (
        <p className="mt-6 text-nevoa">Sem sugestões para este período.</p>
      ) : (
        <ul className="mt-4 divide-y divide-branco/15">
          {temas.map((t) => (
            <li key={t.origem + t.pergunta} className="space-y-2.5 py-5 last:pb-0">
              <p className="flex items-center gap-2 font-interface text-xs font-semibold uppercase tracking-wider text-nevoa">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-verdeAgua" aria-hidden />
                {t.origem}
              </p>
              {t.citacao && (
                <blockquote className="border-l-2 border-verdeAgua pl-3 text-sm leading-relaxed text-nevoa">“{t.citacao}”</blockquote>
              )}
              <p className="font-titulo text-xl italic leading-snug text-branco">{t.pergunta}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 border-t border-branco/15 pt-4">
        <p className="mb-1 font-interface text-xs font-semibold uppercase tracking-wider text-nevoa">Suas anotações sobre os temas</p>
        <Comentarios topico="temas" origem="Resumo · Possíveis temas para a sessão" comentarios={comentarios} acoes={acoes} escuro />
      </div>
    </section>
  )
}

// `desde`: primeiro dia do período — mostra as anotações feitas a partir dele.
export default function ResumoPaciente({ userId, sintese, rotuloPeriodo, desde }) {
  const { comentarios, erro, acoes } = useComentarios(userId, desde)

  return (
    <div className="space-y-6">
      <Alertas alertas={sintese.modulos.alertas} />
      <Numeros ind={sintese.indicadores} />
      <UltimosQuestionarios escalas={sintese.modulos.escalas} />
      {erro && <p className="text-sm text-alerta">{erro}</p>}
      <Sintese frases={sintese.frases} rotuloPeriodo={rotuloPeriodo} comentarios={comentarios} acoes={acoes} />
      <Temas temas={sintese.temas} comentarios={comentarios} acoes={acoes} />
    </div>
  )
}
