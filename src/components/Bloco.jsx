// Cartão branco das telas do paciente. `titulo` é um rótulo curto que nomeia o grupo de perguntas.
export default function Bloco({ titulo, icone, className = '', children }) {
  return (
    <section className={`rounded-3xl bg-branco p-5 shadow-cartao sm:p-7 ${className}`}>
      {titulo && (
        <h2 className="mb-5 flex items-center gap-2 font-interface text-[11px] font-semibold uppercase tracking-[0.14em] text-petroleo">
          {icone && <span className="text-salvia" aria-hidden>{icone}</span>}
          {titulo}
        </h2>
      )}
      <div className="space-y-8">{children}</div>
    </section>
  )
}
