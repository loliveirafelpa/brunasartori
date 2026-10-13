import { LifeBuoy } from 'lucide-react'
import { CONTATOS_CRISE } from '../data/textosLegais'

// O app não é canal de emergência — este aviso aparece em toda a área logada.
export default function AvisoCrise({ destaque = false }) {
  return (
    <aside
      className={`rounded-xl border p-4 text-sm ${
        destaque ? 'border-alerta bg-alertaFundo' : 'border-borda bg-branco'
      }`}
    >
      <p className="flex items-center gap-2 font-interface font-semibold text-alerta">
        <LifeBuoy size={18} aria-hidden /> Precisa de ajuda agora?
      </p>
      <p className="mt-1 text-textoSecundario">
        Este aplicativo não é acompanhado em tempo real. Em uma situação de crise, procure ajuda imediata:
      </p>
      <ul className="mt-2 space-y-1">
        {CONTATOS_CRISE.map((c) => (
          <li key={c.contato}>
            <a href={`tel:${c.contato}`} className="font-interface font-bold text-petroleo underline">
              {c.contato}
            </a>{' '}
            — {c.nome} <span className="text-textoSecundario">({c.detalhe})</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
