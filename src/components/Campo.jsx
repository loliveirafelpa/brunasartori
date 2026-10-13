export default function Campo({ rotulo, id, ajuda, multilinha = false, ...props }) {
  const classes =
    'mt-1.5 w-full rounded-xl border border-borda/70 bg-papel px-4 py-3 text-texto placeholder:text-textoSecundario/80 focus:border-petroleo focus:bg-branco'
  return (
    <div>
      <label htmlFor={id} className="font-interface text-sm font-semibold text-texto">
        {rotulo}
      </label>
      {multilinha ? <textarea id={id} rows={4} className={classes} {...props} /> : <input id={id} className={classes} {...props} />}
      {ajuda && <p className="mt-1 text-xs text-textoSecundario">{ajuda}</p>}
    </div>
  )
}
