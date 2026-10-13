import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrainCircuit, CalendarHeart, ChevronRight, Sprout } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { buscarCheckinDoDia, hojeLocal } from '../../lib/checkinsApi'
import { buscarReflexaoDaSemana, inicioDaSemana } from '../../lib/reflexoesApi'

function Atalho({ to, icone, titulo, texto, destaque = false }) {
  return (
    <Link
      to={to}
      className={`flex items-center justify-between gap-4 rounded-2xl p-6 transition-colors ${
        destaque ? 'bg-petroleo text-branco hover:bg-petroleoEscuro' : 'bg-branco text-texto shadow-sm hover:bg-nevoa'
      }`}
    >
      <span className="flex items-center gap-4">
        <span className="shrink-0 text-verdeAgua" aria-hidden>{icone}</span>
        <span>
          <span className={`block font-titulo text-xl ${destaque ? '' : 'text-petroleo'}`}>{titulo}</span>
          <span className={`text-sm ${destaque ? 'opacity-90' : 'text-textoSecundario'}`}>{texto}</span>
        </span>
      </span>
      <ChevronRight aria-hidden className="shrink-0" />
    </Link>
  )
}

export default function Inicio() {
  const { usuario, perfil } = useAuth()
  const [checkinHoje, setCheckinHoje] = useState(null)
  const [reflexaoSemana, setReflexaoSemana] = useState(null)

  useEffect(() => {
    buscarCheckinDoDia(usuario.id, hojeLocal()).then(setCheckinHoje).catch(() => {})
    buscarReflexaoDaSemana(usuario.id, inicioDaSemana()).then(setReflexaoSemana).catch(() => {})
  }, [usuario.id])

  const primeiroNome = perfil?.nome?.split(' ')[0]

  return (
    <section className="mx-auto max-w-xl space-y-4">
      <h1 className="mb-6 text-3xl">Olá{primeiroNome ? `, ${primeiroNome}` : ''}.</h1>

      <Atalho
        to="/app/checkin"
        icone={<CalendarHeart size={32} />}
        titulo="Check-in de hoje"
        texto={checkinHoje ? 'Feito. Toque para revisar.' : 'Como foi o seu dia? Leva menos de um minuto.'}
        destaque={!checkinHoje}
      />
      <Atalho
        to="/app/semana"
        icone={<Sprout size={32} />}
        titulo="Reflexão da semana"
        texto={reflexaoSemana ? 'Feita. Toque para revisar.' : 'Como você percebe seus avanços nesta semana?'}
      />
      {perfil?.registroPensamentosAtivo && (
        <Atalho
          to="/app/pensamentos"
          icone={<BrainCircuit size={32} />}
          titulo="Registro de pensamentos"
          texto="Anote uma situação, o que pensou e o que sentiu."
        />
      )}
    </section>
  )
}
