import { useEffect, useState } from 'react'
import { CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import {
  apagarRegistroPensamento,
  atualizarRegistroPensamento,
  criarRegistroPensamento,
  listarRegistrosPensamento,
} from '../../lib/pensamentosApi'
import { EMOCOES_SUGERIDAS, PASSOS_REGISTRO } from '../../data/pensamentosOpcoes'
import Campo from '../../components/Campo'
import Botao from '../../components/Botao'
import { Linha } from '../../components/RegistrosAnteriores'
import SeletorDeDia from '../../components/SeletorDeDia'
import Bloco from '../../components/Bloco'
import Pagina, { Destaque } from '../../components/Pagina'

const OUTRA = 'Outra'
const VAZIO = { situacao: '', pensamento: '', emocao: '', emocaoOutra: '', intensidade: 5, comportamento: '' }

// Converte um registro salvo para o formato do formulário (emoção fora da lista vira "Outra").
function paraFormulario(r) {
  const sugerida = EMOCOES_SUGERIDAS.includes(r.emocao)
  return {
    situacao: r.situacao,
    pensamento: r.pensamento,
    emocao: sugerida ? r.emocao : OUTRA,
    emocaoOutra: sugerida ? '' : r.emocao,
    intensidade: r.intensidade,
    comportamento: r.comportamento ?? '',
  }
}

// Sem `editando`, cria um registro novo; com `editando`, altera aquele registro.
function Formulario({ userId, editando, onSalvo, onCancelarEdicao }) {
  const [form, setForm] = useState(editando ? paraFormulario(editando) : VAZIO)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const muda = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    const emocao = form.emocao === OUTRA ? form.emocaoOutra.trim() : form.emocao
    if (!form.situacao.trim() || !form.pensamento.trim() || !emocao) {
      return setErro('Preencha a situação, o pensamento e a emoção.')
    }
    setEnviando(true)
    try {
      const dados = { ...form, emocao, userId, intensidade: Number(form.intensidade) }
      const salvo = editando ? await atualizarRegistroPensamento(editando.id, dados) : await criarRegistroPensamento(dados)
      setForm(VAZIO)
      onSalvo(salvo)
    } catch {
      setErro('Não foi possível salvar agora. Tente de novo em instantes.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={salvar} className={`space-y-6 rounded-3xl bg-branco p-5 shadow-cartao sm:p-7 ${editando ? 'ring-2 ring-verdeAgua' : ''}`}>
      {editando && (
        <p className="rounded-xl bg-nevoa px-4 py-3 text-sm text-petroleo">
          Editando o registro de{' '}
          <strong>{new Date(editando.ocorridoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</strong>.
        </p>
      )}
      <Campo id="situacao" multilinha maxLength={2000} required rotulo={PASSOS_REGISTRO.situacao.rotulo} ajuda={PASSOS_REGISTRO.situacao.ajuda} value={form.situacao} onChange={muda('situacao')} />
      <Campo id="pensamento" multilinha maxLength={2000} required rotulo={PASSOS_REGISTRO.pensamento.rotulo} ajuda={PASSOS_REGISTRO.pensamento.ajuda} value={form.pensamento} onChange={muda('pensamento')} />

      <fieldset>
        <legend className="font-interface text-sm font-semibold text-texto">{PASSOS_REGISTRO.emocao.rotulo}</legend>
        <p className="mt-1 text-xs text-textoSecundario">{PASSOS_REGISTRO.emocao.ajuda}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[...EMOCOES_SUGERIDAS, OUTRA].map((e) => (
            <button
              key={e}
              type="button"
              aria-pressed={form.emocao === e}
              onClick={() => setForm((f) => ({ ...f, emocao: e }))}
              className={`rounded-full border px-4 py-2 font-interface text-xs font-medium transition-colors ${
                form.emocao === e ? 'border-petroleo bg-petroleo text-branco' : 'border-transparent bg-papel text-texto hover:border-salvia'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        {form.emocao === OUTRA && (
          <div className="mt-3">
            <Campo id="emocao-outra" rotulo="Qual emoção?" maxLength={80} required value={form.emocaoOutra} onChange={muda('emocaoOutra')} />
          </div>
        )}
      </fieldset>

      <div>
        <label htmlFor="intensidade" className="font-interface text-sm font-semibold text-texto">
          {PASSOS_REGISTRO.intensidade.rotulo} <span className="text-petroleo">{form.intensidade}/10</span>
        </label>
        <input id="intensidade" type="range" min="0" max="10" step="1" value={form.intensidade} onChange={muda('intensidade')} className="mt-2 w-full accent-petroleo" />
        <p className="mt-1 text-xs text-textoSecundario">{PASSOS_REGISTRO.intensidade.ajuda}</p>
      </div>

      <Campo id="comportamento" multilinha maxLength={2000} rotulo={PASSOS_REGISTRO.comportamento.rotulo} ajuda={PASSOS_REGISTRO.comportamento.ajuda} value={form.comportamento} onChange={muda('comportamento')} />

      {erro && <p className="text-sm text-alerta" role="alert">{erro}</p>}
      <Botao type="submit" disabled={enviando} className="w-full py-3.5 text-base">
        {enviando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Salvar registro'}
      </Botao>
      {editando && (
        <Botao type="button" variante="discreto" className="w-full" onClick={onCancelarEdicao}>
          Cancelar edição
        </Botao>
      )}
    </form>
  )
}

function Cartao({ registro, onEditar, onApagar }) {
  const quando = new Date(registro.ocorridoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="font-interface text-xs text-textoSecundario">{quando}</p>
        <button onClick={() => onApagar(registro)} className="text-textoSecundario hover:text-alerta" aria-label="Apagar registro">
          <Trash2 size={16} />
        </button>
      </div>
      <Linha rotulo="Situação">{registro.situacao}</Linha>
      <Linha rotulo="Pensamento"><em>“{registro.pensamento}”</em></Linha>
      <Linha rotulo="Emoção">{registro.emocao}</Linha>
      <Linha rotulo="Intensidade">{registro.intensidade}/10</Linha>
      {registro.comportamento && <Linha rotulo="Comportamento">{registro.comportamento}</Linha>}
      <Botao variante="secundario" className="mt-2" onClick={() => onEditar(registro)}>
        <Pencil size={14} aria-hidden /> Editar este registro
      </Botao>
    </>
  )
}

export default function RegistroPensamentos() {
  const { usuario } = useAuth()
  const [registros, setRegistros] = useState(null)
  const [acabouDeSalvar, setAcabouDeSalvar] = useState(null) // 'novo' | 'editado' | null
  const [editando, setEditando] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    listarRegistrosPensamento(usuario.id).then(setRegistros).catch(() => setErro('Não foi possível carregar seus registros.'))
  }, [usuario.id])

  async function apagar(registro) {
    if (!window.confirm('Apagar este registro? Esta ação não pode ser desfeita.')) return
    try {
      await apagarRegistroPensamento(registro.id)
      setRegistros((rs) => rs.filter((r) => r.id !== registro.id))
      if (editando?.id === registro.id) setEditando(null)
    } catch {
      setErro('Não foi possível apagar agora.')
    }
  }

  return (
    <Pagina
      titulo={
        <>
          Registro de <Destaque>pensamentos</Destaque>
        </>
      }
      descricao="Quando algo mexer com você, anote o que aconteceu, o que pensou e o que sentiu. Você e sua psicóloga podem olhar para isso na sessão."
      aviso={
        acabouDeSalvar && (
          <p className="flex items-center gap-2 rounded-2xl bg-branco/10 px-4 py-3 text-sm text-branco" role="status">
            <CheckCircle2 size={18} className="shrink-0 text-verdeAgua" aria-hidden />
            {acabouDeSalvar === 'editado' ? 'Registro atualizado.' : 'Registro guardado. Se quiser, pode fazer outro.'}
          </p>
        )
      }
    >
      <Formulario
        key={editando?.id ?? 'novo'}
        userId={usuario.id}
        editando={editando}
        onCancelarEdicao={() => setEditando(null)}
        onSalvo={(salvo) => {
          if (editando) {
            setRegistros((rs) => rs.map((r) => (r.id === salvo.id ? salvo : r)))
            setAcabouDeSalvar('editado')
            setEditando(null)
          } else {
            setRegistros((rs) => [salvo, ...(rs ?? [])])
            setAcabouDeSalvar('novo')
          }
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />

      {erro && <p className="px-1 text-sm text-alerta" role="alert">{erro}</p>}

      {registros?.length > 0 && (
        <Bloco titulo="Registros anteriores">
          <SeletorDeDia
            rotulo="Escolha um registro"
            itens={registros}
            campoData="id"
            convite="Escolha um registro"
            formatarOpcao={(_, r) =>
              `${new Date(r.ocorridoEm).toLocaleString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · ${r.emocao}`
            }
            renderItem={(r) => (
              <Cartao
                registro={r}
                onApagar={apagar}
                onEditar={(reg) => {
                  setEditando(reg)
                  setAcabouDeSalvar(null)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            )}
          />
        </Bloco>
      )}
    </Pagina>
  )
}
