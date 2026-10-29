// Gráficos do painel da psicóloga, desenhados em SVG (sem biblioteca externa).
// Regras: um eixo por gráfico, marcas finas, grade recessiva, cor só nas marcas (textos sempre em
// cor de texto), dica ao passar o mouse e rótulos seletivos. Cores vêm de theme.js (validadas).
import { useEffect, useRef, useState } from 'react'
import { cores } from '../theme'
import { formatarDia } from '../lib/sintese'

const dec = (v, casas = 1) => (Number.isInteger(v) ? String(v) : v.toFixed(casas).replace('.', ','))
// Topo "redondo" para eixos sem máximo fixo (par, para a marca do meio cair num inteiro): 11 → 12, 23 → 30.
const tetoRedondo = (v) => {
  const passo = v <= 10 ? 2 : v <= 20 ? 4 : v <= 60 ? 10 : 20
  return Math.ceil(v / passo) * passo
}
const diaMes = (iso) => formatarDia(iso, { day: '2-digit', month: '2-digit' })

// Largura disponível do contêiner, para o SVG ocupar o espaço sem distorcer o texto.
function useLargura() {
  const ref = useRef(null)
  const [largura, setLargura] = useState(0)
  useEffect(() => {
    if (!ref.current) return
    const obs = new ResizeObserver(([e]) => setLargura(Math.floor(e.contentRect.width)))
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, largura]
}

// Coluna com a ponta arredondada (4px) e a base reta.
function colunaPath(x, y, l, h) {
  const r = Math.min(4, l / 2, h)
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + l - r}Q${x + l},${y} ${x + l},${y + r}V${y + h}Z`
}

function Dica({ x, largura, children }) {
  const esquerda = x > largura - 150
  return (
    <div
      className="pointer-events-none absolute top-1 z-10 whitespace-nowrap rounded-lg border border-borda bg-branco px-2.5 py-1.5 font-interface text-xs text-texto shadow-cartao"
      style={esquerda ? { right: largura - x + 10 } : { left: x + 10 }}
    >
      {children}
    </div>
  )
}

/**
 * Série diária: `linha` (o valor real de cada dia, ligado pela linha, e a média do período tracejada) ou `colunas`.
 * Dias sem registro ficam sem ponto; a linha liga um registro ao seguinte.
 * `valores`: { 'AAAA-MM-DD': número | null }. `referencia`: { valor, rotulo } — linha de referência.
 */
export function GraficoDiario({ dias, valores, tipo = 'linha', min = 0, max, unidade = '', referencia, altura = 150, rotuloValor = 'Valor' }) {
  const [ref, largura] = useLargura()
  const [foco, setFoco] = useState(null)
  const presentes = dias.map((d) => valores[d]).filter((v) => v !== null && v !== undefined)
  const topo = max ?? tetoRedondo(Math.max(1, ...presentes, referencia?.valor ?? 0))
  const linha = tipo === 'linha'
  const media = linha && presentes.length ? presentes.reduce((a, b) => a + b, 0) / presentes.length : null
  const m = { esq: 30, dir: referencia || media !== null ? 64 : 14, cima: 10, baixo: 22 }
  const w = Math.max(0, largura - m.esq - m.dir)
  const h = altura - m.cima - m.baixo
  const banda = dias.length ? w / dias.length : 0
  const cx = (i) => m.esq + banda * i + banda / 2
  const y = (v) => m.cima + h - ((v - min) / (topo - min || 1)) * h
  const ticks = [min, Math.round(min + (topo - min) / 2), topo]

  const comValor = dias.map((d, i) => [d, i]).filter(([d]) => valores[d] !== null && valores[d] !== undefined)
  const caminho = linha && comValor.length > 1 ? `M${comValor.map(([d, i]) => `${cx(i)},${y(valores[d])}`).join('L')}` : ''
  const fmt = (v) => `${dec(v)}${unidade}`
  const fmtMedia = (v) => `${v.toFixed(1).replace('.', ',')}${unidade}`

  return (
    <div ref={ref} className="relative" onMouseLeave={() => setFoco(null)}>
      {largura > 0 && (
        <svg width={largura} height={altura} role="img" aria-label={`${rotuloValor} por dia`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={m.esq} x2={m.esq + w} y1={y(t)} y2={y(t)} stroke={cores.grade} strokeWidth="1" />
              <text x={m.esq - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill={cores.textoSecundario}>
                {dec(t)}
              </text>
            </g>
          ))}
          {referencia && (
            <g>
              <line x1={m.esq} x2={m.esq + w} y1={y(referencia.valor)} y2={y(referencia.valor)} stroke={cores.textoSecundario} strokeWidth="1" />
              <text x={m.esq + w + 6} y={y(referencia.valor) + 4} fontSize="11" fill={cores.textoSecundario}>
                {referencia.rotulo}
              </text>
            </g>
          )}
          {media !== null && !referencia && (
            <g>
              <line x1={m.esq} x2={m.esq + w} y1={y(media)} y2={y(media)} stroke={cores.textoSecundario} strokeWidth="1" strokeDasharray="4 3" />
              <text x={m.esq + w + 6} y={y(media) + 4} fontSize="11" fill={cores.textoSecundario}>
                média {fmtMedia(media)}
              </text>
            </g>
          )}
          {foco !== null && <line x1={cx(foco)} x2={cx(foco)} y1={m.cima} y2={m.cima + h} stroke={cores.borda} strokeWidth="1" />}
          {caminho && <path d={caminho} fill="none" stroke={cores.serie1} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
          {tipo === 'colunas'
            ? dias.map((d, i) => {
                const v = valores[d]
                if (!v) return null
                const l = Math.min(24, Math.max(2, banda - 2))
                return <path key={d} d={colunaPath(cx(i) - l / 2, y(v), l, y(min) - y(v))} fill={cores.serie1} opacity={foco === null || foco === i ? 1 : 0.55} />
              })
            : comValor.map(([d, i]) => (
                <circle key={d} cx={cx(i)} cy={y(valores[d])} r={foco === i ? 4.5 : 3} fill={cores.serie1} stroke={cores.branco} strokeWidth="1.5" />
              ))}
          {[0, Math.floor((dias.length - 1) / 2), dias.length - 1].map((i, k) => (
            <text key={k} x={cx(i)} y={altura - 6} textAnchor={k === 0 ? 'start' : k === 2 ? 'end' : 'middle'} fontSize="11" fill={cores.textoSecundario}>
              {dias[i] && diaMes(dias[i])}
            </text>
          ))}
          {/* Áreas de foco do mouse: a coluna inteira de cada dia, maior que a marca. */}
          {dias.map((d, i) => (
            <rect key={d} x={m.esq + banda * i} y={m.cima} width={banda} height={h} fill="transparent" onMouseEnter={() => setFoco(i)} />
          ))}
        </svg>
      )}
      {foco !== null && (
        <Dica x={cx(foco)} largura={largura}>
          <p className="font-semibold capitalize">{formatarDia(dias[foco])}</p>
          <p>
            {rotuloValor}: {valores[dias[foco]] === null || valores[dias[foco]] === undefined ? 'sem registro' : fmt(valores[dias[foco]])}
          </p>
          {media !== null && <p className="text-textoSecundario">Média do período: {fmtMedia(media)}</p>}
        </Dica>
      )}
    </div>
  )
}

/**
 * Barras horizontais com valor na ponta. `itens`: [{ rotulo, valor, detalhe }].
 * `referencia`: { valor, rotulo } — marca vertical (ex.: média geral do período).
 */
export function BarrasHorizontais({ itens, max, formatar = dec, referencia, cor = cores.serie1 }) {
  const [foco, setFoco] = useState(null)
  const topo = max ?? Math.max(1, ...itens.map((i) => i.valor), referencia?.valor ?? 0)
  const pct = (v) => `${(v / topo) * 100}%`
  const colunas = 'grid grid-cols-[minmax(6rem,9rem),1fr,3.5rem] items-center gap-3'
  return (
    <div className="space-y-2">
      {itens.map((item, i) => (
        <div
          key={item.rotulo}
          className={`${colunas} text-sm`}
          onMouseEnter={() => setFoco(i)}
          onMouseLeave={() => setFoco(null)}
        >
          <span className="truncate text-texto" title={item.rotulo}>{item.rotulo}</span>
          <div className="relative flex h-6 items-center">
            <span
              className="h-4 rounded-r transition-opacity"
              style={{ width: pct(item.valor), minWidth: 3, backgroundColor: cor, opacity: foco === null || foco === i ? 1 : 0.55 }}
            />
            {referencia && <span className="absolute inset-y-0 w-px bg-textoSecundario" style={{ left: pct(referencia.valor) }} aria-hidden />}
            {foco === i && item.detalhe && (
              <div className="pointer-events-none absolute left-0 top-7 z-10 whitespace-nowrap rounded-lg border border-borda bg-branco px-2.5 py-1.5 font-interface text-xs shadow-cartao">
                {item.detalhe}
              </div>
            )}
          </div>
          <span className="font-interface text-xs font-semibold text-texto">{formatar(item.valor)}</span>
        </div>
      ))}
      {referencia && (
        <div className={`${colunas} text-xs text-textoSecundario`}>
          <span />
          <p className="flex items-center gap-2">
            <span className="inline-block h-3 w-px bg-textoSecundario" aria-hidden /> {referencia.rotulo}
          </p>
        </div>
      )}
    </div>
  )
}

/** Duas barras lado a lado para comparar grupos de dias (ex.: com e sem movimento). Legenda sempre visível. */
export function ComparacaoGrupos({ grupos, max, formatar = dec }) {
  const corDe = [cores.serie1, cores.serie2]
  const topo = max ?? Math.max(1, ...grupos.map((g) => g.valor ?? 0))
  return (
    <div className="space-y-2.5">
      {grupos.map((g, i) => (
        <div key={g.rotulo} className="text-sm">
          <p className="flex items-center gap-2 text-texto">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: corDe[i] }} aria-hidden />
            {g.rotulo} <span className="text-xs text-textoSecundario">({g.n} {g.n === 1 ? 'dia' : 'dias'})</span>
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="h-4 rounded-r" style={{ width: `calc(${((g.valor ?? 0) / topo) * 100}% - 3rem)`, minWidth: 3, backgroundColor: corDe[i] }} />
            <span className="font-interface text-xs font-semibold text-texto">{g.valor === null ? '—' : formatar(g.valor)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
