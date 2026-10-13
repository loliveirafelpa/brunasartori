// Grupo de "chips" de múltipla escolha (checkbox acessível).
export default function EscolhaMultipla({ legenda, ajuda, opcoes, valores, onChange }) {
  function alternar(valor) {
    onChange(valores.includes(valor) ? valores.filter((v) => v !== valor) : [...valores, valor])
  }

  return (
    <fieldset>
      <legend className="font-titulo text-lg text-petroleo">{legenda}</legend>
      {ajuda && <p className="mb-3 mt-1 text-sm text-textoSecundario">{ajuda}</p>}
      <div className="flex flex-wrap gap-2">
        {opcoes.map((o) => {
          const marcado = valores.includes(o.valor)
          return (
            <label
              key={o.valor}
              className={`cursor-pointer rounded-full border px-4 py-2 font-interface text-xs font-medium transition-colors ${
                marcado ? 'border-salvia bg-salvia text-branco' : 'border-borda bg-branco text-texto hover:border-salvia'
              }`}
            >
              <input type="checkbox" checked={marcado} onChange={() => alternar(o.valor)} className="sr-only" />
              {o.rotulo}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
