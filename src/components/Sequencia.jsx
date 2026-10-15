import { Flame } from 'lucide-react'
import { formatarDia } from '../lib/sintese'

// Recado curto abaixo do número — sempre acolhedor: quebrar a sequência não é falha.
function recado({ atual, recorde, feitoHoje, total }) {
  if (total === 0) return 'Faça seu primeiro check-in e comece sua sequência.'
  if (atual === 0) return 'Recomeçar também é cuidado. Que tal registrar hoje?'
  if (!feitoHoje) return 'Registre hoje para manter sua sequência.'
  if (atual % 7 === 0) return `${atual / 7 === 1 ? 'Uma semana inteira' : `${atual / 7} semanas`} de check-ins. Parabéns!`
  if (atual === recorde && atual > 2) return 'Sua maior sequência até agora.'
  return `Até amanhã!${recorde > atual ? ` · Recorde: ${recorde} dias` : ''}`
}

// Faixa discreta da "ofensiva": dias seguidos de check-in e os últimos 7 dias em bolinhas.
export default function Sequencia({ sequencia }) {
  const { atual, feitoHoje, semana } = sequencia

  return (
    <section className="flex items-center gap-3 rounded-2xl bg-branco px-4 py-3 shadow-cartao" aria-label="Sequência de check-ins">
      <Flame
        size={20}
        className={`shrink-0 ${atual > 0 ? 'text-salvia' : 'text-borda'}`}
        fill={feitoHoje ? 'currentColor' : 'none'}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="font-interface text-sm font-semibold text-petroleo">
          {atual} {atual === 1 ? 'dia seguido' : 'dias seguidos'}
        </p>
        <p className="text-xs leading-snug text-textoSecundario">{recado(sequencia)}</p>
      </div>
      <ol className="flex shrink-0 items-center gap-1">
        {semana.map((d) => (
          <li
            key={d.data}
            className={`rounded-full ${d.ehHoje ? 'h-2.5 w-2.5' : 'h-2 w-2'} ${d.feito ? 'bg-salvia' : 'bg-nevoa'}`}
          >
            <span className="sr-only">
              {formatarDia(d.data, { weekday: 'long', day: 'numeric' })}: {d.feito ? 'check-in feito' : 'sem check-in'}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
