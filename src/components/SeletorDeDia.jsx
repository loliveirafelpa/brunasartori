import { useState } from 'react'
import { formatarDia } from '../lib/sintese'

const formatoPadrao = (iso) => formatarDia(iso, { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })

// Registros anteriores numa lista de escolha: o paciente escolhe um dia, semana ou registro
// e só então vê o conteúdo. `formatarOpcao` recebe o valor do campo e o item inteiro.
export default function SeletorDeDia({ itens, renderItem, rotulo = 'Registros anteriores', campoData = 'data', formatarOpcao = formatoPadrao, convite = 'Escolha um dia' }) {
  const [diaEscolhido, setDiaEscolhido] = useState('')
  if (!itens?.length) return null

  const item = itens.find((i) => i[campoData] === diaEscolhido)

  return (
    <div className="space-y-3">
      <label htmlFor="dia-anterior" className="sr-only">{rotulo}</label>
      <select
        id="dia-anterior"
        value={diaEscolhido}
        onChange={(e) => setDiaEscolhido(e.target.value)}
        className="w-full rounded-xl border border-borda/70 bg-papel px-4 py-3 font-interface text-sm text-texto focus:border-petroleo focus:bg-branco"
      >
        <option value="">{convite} ({itens.length} {itens.length === 1 ? 'registro' : 'registros'})</option>
        {itens.map((i) => (
          <option key={i[campoData]} value={i[campoData]}>
            {formatarOpcao(i[campoData], i)}
          </option>
        ))}
      </select>
      {item && <div className="space-y-2 rounded-2xl border border-borda/60 p-5 text-sm">{renderItem(item)}</div>}
    </div>
  )
}
