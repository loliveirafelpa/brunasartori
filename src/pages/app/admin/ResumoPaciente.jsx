// Aba "Resumo" do painel do paciente: números do período, síntese e possíveis temas para a sessão,
// cada tópico com espaço para anotações da psicóloga (só ela vê).
import { useEffect, useId, useState } from 'react'
import { Lock, MessageSquarePlus, Pencil, Trash2 } from 'lucide-react'
import { apagarComentario, listarComentarios, salvarComentario } from '../../../lib/comentariosApi'
import { formatarDia } from '../../../lib/sintese'

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

// ---------------------------------------------------------------------------
// Anotações da psicóloga em cada tópico (só ela vê)
// ---------------------------------------------------------------------------
const chaveDoTopico = (rotulo) =>
  rotulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')

function FormComentario({ inicial = '', escuro, onSalvar, onCancelar }) {
  const [texto, setTexto] = useState(inicial)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const id = useId()

  async function salvar(e) {
    e.preventDefault()
    if (!texto.trim()) return onCancelar()
    setEnviando(true)
    try {
      await onSalvar(texto)
    } catch {
      setErro('Não foi possível salvar a anotação.')
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={salvar} className="mt-2 space-y-2">
      <label className="sr-only" htmlFor={id}>Sua anotação</label>
      <textarea
        id={id}
        rows={3}
        maxLength={4000}
        autoFocus
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Sua anotação sobre este tópico…"
        className="w-full rounded-xl border border-borda bg-branco px-3 py-2 text-sm text-texto placeholder:text-textoSecundario focus:border-petroleo"
      />
      {erro && <p className={`text-sm ${escuro ? 'text-alertaFundo' : 'text-alerta'}`}>{erro}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={enviando}
          className={`rounded-full px-4 py-1.5 font-interface text-xs font-semibold disabled:opacity-50 ${
            escuro ? 'bg-branco text-petroleo hover:bg-nevoa' : 'bg-petroleo text-branco hover:bg-petroleoEscuro'
          }`}
        >
          {enviando ? 'Salvando…' : 'Salvar anotação'}
        </button>
        <button type="button" onClick={onCancelar} className={`font-interface text-xs ${escuro ? 'text-nevoa' : 'text-textoSecundario'} hover:underline`}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

// Lista as anotações de um tópico e o botão "Anotar". `escuro` = dentro do bloco petróleo.
function Comentarios({ topico, comentarios, acoes, escuro = false }) {
  const [editando, setEditando] = useState(null) // 'novo' | id
  const meus = comentarios.filter((c) => c.topico === topico)
  const tomCaixa = escuro ? 'bg-branco/10 text-branco' : 'bg-nevoa text-texto'
  const tomSecundario = escuro ? 'text-nevoa' : 'text-textoSecundario'

  return (
    <div className="space-y-2">
      {meus.map((c) =>
        editando === c.id ? (
          <FormComentario
            key={c.id}
            inicial={c.texto}
            escuro={escuro}
            onSalvar={async (t) => {
              await acoes.salvar({ id: c.id, topico, texto: t })
              setEditando(null)
            }}
            onCancelar={() => setEditando(null)}
          />
        ) : (
          <div key={c.id} className={`mt-2 rounded-xl px-3 py-2 text-sm ${tomCaixa}`}>
            <div className={`flex items-center justify-between gap-3 font-interface text-[11px] ${tomSecundario}`}>
              <span className="flex items-center gap-1">
                <Lock size={11} aria-hidden /> Sua anotação · {formatarDia(c.data, { day: '2-digit', month: '2-digit' })}
              </span>
              <span className="flex gap-2.5">
                <button onClick={() => setEditando(c.id)} aria-label="Editar anotação" className="hover:opacity-70">
                  <Pencil size={13} />
                </button>
                <button onClick={() => acoes.apagar(c)} aria-label="Apagar anotação" className="hover:opacity-70">
                  <Trash2 size={13} />
                </button>
              </span>
            </div>
            <p className="mt-0.5 whitespace-pre-wrap leading-relaxed">{c.texto}</p>
          </div>
        ),
      )}
      {editando === 'novo' ? (
        <FormComentario
          escuro={escuro}
          onSalvar={async (t) => {
            await acoes.salvar({ topico, texto: t })
            setEditando(null)
          }}
          onCancelar={() => setEditando(null)}
        />
      ) : (
        <button
          onClick={() => setEditando('novo')}
          className={`inline-flex items-center gap-1 font-interface text-[11px] font-semibold ${
            escuro ? 'text-nevoa hover:text-branco' : 'text-petroleo/70 hover:text-petroleo'
          }`}
        >
          <MessageSquarePlus size={13} aria-hidden /> Anotar
        </button>
      )}
    </div>
  )
}

// Síntese em linhas: cada frase com o rótulo da dimensão a que se refere.
function Sintese({ frases, periodo, comentarios, acoes }) {
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
            <dd className="leading-relaxed text-texto">
              {f.texto}
              <Comentarios topico={chaveDoTopico(f.rotulo)} comentarios={comentarios} acoes={acoes} />
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

// Temas no tom dos posts da Bruna: fundo petróleo, perguntas em serifa itálica.
function Temas({ temas, comentarios, acoes }) {
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

      <div className="mt-6 border-t border-branco/15 pt-4">
        <p className="mb-1 font-interface text-[11px] font-semibold uppercase tracking-wider text-nevoa">Suas anotações sobre os temas</p>
        <Comentarios topico="temas" comentarios={comentarios} acoes={acoes} escuro />
      </div>
    </section>
  )
}

// `desde`: primeiro dia do período — mostra as anotações feitas a partir dele.
export default function ResumoPaciente({ userId, sintese, periodo, desde }) {
  const [comentarios, setComentarios] = useState([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    listarComentarios(userId, desde).then(setComentarios).catch(() => setErro('Não foi possível carregar suas anotações.'))
  }, [userId, desde])

  const acoes = {
    salvar: async (c) => {
      const salvo = await salvarComentario(userId, c)
      setComentarios((l) => (c.id ? l.map((x) => (x.id === salvo.id ? salvo : x)) : [...l, salvo]))
    },
    apagar: async (c) => {
      if (!window.confirm('Apagar esta anotação?')) return
      try {
        await apagarComentario(c.id)
        setComentarios((l) => l.filter((x) => x.id !== c.id))
      } catch {
        setErro('Não foi possível apagar a anotação.')
      }
    },
  }

  return (
    <div className="space-y-6">
      <Numeros ind={sintese.indicadores} />
      {erro && <p className="text-sm text-alerta">{erro}</p>}
      <Sintese frases={sintese.frases} periodo={periodo} comentarios={comentarios} acoes={acoes} />
      <Temas temas={sintese.temas} comentarios={comentarios} acoes={acoes} />
    </div>
  )
}
