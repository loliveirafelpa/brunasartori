// Anotações da psicóloga em um tópico (frase do Resumo, gráfico…). Só ela vê.
// Cada anotação guarda a `origem` legível ("Gráficos · Humor"), para aparecer reunida na aba Anotações clínicas.
import { useEffect, useId, useState } from 'react'
import { Lock, MessageSquarePlus, Pencil, Trash2 } from 'lucide-react'
import { apagarComentario, listarComentarios, salvarComentario } from '../lib/comentariosApi'
import { formatarDia } from '../lib/sintese'
import BotaoAcao from './BotaoAcao'

// Carrega as anotações feitas a partir de `desde` e devolve as ações de salvar e apagar.
export function useComentarios(userId, desde) {
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

  return { comentarios, erro, acoes }
}

export function FormComentario({ inicial = '', escuro, placeholder = 'Sua anotação sobre este tópico…', onSalvar, onCancelar }) {
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
        placeholder={placeholder}
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

// Lista as anotações de um tópico e o botão "Anotar". `escuro` = dentro de um bloco petróleo.
export function Comentarios({ topico, origem, comentarios, acoes, escuro = false, placeholder }) {
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
              await acoes.salvar({ id: c.id, topico, origem, texto: t })
              setEditando(null)
            }}
            onCancelar={() => setEditando(null)}
          />
        ) : (
          <div key={c.id} className={`mt-2 rounded-xl px-3 py-2 text-sm ${tomCaixa}`}>
            <div className={`flex items-center justify-between gap-3 font-interface text-xs ${tomSecundario}`}>
              <span className="flex items-center gap-1">
                <Lock size={12} aria-hidden /> Sua anotação · {formatarDia(c.data, { day: '2-digit', month: '2-digit' })}
              </span>
              <span className="-mr-1.5 flex">
                <button onClick={() => setEditando(c.id)} aria-label="Editar anotação" className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-borda/40">
                  <Pencil size={14} />
                </button>
                <button onClick={() => acoes.apagar(c)} aria-label="Apagar anotação" className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-borda/40">
                  <Trash2 size={14} />
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
          placeholder={placeholder}
          onSalvar={async (t) => {
            await acoes.salvar({ topico, origem, texto: t })
            setEditando(null)
          }}
          onCancelar={() => setEditando(null)}
        />
      ) : (
        <BotaoAcao icone={MessageSquarePlus} escuro={escuro} className="-ml-3" onClick={() => setEditando('novo')}>
          Anotar
        </BotaoAcao>
      )}
    </div>
  )
}
