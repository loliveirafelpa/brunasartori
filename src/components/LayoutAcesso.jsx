// Telas de acesso (entrar, criar senha). Abre com a marca da Bruna — o cérebro do logo e o nome
// escrito como texto (nítido em qualquer tela). Celular: faixa petróleo no topo e o formulário
// subindo sobre ela. Computador: painel petróleo à esquerda, formulário à direita.

function Marca() {
  return (
    <div>
      <div className="flex items-center gap-4 lg:gap-6">
        <img src="/marca-cerebro.png" alt="" className="h-[4.5rem] w-auto shrink-0 lg:h-32" />
        <p className="font-marca text-[1.7rem] font-normal leading-[1.08] text-branco lg:text-[2.9rem]">
          Bruna
          <br />
          Sartori
          <br />
          Caetano
        </p>
      </div>
      <p className="mt-3 font-marca text-sm font-medium tracking-wide text-verdeAgua lg:mt-5 lg:text-base">CRP 06/106.364</p>
    </div>
  )
}

export default function LayoutAcesso({ titulo, children }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,5fr),minmax(0,4fr)]">
      <div className="bg-petroleo px-6 pb-20 pt-10 text-branco lg:flex lg:flex-col lg:justify-between lg:p-14">
        <Marca />
        <div className="mt-9 lg:mt-0">
          <p className="font-interface text-[11px] font-semibold uppercase tracking-[0.14em] text-nevoa">
            Psicologia clínica · Neuropsicologia
          </p>
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
