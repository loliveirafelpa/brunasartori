// Moldura das telas do paciente: uma faixa petróleo com o título (como os posts escuros
// do Instagram da Bruna) e o conteúdo em cartões claros que sobem levemente sobre a faixa.

// Palavra de destaque do título: itálico verde-água, como nos posts.
export function Destaque({ children }) {
  return <em className="font-normal text-verdeAgua">{children}</em>
}

export default function Pagina({ sobretitulo, titulo, descricao, aviso, children }) {
  return (
    <>
      <div className="bg-petroleo text-branco">
        <div className="mx-auto max-w-xl px-4 pb-16 pt-8 sm:pt-12">
          {sobretitulo && (
            <p className="font-interface text-xs font-semibold uppercase tracking-[0.14em] text-nevoa first-letter:uppercase">
              {sobretitulo}
            </p>
          )}
          <h1 className="mt-2 font-titulo text-[2rem] leading-tight text-branco sm:text-[2.5rem]">{titulo}</h1>
          {descricao && <p className="mt-3 max-w-md leading-relaxed text-nevoa">{descricao}</p>}
          {aviso && <div className="mt-5">{aviso}</div>}
        </div>
      </div>
      <div className="mx-auto -mt-9 max-w-xl space-y-5 px-4 pb-10">{children}</div>
    </>
  )
}
