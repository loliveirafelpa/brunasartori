import { Check, Flame } from 'lucide-react'
import { formatarDia } from '../lib/sintese'

// Recado curto ao lado do número — sempre acolhedor: quebrar a sequência não é falha.
function recado({ atual, recorde, feitoHoje, total }) {
  if (total === 0) return 'Faça seu primeiro check-in e comece sua sequência.'
  if (atual === 0) return 'Recomeçar também é cuidado. Que tal registrar hoje?'
  if (!feitoHoje) return 'Faça o check-in de hoje para manter sua sequência.'
  if (atual === 1) return 'Primeiro dia registrado. Até amanhã!'
  if (atual % 7 === 0) return `${atual / 7 === 1 ? 'Uma semana inteira' : `${atual / 7} semanas`} de check-ins. Parabéns!`
  if (atual === recorde && atual > 2) return 'Sua maior sequência até agora. Que bonito de ver!'
  return 'Check-in de hoje feito. Até amanhã!'
}

// Cartão da "ofensiva": dias seguidos de check-in e os últimos 7 dias.
export default function Sequencia({ sequencia }) {
  const { atual, recorde, feitoHoje, semana } = sequencia
  const acesa = atual > 0

  return (
    <section className="rounded-3xl bg-branco p-5 shadow-cartao" aria-label="Sequência de check-ins">
      <div className="flex items-center gap-4">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
            acesa ? 'bg-petroleo text-verdeAgua' : 'bg-nevoa text-textoSecundario'
          }`}
          aria-hidden
        >
          <Flame size={28} fill={feitoHoje ? 'currentColor' : 'none'} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-titulo text-2xl leading-tight text-petroleo">
            {atual} {atual === 1 ? 'dia' : 'dias'} <span className="italic">seguidos</span>
          </p>
          <p className="mt-0.5 text-sm text-textoSecundario">{recado(sequencia)}</p>
        </div>
      </div>

      <ol className="mt-5 grid grid-cols-7 gap-1.5">
        {semana.map((d) => (
          <li key={d.data} className="flex flex-col items-center gap-1.5">
            <span className="font-interface text-[11px] font-semibold uppercase text-textoSecundario">
              {formatarDia(d.data, { weekday: 'narrow' })}
            </span>
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                d.feito ? 'bg-salvia text-branco' : 'bg-papel'
              } ${d.ehHoje ? 'ring-2 ring-petroleo ring-offset-2 ring-offset-branco' : ''}`}
            >
              {d.feito && <Check size={16} strokeWidth={3} aria-hidden />}
              <span className="sr-only">
                {formatarDia(d.data, { weekday: 'long', day: 'numeric' })}: {d.feito ? 'check-in feito' : 'sem check-in'}
              </span>
            </span>
          </li>
        ))}
      </ol>

      {recorde > 1 && (
        <p className="mt-4 border-t border-borda/60 pt-3 font-interface text-xs text-textoSecundario">
          Sua maior sequência: <strong className="text-petroleo">{recorde} dias</strong>
        </p>
      )}
    </section>
  )
}
