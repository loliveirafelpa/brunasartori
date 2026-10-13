// Aba "Resumo" do painel do paciente: números do período, síntese e possíveis temas para a sessão.

const decimal = (v, casas = 1) => (v === null ? '—' : v.toFixed(casas).replace('.', ','))

function Numero({ rotulo, valor, sufixo, detalhe }) {
  return (
    <div className="bg-branco px-4 py-4 sm:px-5">
      <p className="font-interface text-[11px] font-semibold uppercase tracking-wider text-textoSecundario">{rotulo}</p>
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

// Síntese em linhas: cada frase com o rótulo da dimensão a que se refere.
function Sintese({ frases, periodo }) {
  return (
    <section className="rounded-2xl bg-branco p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl">Síntese</h2>
        <p className="font-interface text-xs text-textoSecundario">últimos {periodo} dias</p>
      </div>
      <dl className="mt-5 divide-y divide-borda">
        {frases.map((f) => (
          <div key={f.rotulo} className="grid gap-1 py-3.5 sm:grid-cols-[9rem,1fr] sm:gap-6">
            <dt className="pt-0.5 font-interface text-[11px] font-semibold uppercase tracking-wider text-petroleo">{f.rotulo}</dt>
            <dd className="leading-relaxed text-texto">{f.texto}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 border-t border-borda pt-4 text-xs italic text-textoSecundario">
        Descreve apenas o que o paciente registrou. Coincidências entre dias não indicam causa e não substituem a avaliação clínica.
      </p>
    </section>
  )
}

// Temas no tom dos posts da Bruna: fundo petróleo, perguntas em serifa itálica.
function Temas({ temas }) {
  return (
    <section className="rounded-2xl bg-petroleo p-6 text-branco shadow-sm sm:p-8">
      <h2 className="text-2xl text-branco">Possíveis temas para a sessão</h2>
      <p className="mt-1 text-sm text-nevoa">Sugestões a partir dos registros. Use só o que fizer sentido para o momento do paciente.</p>

      {temas.length === 0 ? (
        <p className="mt-6 text-nevoa">Sem sugestões para este período.</p>
      ) : (
        <ul className="mt-4 divide-y divide-branco/15">
          {temas.map((t) => (
            <li key={t.origem + t.pergunta} className="space-y-2.5 py-5 last:pb-0">
              <p className="flex items-center gap-2 font-interface text-[11px] font-semibold uppercase tracking-wider text-nevoa">
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
    </section>
  )
}

export default function ResumoPaciente({ sintese, periodo }) {
  return (
    <div className="space-y-6">
      <Numeros ind={sintese.indicadores} />
      <Sintese frases={sintese.frases} periodo={periodo} />
      <Temas temas={sintese.temas} />
    </div>
  )
}
