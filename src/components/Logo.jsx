// Logo recortado em círculo, com fundo transparente — funciona sobre o petróleo e sobre o claro.
export default function Logo({ tamanho = 48, className = '' }) {
  return (
    <img
      src="/logo-circulo.png"
      alt="Bruna Sartori Caetano — Psicóloga, CRP 06/106.364"
      width={tamanho}
      height={tamanho}
      className={`rounded-full ring-1 ring-branco/25 ${className}`}
      style={{ width: tamanho, height: tamanho }}
    />
  )
}
