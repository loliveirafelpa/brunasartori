const VARIANTES = {
  primario: 'bg-petroleo text-branco hover:bg-petroleoEscuro disabled:opacity-50',
  secundario: 'border border-petroleo text-petroleo hover:bg-nevoa disabled:opacity-50',
  discreto: 'text-petroleo hover:underline',
}

export default function Botao({ variante = 'primario', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 font-interface text-sm font-semibold transition-colors ${VARIANTES[variante]} ${className}`}
      {...props}
    />
  )
}
