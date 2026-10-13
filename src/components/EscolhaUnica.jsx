// Grupo de botões de escolha única (radio acessível), usado nas perguntas do check-in.
export default function EscolhaUnica({ nome, legenda, opcoes, valor, onChange, colunas = 5 }) {
  return (
    <fieldset>
      <legend className="mb-3 font-titulo text-lg leading-snug text-petroleo">{legenda}</legend>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` }}>
        {opcoes.map((o) => {
          const selecionado = valor === o.valor
          return (
            <label
              key={o.valor}
              className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border px-1.5 py-3 text-center font-interface text-[11px] font-medium leading-tight transition-colors sm:text-xs ${
                selecionado
                  ? 'border-petroleo bg-petroleo text-branco shadow-cartao'
                  : 'border-transparent bg-papel text-texto hover:border-salvia'
              }`}
            >
              <input
                type="radio"
                name={nome}
                value={o.valor}
                checked={selecionado}
                onChange={() => onChange(o.valor)}
                className="sr-only"
              />
              {o.emoji && <span className="text-2xl" aria-hidden>{o.emoji}</span>}
              <span>{o.rotulo}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
