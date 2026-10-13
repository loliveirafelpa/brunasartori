import { Handshake } from 'lucide-react'
import { formatarDia } from '../../../lib/sintese'

// Abas "Pensamentos" e "Reflexões" do painel do paciente.
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
      <p className="font-interface text-[11px] font-semibold uppercase tracking-wider text-petroleo">{rotulo}</p>
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
      <p className="font-interface text-[11px] font-semibold uppercase tracking-wider text-petroleo">{rotulo}</p>
      <p className="mt-1.5 whitespace-pre-wrap leading-relaxed">{children}</p>
    </div>
  )
}

export function Reflexoes({ reflexoes, objetivosSemana }) {
  if (!reflexoes.length) return <Vazio>Nenhuma reflexão semanal registrada.</Vazio>
  return (
    <ul className="mx-auto max-w-3xl space-y-5">
      {reflexoes.map((r) => {
        const combinado = objetivosSemana.find((o) => o.semanaInicio === r.semanaInicio)
        return (
          <li key={r.id} className="overflow-hidden rounded-2xl bg-branco shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-petroleo px-5 py-3 text-branco">
              <p className="font-titulo text-lg">
                Semana de {formatarDia(r.semanaInicio, { day: '2-digit', month: '2-digit' })} a {fimDaSemana(r.semanaInicio)}
              </p>
              {r.percepcaoAvanco && <Percepcao valor={r.percepcaoAvanco} />}
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              {(combinado || r.objetivo) && (
                <div className="rounded-xl border-l-4 border-petroleo bg-nevoa px-4 py-3">
                  {combinado ? (
                    <>
                      <p className="flex items-center gap-1.5 font-interface text-[11px] font-semibold uppercase tracking-wider text-petroleo">
                        <Handshake size={13} aria-hidden /> Combinado na sessão
                      </p>
                      <p className="mt-1 leading-relaxed">{combinado.texto}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-interface text-[11px] font-semibold uppercase tracking-wider text-petroleo">
                        Objetivo escrito pelo paciente
                      </p>
                      <p className="mt-1 leading-relaxed">{r.objetivo}</p>
                    </>
                  )}
                </div>
              )}

              {(r.avancos || r.dificuldades) && (
                <div className="grid gap-5 sm:grid-cols-2 sm:gap-8">
                  {r.avancos && <Bloco rotulo="Avanços">{r.avancos}</Bloco>}
                  {r.dificuldades && <Bloco rotulo="O que foi mais difícil">{r.dificuldades}</Bloco>}
                </div>
              )}

              {combinado && r.objetivo && (
                <p className="border-t border-borda pt-4 text-sm text-textoSecundario">
                  <span className="font-semibold">Objetivo escrito pelo paciente:</span> {r.objetivo}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
