// Ação pequena dentro de um cartão (Editar, Adicionar, Anotar, Novo…): pílula com ícone e texto,
// sempre da mesma altura e alinhamento. `escuro` = sobre fundo petróleo.
export default function BotaoAcao({ icone: Icone, escuro = false, className = '', children, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 font-interface text-xs font-semibold leading-none transition-colors disabled:opacity-50 ${
        escuro ? 'text-nevoa hover:bg-branco/10 hover:text-branco' : 'text-petroleo hover:bg-nevoa'
      } ${className}`}
      {...props}
    >
      {Icone && <Icone size={14} aria-hidden className="shrink-0" />}
      {children}
    </button>
  )
}
