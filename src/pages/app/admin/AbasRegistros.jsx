import { useState } from 'react'
import { Handshake, Pencil } from 'lucide-react'
import { formatarDia } from '../../../lib/sintese'
import { inicioDaSemana } from '../../../lib/reflexoesApi'
import { listarObjetivosSemana, salvarObjetivoSemana } from '../../../lib/objetivosApi'
import Campo from '../../../components/Campo'
import Botao from '../../../components/Botao'
import BotaoAcao from '../../../components/BotaoAcao'

// Abas "Registro de pensamentos" e "Objetivo da semana" (reflexões) do painel do paciente.
// O petróleo da marca aparece como faixa de cabeçalho de cada cartão; o corpo fica claro.

const Vazio = ({ children }) => <p className="rounded-2xl bg-branco p-6 text-textoSecundario shadow-sm">{children}</p>

// Medidor de 0 a 10 — o número sempre aparece ao lado, a barra só reforça.
function Intensidade({ valor }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex gap-0.5" aria-hidden>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={`h-3 w-1.5 rounded-sm ${i < valor ? 'bg-verdeAgua' : 'bg-branco/20'}`} />
        ))}
      </span>
      <span className="font-interface text-sm font-semibold">{valor}/10</span>
    </span>
  )
}

// Uma etapa do registro (situação → pensamento → emoção → comportamento), ligada à seguinte por um fio.
function Etapa({ rotulo, ultima = false, children }) {
  return (
    <li className="relative pl-7">
      {!ultima && <span className="absolute left-[5px] top-4 h-[calc(100%-0.25rem)] w-px bg-borda" aria-hidden />}
      <span className="absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full border-2 border-petroleo bg-branco" aria-hidden />
      <p className="font-interface text-xs font-semibold uppercase tracking-wider text-petroleo">{rotulo}</p>
      <div className="mt-1 pb-5">{children}</div>
    </li>
  )
}

export function Pensamentos({ registros }) {
  if (!registros.length) return <Vazio>Nenhum registro de pensamento neste período.</Vazio>
  return (
    <ul className="mx-auto max-w-3xl space-y-5">
      {registros.map((r) => {
        const quando = new Date(r.ocorridoEm)
        return (
          <li key={r.id} className="overflow-hidden rounded-2xl bg-branco shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-petroleo px-5 py-3 text-branco">
              <p className="font-interface text-sm">
                <span className="font-semibold capitalize">{quando.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}</span>
                <span className="text-nevoa"> · {quando.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </p>
              <p className="flex items-center gap-3">
                <span className="rounded-full bg-branco/10 px-3 py-0.5 font-interface text-xs font-semibold">{r.emocao}</span>
                <Intensidade valor={r.intensidade} />
              </p>
            </div>
            <ol className="px-5 pt-5 sm:px-6">
              <Etapa rotulo="Situação">
                <p className="leading-relaxed">{r.situacao}</p>
              </Etapa>
              <Etapa rotulo="Pensamento">
                <p className="font-titulo text-xl italic leading-snug text-petroleo">“{r.pensamento}”</p>
              </Etapa>
              <Etapa rotulo="Emoção" ultima={!r.comportamento}>
                <p>
                  {r.emocao} <span className="text-textoSecundario">· intensidade {r.intensidade}/10</span>
                </p>
              </Etapa>
              {r.comportamento && (
                <Etapa rotulo="Comportamento" ultima>
                  <p className="leading-relaxed">{r.comportamento}</p>
                </Etapa>
              )}
            </ol>
          </li>
        )
      })}
    </ul>
  )
}

const PERCEPCOES = ['Nada', 'Pouco', 'Um pouco', 'Bastante', 'Muito']

function Percepcao({ valor }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex gap-1" aria-hidden>
        {PERCEPCOES.map((_, i) => (
          <span key={i} className={`h-2 w-2 rounded-full ${i < valor ? 'bg-verdeAgua' : 'bg-branco/25'}`} />
        ))}
      </span>
      <span className="font-interface text-xs">
        Avanço percebido: <strong className="font-semibold">{PERCEPCOES[valor - 1]}</strong>
      </span>
    </span>
  )
}

function fimDaSemana(iso) {
  const [a, m, d] = iso.split('-').map(Number)
  const fim = new Date(a, m - 1, d + 6)
  return fim.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function Bloco({ rotulo, children }) {
  return (
    <div>
      <p className="font-interface text-xs font-semibold uppercase tracking-wider text-petroleo">{rotulo}</p>
      <p className="mt-1.5 whitespace-pre-wrap leading-relaxed">{children}</p>
    </div>
  )
}

// Objetivo combinado para a semana atual, em destaque, editável aqui mesmo (só a psicóloga escreve).
function CombinadoDaSemana({ userId, semana, combinado, onSalvo }) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  function abrir() {
    setTexto(combinado?.texto ?? '')
    setErro('')
    setEditando(true)
  }

  async function salvar(e) {
    e.preventDefault()
    setEnviando(true)
    setErro('')
    try {
      await salvarObjetivoSemana(userId, semana, texto)
      await onSalvo()
      setEditando(false)
    } catch {
      setErro('Não foi possível salvar o objetivo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="rounded-2xl border-l-4 border-verdeAgua bg-branco p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 font-interface text-xs font-semibold uppercase tracking-wider text-petroleo">
          <Handshake size={14} className="text-salvia" aria-hidden /> Objetivo desta semana · {formatarDia(semana, { day: '2-digit', month: '2-digit' })} a{' '}
          {fimDaSemana(semana)}
        </p>
        {!editando && (
          <BotaoAcao icone={Pencil} className="-mr-3" onClick={abrir}>
            {combinado ? 'Editar' : 'Escrever o objetivo'}
          </BotaoAcao>
        )}
      </div>
      {editando ? (
        <form onSubmit={salvar} className="mt-3 space-y-3">
          <Campo
            rotulo="O que foi combinado na sessão"
            id="objetivo-semana"
            multilinha
            maxLength={2000}
            placeholder="Ex.: quando o chefe demorar a responder, anotar o pensamento antes de tirar conclusões."
            ajuda="O paciente vê este texto no Início e na aba Semana. Deixar em branco apaga o objetivo desta semana."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          {erro && <p className="text-sm text-alerta">{erro}</p>}
          <div className="flex gap-3">
            <Botao type="submit" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar objetivo'}</Botao>
            <Botao type="button" variante="discreto" onClick={() => setEditando(false)}>Cancelar</Botao>
          </div>
        </form>
      ) : combinado ? (
        <p className="mt-2 whitespace-pre-wrap font-titulo text-xl italic leading-snug text-petroleo">“{combinado.texto}”</p>
      ) : (
        <p className="mt-2 text-textoSecundario">Nenhum objetivo combinado para esta semana ainda.</p>
      )}
    </section>
  )
}

// Aba "Objetivo da semana": o objetivo desta semana no topo e, abaixo, semana a semana,
// o que foi combinado na sessão e a reflexão do paciente (avanço percebido, avanços e dificuldades).
export function Reflexoes({ userId, reflexoes, objetivosSemana }) {
  const semanaAtual = inicioDaSemana()
  const [combinados, setCombinados] = useState(objetivosSemana)
  const recarregar = async () => setCombinados(await listarObjetivosSemana(userId))

  const combinadoDe = (semana) => combinados.find((o) => o.semanaInicio === semana)
  const reflexaoDe = (semana) => reflexoes.find((r) => r.semanaInicio === semana)
  // Semanas com combinado ou reflexão, da mais recente para a mais antiga.
  const semanas = [...new Set([...combinados.map((o) => o.semanaInicio), ...reflexoes.map((r) => r.semanaInicio)])]
    .filter((s) => s !== semanaAtual || reflexaoDe(s))
    .sort((a, b) => b.localeCompare(a))

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <CombinadoDaSemana userId={userId} semana={semanaAtual} combinado={combinadoDe(semanaAtual)} onSalvo={recarregar} />

      {!semanas.length ? (
        <Vazio>Nenhuma semana anterior com objetivo ou reflexão.</Vazio>
      ) : (
        <ul className="space-y-5">
          {semanas.map((semana) => {
            const r = reflexaoDe(semana)
            // Na semana atual o objetivo já aparece em destaque acima.
            const combinado = semana !== semanaAtual && combinadoDe(semana)
            return (
              <li key={semana} className="overflow-hidden rounded-2xl bg-branco shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-petroleo px-5 py-3 text-branco">
                  <p className="font-titulo text-lg">
                    Semana de {formatarDia(semana, { day: '2-digit', month: '2-digit' })} a {fimDaSemana(semana)}
                  </p>
                  {r?.percepcaoAvanco && <Percepcao valor={r.percepcaoAvanco} />}
                </div>

                <div className="space-y-5 p-5 sm:p-6">
                  {combinado && (
                    <div className="rounded-xl border-l-4 border-petroleo bg-nevoa px-4 py-3">
                      <p className="flex items-center gap-1.5 font-interface text-xs font-semibold uppercase tracking-wider text-petroleo">
                        <Handshake size={13} aria-hidden /> Objetivo combinado na sessão
                      </p>
                      <p className="mt-1 leading-relaxed">{combinado.texto}</p>
                    </div>
                  )}

                  {r && (r.avancos || r.dificuldades) ? (
                    <div className="grid gap-5 sm:grid-cols-2 sm:gap-8">
                      {r.avancos && <Bloco rotulo="Avanços">{r.avancos}</Bloco>}
                      {r.dificuldades && <Bloco rotulo="O que foi mais difícil">{r.dificuldades}</Bloco>}
                    </div>
                  ) : (
                    !r && <p className="text-sm italic text-textoSecundario">O paciente não respondeu à reflexão desta semana.</p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
