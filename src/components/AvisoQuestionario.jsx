// Janela que aparece no Início quando há questionário pendente (pedido ou no prazo).
// "Responder mais tarde" fecha só por hoje: no dia seguinte ela volta, até o paciente responder.
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardCheck } from 'lucide-react'

// Cerca de 15 segundos por pergunta, arredondado para cima.
const minutos = (itens) => Math.max(1, Math.ceil((itens * 15) / 60))

export default function AvisoQuestionario({ escalas, onAdiar }) {
  const principal = useRef(null)
  const adiar = useRef(onAdiar)
  adiar.current = onAdiar

  // Foco no primeiro "Responder" ao abrir; Esc equivale a "Responder mais tarde".
  useEffect(() => {
    principal.current?.focus()
    const fechar = (e) => e.key === 'Escape' && adiar.current()
    window.addEventListener('keydown', fechar)
    return () => window.removeEventListener('keydown', fechar)
  }, [])

  const uma = escalas.length === 1

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-texto/50 p-4 sm:items-center" onClick={onAdiar}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="aviso-questionario-titulo"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-branco p-6 shadow-cartao sm:p-7"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-petroleo text-verdeAgua" aria-hidden>
          <ClipboardCheck size={24} />
        </span>
        <h2 id="aviso-questionario-titulo" className="mt-4 text-2xl leading-tight">
          {uma ? 'Sua psicóloga pediu um questionário' : 'Sua psicóloga pediu alguns questionários'}
        </h2>
        <p className="mt-2 text-textoSecundario">
          {uma ? 'É rápido e ajuda na próxima sessão.' : 'São rápidos e ajudam na próxima sessão.'} Você pode responder agora ou mais tarde.
        </p>

        <ul className="mt-5 space-y-2">
          {escalas.map((e, i) => (
            <li key={e.id}>
              <Link
                ref={i === 0 ? principal : undefined}
                to={`/app/questionario/${e.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-petroleo px-5 py-3.5 text-branco hover:bg-petroleoEscuro"
              >
                <span className="min-w-0">
                  <span className="block font-interface text-sm font-semibold">{uma ? 'Responder agora' : e.tituloPaciente}</span>
                  <span className="block text-xs text-nevoa">
                    {uma && `${e.tituloPaciente} · `}
                    {e.itens.length} perguntas · cerca de {minutos(e.itens.length)} min
                  </span>
                </span>
                {!uma && <span className="shrink-0 font-interface text-xs font-semibold text-verdeAgua">Responder</span>}
              </Link>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onAdiar}
          className="mt-3 w-full rounded-full px-5 py-3 font-interface text-sm font-semibold text-petroleo hover:bg-nevoa"
        >
          Responder mais tarde
        </button>
        <p className="text-center text-xs text-textoSecundario">Se não responder agora, o lembrete volta amanhã.</p>
      </section>
    </div>
  )
}
