import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import { salvarQuestionario } from '../../lib/protocolosApi'
import { ESCALAS, rotuloFrequencia } from '../../data/escalas'
import { escalasLigadas } from '../../data/modulos'
import Pagina, { Destaque } from '../../components/Pagina'
import Bloco from '../../components/Bloco'
import Botao from '../../components/Botao'
import AvisoCrise from '../../components/AvisoCrise'

// Questionário periódico de um módulo ligado (EPDS, GAD-7).
// O paciente não vê a pontuação: ela vai só para o painel da psicóloga.
export default function Questionario() {
  const { tipo } = useParams()
  const { usuario, perfil } = useAuth()
  const escala = ESCALAS[tipo]
  const [respostas, setRespostas] = useState(() => (escala ? escala.itens.map(() => null) : []))
  const [salvo, setSalvo] = useState(null)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Só abre o questionário que a psicóloga ligou para este paciente.
  const liberado = escala && escalasLigadas(perfil).includes(tipo)
  if (!liberado) return <Navigate to="/app" replace />

  const faltam = respostas.filter((r) => r === null).length

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    if (faltam) return setErro(`Faltam ${faltam} ${faltam === 1 ? 'pergunta' : 'perguntas'}.`)
    setEnviando(true)
    try {
      setSalvo(await salvarQuestionario(usuario.id, tipo, respostas))
      window.scrollTo({ top: 0 })
    } catch {
      setErro('Não foi possível salvar agora. Suas respostas continuam aqui.')
    } finally {
      setEnviando(false)
    }
  }

  if (salvo) {
    const risco = escala.itemRisco !== undefined && salvo.respostas[escala.itemRisco] > 0
    return (
      <Pagina
        sobretitulo="Questionário"
        titulo={
          <>
            Obrigada por <Destaque>responder</Destaque>.
          </>
        }
        descricao="Suas respostas foram guardadas e vão ajudar na conversa da próxima sessão."
      >
        {risco && (
          <Bloco>
            <p className="leading-relaxed">
              Você contou que pensamentos de se machucar passaram pela sua cabeça. Isso é importante e você não precisa
              atravessar sozinha. Se estiver difícil agora, procure ajuda:
            </p>
            <div className="-mt-4">
              <AvisoCrise destaque />
            </div>
          </Bloco>
        )}
        <Link
          to="/app"
          className="flex w-full items-center justify-center rounded-full bg-petroleo px-5 py-3 font-interface text-sm font-semibold text-branco shadow-cartao hover:bg-petroleoEscuro"
        >
          Voltar para o início
        </Link>
      </Pagina>
    )
  }

  return (
    <Pagina
      sobretitulo={perfil.escalas[tipo].frequencia === 'unica' ? 'Questionário' : `Questionário · ${rotuloFrequencia(perfil.escalas[tipo].frequencia).toLowerCase()}`}
      titulo={escala.tituloPaciente}
      descricao={escala.instrucao}
    >
      <form onSubmit={salvar} className="space-y-5">
        {escala.itens.map((item, i) => (
          <Bloco key={item.texto} titulo={`${i + 1} de ${escala.itens.length}`}>
            <fieldset>
              <legend className="mb-3 font-titulo text-lg leading-snug text-petroleo">{item.texto}</legend>
              <div className="space-y-2">
                {item.opcoes.map((o) => {
                  const marcada = respostas[i] === o.pontos
                  return (
                    <label
                      key={o.rotulo}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors ${
                        marcada ? 'border-petroleo bg-petroleo text-branco' : 'border-transparent bg-papel hover:border-salvia'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`item-${i}`}
                        checked={marcada}
                        onChange={() => setRespostas((rs) => rs.map((r, j) => (j === i ? o.pontos : r)))}
                        className="sr-only"
                      />
                      {o.rotulo}
                    </label>
                  )
                })}
              </div>
            </fieldset>
          </Bloco>
        ))}
        {erro && <p className="px-1 text-sm text-alerta" role="alert">{erro}</p>}
        <Botao type="submit" className="w-full py-3.5 text-base shadow-cartao" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Enviar respostas'}
        </Botao>
      </form>
    </Pagina>
  )
}
