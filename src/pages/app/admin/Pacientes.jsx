import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Users } from 'lucide-react'
import { listarPacientes } from '../../../lib/perfisApi'
import { listarCheckinsDeTodos } from '../../../lib/checkinsApi'
import { diasDoPeriodo, formatarDia } from '../../../lib/sintese'

// Painel da Bruna: lista de pacientes com um resumo rápido dos últimos 7 dias.
export default function Pacientes() {
  const [pacientes, setPacientes] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    const dias = diasDoPeriodo(7)
    Promise.all([listarPacientes(), listarCheckinsDeTodos(dias[0])])
      .then(([ps, cs]) => {
        setPacientes(ps)
        setCheckins(cs)
      })
      .catch(() => setErro('Não foi possível carregar os pacientes.'))
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
        {pacientes?.map((p) => {
          const meus = checkins.filter((c) => c.userId === p.id)
          const ultimo = meus[0]
          return (
            <li key={p.id}>
              <Link
                to={`/app/admin/pacientes/${p.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-branco p-5 shadow-sm transition-colors hover:bg-nevoa"
              >
                <span>
                  <span className="block font-titulo text-lg text-petroleo">{p.nome || 'Sem nome'}</span>
                  <span className="block text-sm text-textoSecundario">
                    {meus.length} de 7 dias com check-in
                    {ultimo && ` · último: ${formatarDia(ultimo.data, { day: '2-digit', month: '2-digit' })}`}
                  </span>
                </span>
                <ChevronRight className="shrink-0 text-textoSecundario" aria-hidden />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
