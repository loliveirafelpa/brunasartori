import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sprout } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { buscarReflexaoDaSemana, inicioDaSemana, listarReflexoes, salvarReflexao } from '../../lib/reflexoesApi'
import { formatarDia } from '../../lib/sintese'
import EscolhaUnica from '../../components/EscolhaUnica'
import Campo from '../../components/Campo'
import Botao from '../../components/Botao'
import { Linha } from '../../components/RegistrosAnteriores'
import SeletorDeDia from '../../components/SeletorDeDia'

function CartaoReflexao({ r }) {
  return (
    <>
      {r.objetivo && <Linha rotulo="Objetivo da semana">{r.objetivo}</Linha>}
      {r.percepcaoAvanco && <Linha rotulo="Avanço percebido">{PERCEPCOES[r.percepcaoAvanco - 1].rotulo}</Linha>}
      {r.avancos && <Linha rotulo="Avanços">{r.avancos}</Linha>}
      {r.dificuldades && <Linha rotulo="O que foi mais difícil">{r.dificuldades}</Linha>}
    </>
  )
}

const PERCEPCOES = ['Nada', 'Pouco', 'Um pouco', 'Bastante', 'Muito'].map((rotulo, i) => ({ valor: i + 1, rotulo }))

export default function ReflexaoSemanal() {
  const { usuario } = useAuth()
  const semanaInicio = inicioDaSemana()
  const [form, setForm] = useState({ objetivo: '', percepcaoAvanco: null, avancos: '', dificuldades: '' })
  const [jaExistia, setJaExistia] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [anteriores, setAnteriores] = useState([])

  useEffect(() => {
    listarReflexoes(usuario.id, 12)
      .then((rs) => setAnteriores(rs.filter((r) => r.semanaInicio !== semanaInicio)))
      .catch(() => {})
  }, [usuario.id, semanaInicio])

  useEffect(() => {
    buscarReflexaoDaSemana(usuario.id, semanaInicio)
      .then((r) => {
        if (!r) return
        setJaExistia(true)
        setForm({
          objetivo: r.objetivo ?? '',
          percepcaoAvanco: r.percepcaoAvanco,
          avancos: r.avancos ?? '',
          dificuldades: r.dificuldades ?? '',
        })
      })
      .catch(() => {})
  }, [usuario.id, semanaInicio])

  const muda = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }))

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    if (!form.objetivo.trim() && !form.percepcaoAvanco && !form.avancos.trim() && !form.dificuldades.trim()) {
      return setErro('Responda pelo menos uma das perguntas.')
    }
    setEnviando(true)
    try {
      await salvarReflexao({ ...form, userId: usuario.id, semanaInicio })
      setSalvo(true)
    } catch {
      setErro('Não foi possível salvar agora. Suas respostas continuam aqui — tente de novo em instantes.')
    } finally {
      setEnviando(false)
    }
  }

  if (salvo) {
    return (
      <section className="mx-auto max-w-xl space-y-6 text-center">
        <Sprout className="mx-auto text-verdeAgua" size={40} aria-hidden />
        <h1 className="text-3xl">Reflexão guardada.</h1>
        <p className="text-textoSecundario">Olhar para o próprio caminho também é parte do processo.</p>
        <Link to="/app" className="inline-block font-interface text-sm font-semibold text-petroleo underline">
          Voltar para o início
        </Link>
      </section>
    )
  }

  const [ano, mes, dia] = semanaInicio.split('-')

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <form onSubmit={salvar} className="space-y-8">
        <div>
          <h1 className="text-3xl">
            Sua <em className="text-salvia">semana</em>
          </h1>
          <p className="mt-2 text-textoSecundario">
            Semana iniciada em {dia}/{mes}/{ano}.{' '}
            {jaExistia ? 'Você já respondeu — pode ajustar se quiser.' : 'Pense nos objetivos que você está trabalhando na terapia.'}
          </p>
        </div>

        <Campo
          rotulo="Objetivo da semana"
          id="objetivo"
          multilinha
          maxLength={2000}
          placeholder="O que você quer praticar ou observar nesta semana?"
          ajuda="Ex.: falar com meu chefe quando surgir insegurança, em vez de evitar."
          value={form.objetivo}
          onChange={(e) => muda('objetivo')(e.target.value)}
        />

        <EscolhaUnica
          nome="percepcao"
          legenda="Quanto você sente que avançou nos seus objetivos esta semana?"
          opcoes={PERCEPCOES}
          valor={form.percepcaoAvanco}
          onChange={muda('percepcaoAvanco')}
        />

        <Campo
          rotulo="O que foi um avanço, mesmo que pequeno?"
          id="avancos"
          multilinha
          maxLength={4000}
          placeholder="Opcional"
          value={form.avancos}
          onChange={(e) => muda('avancos')(e.target.value)}
        />

        <Campo
          rotulo="O que foi mais difícil?"
          id="dificuldades"
          multilinha
          maxLength={4000}
          placeholder="Opcional"
          value={form.dificuldades}
          onChange={(e) => muda('dificuldades')(e.target.value)}
        />

        {erro && <p className="text-sm text-alerta" role="alert">{erro}</p>}
        <Botao type="submit" className="w-full" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Salvar reflexão'}
        </Botao>
      </form>

      <SeletorDeDia
        itens={anteriores}
        campoData="semanaInicio"
        convite="Escolha uma semana"
        formatarOpcao={(iso) => `Semana de ${formatarDia(iso, { day: '2-digit', month: '2-digit', year: 'numeric' })}`}
        renderItem={(r) => <CartaoReflexao r={r} />}
      />
    </div>
  )
}
