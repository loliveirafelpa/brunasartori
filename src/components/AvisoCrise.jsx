import { LifeBuoy } from 'lucide-react'
import { CONTATOS_CRISE } from '../data/textosLegais'

// O app não é canal de emergência — este aviso aparece em toda a área logada.
// `compacto`: uma linha discreta no rodapé. `destaque`: versão completa, para momentos de humor baixo.
export default function AvisoCrise({ destaque = false, compacto = false }) {
  if (compacto) {
    return (
      <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-textoSecundario">
        <LifeBuoy size={14} className="text-alerta" aria-hidden />
        <span>Precisa de ajuda agora?</span>
        {CONTATOS_CRISE.map((c, i) => (
          <span key={c.contato}>
            {i > 0 && '· '}
            <a href={`tel:${c.contato}`} className="font-interface font-bold text-petroleo underline">
              {c.contato}
            </a>{' '}
            {c.nome.split(' —')[0]}
          </span>
        ))}
      </p>
    )
  }

  return (
    <aside className={`rounded-2xl border p-4 text-left text-sm ${destaque ? 'border-alerta/40 bg-alertaFundo' : 'border-borda bg-branco'}`}>
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
