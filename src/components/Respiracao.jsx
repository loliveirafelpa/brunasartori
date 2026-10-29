import { useEffect, useState } from 'react'
import { Pause, Play } from 'lucide-react'

// Respiração guiada (expiração mais longa que a inspiração): um círculo que cresce e diminui no ritmo.
// Com "reduzir movimento" ligado no aparelho, o círculo fica parado e só o texto e a contagem mudam.
const FASES = [
  { rotulo: 'Inspire pelo nariz', segundos: 4, escala: 1 },
  { rotulo: 'Segure', segundos: 2, escala: 1 },
  { rotulo: 'Solte o ar devagar', segundos: 6, escala: 0.6 },
]

export default function Respiracao() {
  const [ativa, setAtiva] = useState(false)
  const [fase, setFase] = useState(0)
  const [restante, setRestante] = useState(FASES[0].segundos)

  useEffect(() => {
    if (!ativa) return
    const t = setTimeout(() => {
      if (restante > 1) return setRestante((r) => r - 1)
      const proxima = (fase + 1) % FASES.length
      setFase(proxima)
      setRestante(FASES[proxima].segundos)
    }, 1000)
    return () => clearTimeout(t)
  }, [ativa, fase, restante])

  function alternar() {
    if (!ativa) {
      setFase(0)
      setRestante(FASES[0].segundos)
    }
    setAtiva((a) => !a)
  }

  const atual = FASES[fase]
  return (
    <div className="flex flex-col items-center gap-5 py-2 text-center">
      <div className="flex h-52 w-52 items-center justify-center rounded-full bg-nevoa">
        <div
          className="flex h-52 w-52 items-center justify-center rounded-full bg-petroleo text-branco ease-in-out motion-safe:transition-transform"
          style={{ transform: `scale(${ativa ? atual.escala : 0.6})`, transitionDuration: `${atual.segundos}s` }}
          aria-hidden
        >
          {ativa && <span className="font-titulo text-4xl">{restante}</span>}
        </div>
      </div>
      <p className="min-h-[1.75rem] font-titulo text-xl text-petroleo" aria-live="polite">
        {ativa ? atual.rotulo : 'Quando estiver pronto(a), comece.'}
      </p>
      <button
        type="button"
        onClick={alternar}
        className="inline-flex items-center gap-2 rounded-full bg-petroleo px-6 py-3 font-interface text-sm font-semibold text-branco hover:bg-petroleoEscuro"
      >
        {ativa ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
        {ativa ? 'Pausar' : 'Começar a respiração'}
      </button>
    </div>
  )
}
