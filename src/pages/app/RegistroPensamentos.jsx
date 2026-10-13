import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { apagarRegistroPensamento, criarRegistroPensamento, listarRegistrosPensamento } from '../../lib/pensamentosApi'
import { EMOCOES_SUGERIDAS, PASSOS_REGISTRO } from '../../data/pensamentosOpcoes'
import Campo from '../../components/Campo'
import Botao from '../../components/Botao'

const VAZIO = { situacao: '', pensamento: '', emocao: '', intensidade: 5, comportamento: '' }

function Formulario({ userId, onSalvo, onCancelar }) {
  const [form, setForm] = useState(VAZIO)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const muda = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    if (!form.situacao.trim() || !form.pensamento.trim() || !form.emocao.trim()) {
      return setErro('Preencha o que aconteceu, o pensamento e a emoção.')
    }
    setEnviando(true)
    try {
      const novo = await criarRegistroPensamento({ ...form, userId, intensidade: Number(form.intensidade) })
      onSalvo(novo)
    } catch {
      setErro('Não foi possível salvar agora. Tente de novo em instantes.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-5 rounded-2xl bg-branco p-6 shadow-sm">
      <Campo id="situacao" multilinha maxLength={2000} required rotulo={PASSOS_REGISTRO.situacao.rotulo} ajuda={PASSOS_REGISTRO.situacao.ajuda} value={form.situacao} onChange={muda('situacao')} />
      <Campo id="pensamento" multilinha maxLength={2000} required rotulo={PASSOS_REGISTRO.pensamento.rotulo} ajuda={PASSOS_REGISTRO.pensamento.ajuda} value={form.pensamento} onChange={muda('pensamento')} />

      <div>
        <Campo id="emocao" maxLength={80} required list="emocoes-sugeridas" rotulo={PASSOS_REGISTRO.emocao.rotulo} ajuda={PASSOS_REGISTRO.emocao.ajuda} value={form.emocao} onChange={muda('emocao')} />
        <datalist id="emocoes-sugeridas">
          {EMOCOES_SUGERIDAS.map((e) => <option key={e} value={e} />)}
        </datalist>
        <div className="mt-2 flex flex-wrap gap-2">
          {EMOCOES_SUGERIDAS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setForm((f) => ({ ...f, emocao: e }))}
              className={`rounded-full border px-3 py-1 font-interface text-xs ${
                form.emocao === e ? 'border-salvia bg-salvia text-branco' : 'border-borda text-texto hover:border-salvia'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="intensidade" className="font-interface text-sm font-semibold text-texto">
          {PASSOS_REGISTRO.intensidade.rotulo} <span className="text-petroleo">{form.intensidade}/10</span>
        </label>
        <input id="intensidade" type="range" min="0" max="10" step="1" value={form.intensidade} onChange={muda('intensidade')} className="mt-2 w-full accent-petroleo" />
        <p className="mt-1 text-xs text-textoSecundario">{PASSOS_REGISTRO.intensidade.ajuda}</p>
      </div>

      <Campo id="comportamento" multilinha maxLength={2000} rotulo={PASSOS_REGISTRO.comportamento.rotulo} ajuda={PASSOS_REGISTRO.comportamento.ajuda} value={form.comportamento} onChange={muda('comportamento')} />

      {erro && <p className="text-sm text-alerta" role="alert">{erro}</p>}
      <div className="flex gap-3">
        <Botao type="submit" disabled={enviando} className="flex-1">{enviando ? 'Salvando…' : 'Salvar registro'}</Botao>
        <Botao type="button" variante="secundario" onClick={onCancelar}>Cancelar</Botao>
      </div>
    </form>
  )
}

function Cartao({ registro, onApagar }) {
  const quando = new Date(registro.ocorridoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  return (
    <li className="space-y-3 rounded-2xl bg-branco p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="font-interface text-xs text-textoSecundario">{quando}</p>
        <button onClick={() => onApagar(registro)} className="text-textoSecundario hover:text-alerta" aria-label="Apagar registro">
          <Trash2 size={16} />
        </button>
      </div>
      <dl className="space-y-2 text-sm">
        <div><dt className="font-interface font-semibold text-petroleo">Situação</dt><dd>{registro.situacao}</dd></div>
        <div><dt className="font-interface font-semibold text-petroleo">Pensamento</dt><dd className="italic">“{registro.pensamento}”</dd></div>
        <div><dt className="font-interface font-semibold text-petroleo">Emoção</dt><dd>{registro.emocao}</dd></div>
        <div><dt className="font-interface font-semibold text-petroleo">Intensidade</dt><dd>{registro.intensidade}/10</dd></div>
        {registro.comportamento && (
          <div><dt className="font-interface font-semibold text-petroleo">Comportamento</dt><dd>{registro.comportamento}</dd></div>
        )}
      </dl>
    </li>
  )
}

export default function RegistroPensamentos() {
  const { usuario, perfil } = useAuth()
  const [registros, setRegistros] = useState(null)
  const [abrindoNovo, setAbrindoNovo] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    listarRegistrosPensamento(usuario.id).then(setRegistros).catch(() => setErro('Não foi possível carregar seus registros.'))
  }, [usuario.id])

  if (!perfil?.registroPensamentosAtivo) return <Navigate to="/app" replace />

  async function apagar(registro) {
    if (!window.confirm('Apagar este registro? Esta ação não pode ser desfeita.')) return
    try {
      await apagarRegistroPensamento(registro.id)
      setRegistros((rs) => rs.filter((r) => r.id !== registro.id))
    } catch {
      setErro('Não foi possível apagar agora.')
    }
  }

  return (
    <section className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl">
          Registro de <em className="text-salvia">pensamentos</em>
        </h1>
        <p className="mt-2 text-textoSecundario">
          Quando algo mexer com você, anote aqui o que aconteceu, o que pensou e o que sentiu. Você e sua psicóloga podem olhar para isso na sessão.
        </p>
      </div>

      {abrindoNovo ? (
        <Formulario
          userId={usuario.id}
          onSalvo={(novo) => {
            setRegistros((rs) => [novo, ...(rs ?? [])])
            setAbrindoNovo(false)
          }}
          onCancelar={() => setAbrindoNovo(false)}
        />
      ) : (
        <Botao onClick={() => setAbrindoNovo(true)} className="w-full">
          <Plus size={18} aria-hidden /> Novo registro
        </Botao>
      )}

      {erro && <p className="text-sm text-alerta" role="alert">{erro}</p>}
      {registros?.length === 0 && !abrindoNovo && (
        <p className="rounded-2xl bg-nevoa p-5 text-sm text-textoSecundario">Você ainda não fez nenhum registro.</p>
      )}
      <ul className="space-y-3">
        {registros?.map((r) => <Cartao key={r.id} registro={r} onApagar={apagar} />)}
      </ul>
    </section>
  )
}
