import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { listarPacientes } from '../../../lib/perfisApi'

// Painel da Bruna — primeira versão: lista de pacientes.
// A síntese de 7 dias por paciente vem na próxima etapa.
export default function Pacientes() {
  const [pacientes, setPacientes] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    listarPacientes().then(setPacientes).catch(() => setErro('Não foi possível carregar os pacientes.'))
  }, [])

  return (
    <section className="space-y-6">
      <h1 className="flex items-center gap-3 text-3xl">
        <Users className="text-verdeAgua" aria-hidden /> Pacientes
      </h1>
      {erro && <p className="text-alerta">{erro}</p>}
      {pacientes?.length === 0 && (
        <p className="rounded-2xl bg-branco p-6 text-textoSecundario">Nenhum paciente convidado ainda.</p>
      )}
      <ul className="grid gap-3 sm:grid-cols-2">
        {pacientes?.map((p) => (
          <li key={p.id} className="rounded-2xl bg-branco p-5 shadow-sm">
            <p className="font-titulo text-lg text-petroleo">{p.nome || 'Sem nome'}</p>
            <p className="text-sm text-textoSecundario">
              Desde {new Date(p.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
