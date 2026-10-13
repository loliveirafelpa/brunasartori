export default function Logo({ tamanho = 48 }) {
  return (
    <img
      src="/logo.png"
      alt="Bruna Sartori Caetano — Psicóloga, CRP 06/106.364"
      width={tamanho}
      height={tamanho}
      className="rounded-full object-cover"
      style={{ width: tamanho, height: tamanho }}
    />
  )
}
