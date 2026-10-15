import { useEffect, useRef } from 'react'

const ALTURA = 40 // altura de cada linha da roda, em px
const HORAS = Array.from({ length: 25 }, (_, i) => i)
const MINUTOS = [0, 30]
const PADRAO = { horas: 8, minutos: 0 } // onde a roda para enquanto nada foi escolhido

const p2 = (n) => String(n).padStart(2, '0')

// Uma coluna rolável, como a do alarme do celular: a linha no centro é a escolhida.
// Só avisa mudança depois que o paciente mexe — posicionar a roda não conta como resposta.
function Coluna({ rotulo, opcoes, valor, formatar, ativo, onChange }) {
  const ref = useRef(null)
  const mexeu = useRef(false)
  const espera = useRef(null)
  const indice = Math.max(0, opcoes.indexOf(valor))

  useEffect(() => {
    const el = ref.current
    if (el && Math.round(el.scrollTop / ALTURA) !== indice) {
      mexeu.current = false // reposicionada pelo app (ex.: "limpar"), não pelo paciente
      el.scrollTop = indice * ALTURA
    }
  }, [indice])

  useEffect(() => () => clearTimeout(espera.current), [])

  function aoRolar() {
    if (!mexeu.current) return
    clearTimeout(espera.current)
    espera.current = setTimeout(() => {
      const i = Math.min(opcoes.length - 1, Math.max(0, Math.round(ref.current.scrollTop / ALTURA)))
      onChange(opcoes[i])
    }, 120)
  }

  function irPara(i) {
    mexeu.current = true
    const alvo = Math.min(opcoes.length - 1, Math.max(0, i))
    ref.current.scrollTo({ top: alvo * ALTURA, behavior: 'smooth' })
    onChange(opcoes[alvo])
  }

  function teclado(e) {
    const passos = { ArrowUp: -1, ArrowDown: 1 }
    if (!(e.key in passos)) return
    e.preventDefault()
    irPara(indice + passos[e.key])
  }

  const marcar = () => (mexeu.current = true)

  return (
    <div
      ref={ref}
      role="spinbutton"
      tabIndex={0}
      aria-label={rotulo}
      aria-valuenow={valor}
      aria-valuetext={formatar(valor)}
      aria-valuemin={opcoes[0]}
      aria-valuemax={opcoes[opcoes.length - 1]}
      onScroll={aoRolar}
      onPointerDown={marcar}
      onTouchStart={marcar}
      onWheel={marcar}
      onKeyDown={teclado}
      className="sem-barra relative z-10 w-20 snap-y snap-mandatory overflow-y-scroll overscroll-contain rounded-xl"
      style={{
        height: ALTURA * 3,
        maskImage: 'linear-gradient(transparent, black 35%, black 65%, transparent)',
        WebkitMaskImage: 'linear-gradient(transparent, black 35%, black 65%, transparent)',
      }}
    >
      <div style={{ height: ALTURA }} aria-hidden />
      {opcoes.map((o, i) => (
        <button
          key={o}
          type="button"
          tabIndex={-1}
          onClick={() => irPara(i)}
          className={`block w-full snap-center text-center font-interface tabular-nums transition-colors ${
            i === indice && ativo ? 'text-xl font-semibold text-petroleo' : 'text-lg text-textoSecundario'
          }`}
          style={{ height: ALTURA }}
        >
          {formatar(o)}
        </button>
      ))}
      <div style={{ height: ALTURA }} aria-hidden />
    </div>
  )
}

// Horas dormidas em duas rodas (horas e minutos, de meia em meia hora).
// `valor` é número (7.5 = 7h30) ou '' quando não respondido.
export default function RodaHorasSono({ id, rotulo, valor, onChange }) {
  const respondido = valor !== '' && valor !== null && valor !== undefined
  const horas = respondido ? Math.floor(valor) : PADRAO.horas
  const minutos = respondido ? (valor % 1 ? 30 : 0) : PADRAO.minutos

  const definir = (h, m) => onChange(h === 24 ? 24 : h + m / 60)

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p id={id} className="font-titulo text-lg leading-snug text-petroleo">{rotulo}</p>
        <span className="shrink-0 font-interface text-sm font-semibold text-petroleo" aria-live="polite">
          {respondido ? `${horas}h${minutos ? p2(minutos) : ''}` : <span className="font-medium text-textoSecundario">deslize para escolher</span>}
        </span>
      </div>

      <div role="group" aria-labelledby={id} className={`relative mt-3 flex items-center justify-center gap-2 ${respondido ? '' : 'opacity-60'}`}>
        {/* faixa que marca a linha escolhida, atrás das rodas */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-xl bg-nevoa" style={{ height: ALTURA }} aria-hidden />
        <Coluna rotulo="Horas" opcoes={HORAS} valor={horas} formatar={(h) => `${h}`} ativo={respondido} onChange={(h) => definir(h, minutos)} />
        <span className="relative z-10 font-interface text-sm font-semibold text-petroleo">h</span>
        <Coluna
          rotulo="Minutos"
          opcoes={MINUTOS}
          valor={horas === 24 ? 0 : minutos}
          formatar={p2}
          ativo={respondido}
          onChange={(m) => definir(horas, m)}
        />
        <span className="relative z-10 font-interface text-sm font-semibold text-petroleo">min</span>
      </div>

      {respondido && (
        <div className="mt-1 text-right font-interface text-xs text-textoSecundario">
          <button type="button" onClick={() => onChange('')} className="underline hover:text-petroleo">
            limpar
          </button>
        </div>
      )}
    </div>
  )
}
