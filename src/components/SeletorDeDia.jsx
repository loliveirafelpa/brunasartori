import { useState } from 'react'
import { formatarDia } from '../lib/sintese'

// Registros anteriores por dia: o paciente escolhe uma data e só então vê o conteúdo.
export default function SeletorDeDia({ itens, renderItem, rotulo = 'Registros anteriores' }) {
  const [diaEscolhido, setDiaEscolhido] = useState('')
  if (!itens?.length) return null

  const item = itens.find((i) => i.data === diaEscolhido)

  return (
    <div className="space-y-3">
      <label htmlFor="dia-anterior" className="font-titulo text-lg text-petroleo">{rotulo}</label>
      <select
        id="dia-anterior"
        value={diaEscolhido}
        onChange={(e) => setDiaEscolhido(e.target.value)}
        className="w-full rounded-xl border border-borda bg-branco px-4 py-2.5 font-interface text-sm text-texto focus:border-petroleo"
      >
        <option value="">Escolha um dia ({itens.length} {itens.length === 1 ? 'registro' : 'registros'})</option>
        {itens.map((i) => (
          <option key={i.data} value={i.data}>
            {formatarDia(i.data, { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </option>
        ))}
      </select>
      {item && <div className="space-y-2 rounded-2xl bg-branco p-5 text-sm shadow-sm">{renderItem(item)}</div>}
    </div>
  )
}
