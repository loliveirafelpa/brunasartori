import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrainCircuit, CalendarHeart, Check, ChevronRight, ClipboardCheck, Sprout, Wind } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { buscarCheckinDoDia, hojeLocal, listarDatasDeCheckin } from '../../lib/checkinsApi'
import { calcularSequencia } from '../../lib/sequencia'
import { buscarReflexaoDaSemana, inicioDaSemana } from '../../lib/reflexoesApi'
import { buscarObjetivoSemana } from '../../lib/objetivosApi'
import { adiarQuestionarios, listarAdiadosHoje, listarQuestionarios } from '../../lib/protocolosApi'
import { escalasLigadas } from '../../data/modulos'
import { ESCALAS, escalaPendente } from '../../data/escalas'
import Pagina, { Destaque } from '../../components/Pagina'
import Sequencia from '../../components/Sequencia'
import AvisoQuestionario from '../../components/AvisoQuestionario'

// `children`: rodapé dentro do mesmo cartão (no check-in, a sequência de dias).
function Atalho({ to, icone, titulo, texto, feito, principal = false, children }) {
  return (
    <Link
      to={to}
      className="group block rounded-3xl bg-branco p-5 shadow-cartao transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
        <span className="flex items-center gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            principal && !feito ? 'bg-petroleo text-verdeAgua' : 'bg-nevoa text-petroleo'
          }`}
          aria-hidden
        >
          {icone}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-titulo text-lg leading-tight text-petroleo sm:text-xl">{titulo}</span>
          <span className="mt-0.5 block text-sm text-textoSecundario">{texto}</span>
        </span>
        {feito ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-nevoa px-2.5 py-1 font-interface text-xs font-semibold text-petroleo">
            <Check size={13} aria-hidden /> Feito
          </span>
        ) : (
          <ChevronRight className="shrink-0 text-textoSecundario transition-transform group-hover:translate-x-0.5" aria-hidden />
      )}
      </span>
      {children && <div className="mt-4">{children}</div>}
    </Link>
  )
}

export default function Inicio() {
  const { usuario, perfil } = useAuth()
  const [checkinHoje, setCheckinHoje] = useState(null)
  const [reflexaoSemana, setReflexaoSemana] = useState(null)
  const [combinado, setCombinado] = useState(null)
  const [sequencia, setSequencia] = useState(null)
  const [questionarios, setQuestionarios] = useState(null)
  const [adiadosHoje, setAdiadosHoje] = useState(null) // questionários com "Responder mais tarde" hoje

  useEffect(() => {
    const semana = inicioDaSemana()
    buscarCheckinDoDia(usuario.id, hojeLocal()).then(setCheckinHoje).catch(() => {})
    buscarReflexaoDaSemana(usuario.id, semana).then(setReflexaoSemana).catch(() => {})
    buscarObjetivoSemana(usuario.id, semana).then(setCombinado).catch(() => {})
    listarDatasDeCheckin(usuario.id).then((datas) => setSequencia(calcularSequencia(datas))).catch(() => {})
    listarQuestionarios(usuario.id).then(setQuestionarios).catch(() => {})
    listarAdiadosHoje(usuario.id).then(setAdiadosHoje).catch(() => setAdiadosHoje([]))
  }, [usuario.id])

  // Questionários que a psicóloga ligou e que estão no prazo (ou que ela pediu de novo).
  const pendentes = questionarios
    ? escalasLigadas(perfil)
        .filter((id) => escalaPendente(perfil.escalas[id], questionarios.find((q) => q.tipo === id), hojeLocal()))
        .map((id) => ESCALAS[id])
    : []

  // A janela de aviso mostra os pendentes que não foram adiados hoje.
  const paraAvisar = adiadosHoje ? pendentes.filter((e) => !adiadosHoje.includes(e.id)) : []
  function adiar() {
    const tipos = paraAvisar.map((e) => e.id)
    setAdiadosHoje((a) => [...(a ?? []), ...tipos])
    adiarQuestionarios(usuario.id, tipos).catch(() => {})
  }

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
      >
        {sequencia && <Sequencia sequencia={sequencia} embutida />}
      </Atalho>

      {perfil?.modulos.crise && (
        <Atalho
          to="/app/crise"
          icone={<Wind size={24} />}
          titulo="Ansiedade forte agora?"
          texto="Respiração guiada e um exercício para atravessar a crise. Depois, registre como foi."
        />
      )}
      {pendentes.map((e) => (
        <Atalho
          key={e.id}
          to={`/app/questionario/${e.id}`}
          icone={<ClipboardCheck size={24} />}
          titulo={e.tituloPaciente}
          texto={`Um questionário rápido, com ${e.itens.length} perguntas.`}
        />
      ))}

      {/* O objetivo escrito pela psicóloga aparece dentro do próprio cartão, como a sequência no check-in. */}
      <Atalho
        to="/app/semana"
        icone={<Sprout size={24} />}
        titulo="Objetivo da semana"
        texto={reflexaoSemana ? 'Toque para revisar sua reflexão.' : 'Como você percebe seus avanços nesta semana?'}
        feito={!!reflexaoSemana}
      >
        {combinado && (
          <p className="border-l-4 border-verdeAgua pl-3 font-titulo text-base italic leading-snug text-petroleo">“{combinado.texto}”</p>
        )}
      </Atalho>
      <Atalho
        to="/app/pensamentos"
        icone={<BrainCircuit size={24} />}
        titulo="Registro de pensamentos"
        texto="Algo mexeu com você? Anote a situação, o pensamento e o que sentiu."
      />
      {paraAvisar.length > 0 && <AvisoQuestionario escalas={paraAvisar} onAdiar={adiar} />}
    </Pagina>
  )
}
