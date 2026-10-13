import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Botao from './Botao'

// Lista recolhida por padrão: registros passados só aparecem se o paciente pedir.
export default function RegistrosAnteriores({ itens, renderItem, chave = (i) => i.id }) {
  const [aberto, setAberto] = useState(false)
  if (!itens?.length) return null

  return (
    <div className="space-y-3">
      <Botao variante="secundario" className="w-full" onClick={() => setAberto((v) => !v)} aria-expanded={aberto}>
        {aberto ? 'Ocultar registros anteriores' : `Ver registros anteriores (${itens.length})`}
        <ChevronDown size={16} aria-hidden className={`transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </Botao>
      {aberto && (
        <ul className="space-y-3">
          {itens.map((item) => (
            <li key={chave(item)} className="space-y-2 rounded-2xl bg-branco p-5 text-sm shadow-sm">
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Linha "Rótulo: valor" usada dentro dos cartões de registros anteriores.
export function Linha({ rotulo, children }) {
  return (
    <p>
      <strong className="font-interface text-petroleo">{rotulo}: </strong>
      {children}
    </p>
  )
}
