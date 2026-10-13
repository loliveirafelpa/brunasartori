import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrainCircuit, CalendarHeart, Check, ChevronRight, Handshake, Sprout } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { buscarCheckinDoDia, hojeLocal } from '../../lib/checkinsApi'
import { buscarReflexaoDaSemana, inicioDaSemana } from '../../lib/reflexoesApi'
import { buscarObjetivoSemana } from '../../lib/objetivosApi'
import Pagina, { Destaque } from '../../components/Pagina'

function Atalho({ to, icone, titulo, texto, feito, principal = false }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-3xl bg-branco p-5 shadow-cartao transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
          principal && !feito ? 'bg-petroleo text-verdeAgua' : 'bg-nevoa text-petroleo'
        }`}
        aria-hidden
      >
        {icone}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-titulo text-xl leading-tight text-petroleo">{titulo}</span>
        <span className="mt-0.5 block text-sm text-textoSecundario">{texto}</span>
      </span>
      {feito ? (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-nevoa px-2.5 py-1 font-interface text-[11px] font-semibold text-petroleo">
          <Check size={13} aria-hidden /> Feito
        </span>
      ) : (
        <ChevronRight className="shrink-0 text-textoSecundario transition-transform group-hover:translate-x-0.5" aria-hidden />
      )}
    </Link>
  )
}

export default function Inicio() {
  const { usuario, perfil } = useAuth()
  const [checkinHoje, setCheckinHoje] = useState(null)
  const [reflexaoSemana, setReflexaoSemana] = useState(null)
  const [combinado, setCombinado] = useState(null)

  useEffect(() => {
    const semana = inicioDaSemana()
    buscarCheckinDoDia(usuario.id, hojeLocal()).then(setCheckinHoje).catch(() => {})
    buscarReflexaoDaSemana(usuario.id, semana).then(setReflexaoSemana).catch(() => {})
    buscarObjetivoSemana(usuario.id, semana).then(setCombinado).catch(() => {})
  }, [usuario.id])

  const primeiroNome = perfil?.nome?.split(' ')[0]
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <Pagina
      sobretitulo={hoje}
      titulo={
        primeiroNome ? (
          <>
            Que bom te ver, <Destaque>{primeiroNome}</Destaque>.
          </>
        ) : (
          <>
            Que bom te <Destaque>ver</Destaque>.
          </>
        )
      }
      descricao="Este é o seu espaço entre as sessões. Registre o que fizer sentido, no seu tempo."
    >
      <Atalho
        to="/app/checkin"
        icone={<CalendarHeart size={24} />}
        titulo="Check-in de hoje"
        texto={checkinHoje ? 'Toque para revisar o que você registrou.' : 'Como foi o seu dia? Leva menos de um minuto.'}
        feito={!!checkinHoje}
        principal
      />

      {combinado && (
        <Link to="/app/semana" className="block rounded-3xl border-l-4 border-verdeAgua bg-branco p-5 shadow-cartao">
          <p className="flex items-center gap-2 font-interface text-[11px] font-semibold uppercase tracking-[0.14em] text-petroleo">
            <Handshake size={14} className="text-salvia" aria-hidden /> Combinado desta semana
          </p>
          <p className="mt-2 font-titulo text-lg italic leading-snug text-petroleo">“{combinado.texto}”</p>
        </Link>
      )}

      <Atalho
        to="/app/semana"
        icone={<Sprout size={24} />}
        titulo="Reflexão da semana"
        texto={reflexaoSemana ? 'Toque para revisar sua reflexão.' : 'Como você percebe seus avanços nesta semana?'}
        feito={!!reflexaoSemana}
      />
      {perfil?.registroPensamentosAtivo && (
        <Atalho
          to="/app/pensamentos"
          icone={<BrainCircuit size={24} />}
          titulo="Registro de pensamentos"
          texto="Algo mexeu com você? Anote a situação, o pensamento e o que sentiu."
        />
      )}
    </Pagina>
  )
}
