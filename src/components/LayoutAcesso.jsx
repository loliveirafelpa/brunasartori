import Logo from './Logo'

// Telas de acesso (entrar, criar senha). Celular: faixa petróleo no topo e o formulário subindo
// sobre ela. Computador: painel petróleo à esquerda com a frase, formulário à direita.
export default function LayoutAcesso({ titulo, children }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,5fr),minmax(0,4fr)]">
      <div className="bg-petroleo px-6 pb-20 pt-10 text-branco lg:flex lg:flex-col lg:justify-between lg:p-14">
        <Logo tamanho={64} />
        <div className="mt-8 lg:mt-0">
          <p className="font-interface text-[11px] font-semibold uppercase tracking-[0.14em] text-nevoa">Bruna Sartori · Psicologia</p>
          <h1 className="mt-3 max-w-md font-titulo text-[2.1rem] leading-tight text-branco lg:text-5xl">{titulo}</h1>
        </div>
        <p className="mt-6 hidden max-w-sm font-titulo text-lg italic text-nevoa lg:block">
          “Acolher a própria história é o primeiro passo para a transformação.”
        </p>
      </div>
      <div className="-mt-10 flex justify-center px-4 pb-10 lg:mt-0 lg:items-center lg:bg-papel">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
