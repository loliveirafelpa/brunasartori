import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarHeart, ChevronRight } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { buscarCheckinDoDia, hojeLocal } from '../../lib/checkinsApi'

export default function Inicio() {
  const { usuario, perfil } = useAuth()
  const [checkinHoje, setCheckinHoje] = useState(undefined)

  useEffect(() => {
    buscarCheckinDoDia(usuario.id, hojeLocal()).then(setCheckinHoje).catch(() => setCheckinHoje(null))
  }, [usuario.id])

  const primeiroNome = perfil?.nome?.split(' ')[0]

  return (
    <section className="mx-auto max-w-xl space-y-6">
      <h1 className="text-3xl">
        Olá{primeiroNome ? `, ${primeiroNome}` : ''}.
      </h1>

      <Link
        to="/app/checkin"
        className="flex items-center justify-between gap-4 rounded-2xl bg-petroleo p-6 text-branco transition-colors hover:bg-petroleoEscuro"
      >
        <span className="flex items-center gap-4">
          <CalendarHeart size={32} className="text-verdeAgua" aria-hidden />
          <span>
            <span className="block font-titulo text-xl">Check-in de hoje</span>
            <span className="text-sm opacity-90">
              {checkinHoje ? 'Feito. Toque para revisar.' : 'Como foi o seu dia? Leva menos de um minuto.'}
            </span>
          </span>
        </span>
        <ChevronRight aria-hidden />
      </Link>

      <p className="text-sm text-textoSecundario">
        Em breve aqui: reflexão semanal sobre seus objetivos e o registro de pensamentos.
      </p>
    </section>
  )
}
