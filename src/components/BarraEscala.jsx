// Barra de 0 a 10. Com `valor` nulo, a pergunta aparece como "não respondida"
// até o paciente tocar na barra — assim uma resposta opcional não vira 0 sem querer.
export default function BarraEscala({ id, rotulo, ajuda, valor, onChange, minimo = 'Nada', maximo = 'Muito', opcional = false }) {
  const respondido = valor !== null && valor !== undefined
  const definir = (e) => onChange(Number(e.target.value))

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-titulo text-lg text-petroleo">{rotulo}</label>
        <span className="shrink-0 font-interface text-sm font-semibold text-petroleo" aria-live="polite">
          {respondido ? `${valor}/10` : <span className="font-medium text-textoSecundario">toque na barra</span>}
        </span>
      </div>
      {ajuda && <p className="mt-1 text-sm text-textoSecundario">{ajuda}</p>}
      <input
        id={id}
        type="range"
        min="0"
        max="10"
        step="1"
        value={respondido ? valor : 0}
        onChange={definir}
        onPointerUp={definir}
        className={`mt-3 w-full accent-petroleo ${respondido ? '' : 'opacity-40'}`}
      />
      <div className="flex justify-between font-interface text-xs text-textoSecundario">
        <span>0 · {minimo}</span>
        {opcional && respondido && (
          <button type="button" onClick={() => onChange(null)} className="underline hover:text-petroleo">
            limpar
          </button>
        )}
        <span>10 · {maximo}</span>
      </div>
    </div>
  )
}
