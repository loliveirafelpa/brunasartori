import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Handshake, Pencil, Sprout, Target } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { buscarReflexaoDaSemana, inicioDaSemana, listarReflexoes, salvarReflexao } from '../../lib/reflexoesApi'
import { formatarDia } from '../../lib/sintese'
import { buscarObjetivosTerapeuticos, listarObjetivosSemana } from '../../lib/objetivosApi'
import EscolhaUnica from '../../components/EscolhaUnica'
import Campo from '../../components/Campo'
import Botao from '../../components/Botao'
import { Linha } from '../../components/RegistrosAnteriores'
import SeletorDeDia from '../../components/SeletorDeDia'

function CartaoReflexao({ r, combinado, onEditar }) {
  return (
    <>
      {combinado && <Linha rotulo="Combinado na sessão">{combinado}</Linha>}
      {r.objetivo && <Linha rotulo="Objetivo da semana">{r.objetivo}</Linha>}
      {r.percepcaoAvanco && <Linha rotulo="Avanço percebido">{PERCEPCOES[r.percepcaoAvanco - 1].rotulo}</Linha>}
      {r.avancos && <Linha rotulo="Avanços">{r.avancos}</Linha>}
      {r.dificuldades && <Linha rotulo="O que foi mais difícil">{r.dificuldades}</Linha>}
      <Botao variante="secundario" className="mt-2" onClick={() => onEditar(r.semanaInicio)}>
        <Pencil size={14} aria-hidden /> Editar esta semana
      </Botao>
    </>
  )
}

const VAZIO = { objetivo: '', percepcaoAvanco: null, avancos: '', dificuldades: '' }

const PERCEPCOES = ['Nada', 'Pouco', 'Um pouco', 'Bastante', 'Muito'].map((rotulo, i) => ({ valor: i + 1, rotulo }))

export default function ReflexaoSemanal() {
  const { usuario } = useAuth()
  const semanaAtual = inicioDaSemana()
  const [semanaInicio, setSemanaInicio] = useState(semanaAtual) // semana atual ou uma anterior em edição
  const ehAtual = semanaInicio === semanaAtual
  const [form, setForm] = useState(VAZIO)
  const [jaExistia, setJaExistia] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [anteriores, setAnteriores] = useState([])
  const [objetivosGerais, setObjetivosGerais] = useState(null)
  const [combinados, setCombinados] = useState({}) // semanaInicio -> texto combinado na sessão

  useEffect(() => {
    buscarObjetivosTerapeuticos(usuario.id).then((o) => setObjetivosGerais(o?.texto ?? null)).catch(() => {})
    listarObjetivosSemana(usuario.id, 52)
      .then((os) => setCombinados(Object.fromEntries(os.map((o) => [o.semanaInicio, o.texto]))))
      .catch(() => {})
  }, [usuario.id])

  useEffect(() => {
    listarReflexoes(usuario.id, 12)
      .then((rs) => setAnteriores(rs.filter((r) => r.semanaInicio !== semanaAtual)))
      .catch(() => {})
  }, [usuario.id, semanaAtual])

  useEffect(() => {
    setForm(VAZIO)
    setJaExistia(false)
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
    if (!combinadoDaSemana && !form.objetivo.trim() && !form.percepcaoAvanco && !form.avancos.trim() && !form.dificuldades.trim()) {
      return setErro('Responda pelo menos uma das perguntas.')
    }
    setEnviando(true)
    try {
      const salva = await salvarReflexao({ ...form, userId: usuario.id, semanaInicio })
      if (!ehAtual) setAnteriores((rs) => rs.map((r) => (r.semanaInicio === semanaInicio ? salva : r)))
      setSalvo(true)
    } catch {
      setErro('Não foi possível salvar agora. Suas respostas continuam aqui — tente de novo em instantes.')
    } finally {
      setEnviando(false)
    }
  }

  const combinadoDaSemana = combinados[semanaInicio]

  function editarSemana(semana) {
    setSemanaInicio(semana)
    setSalvo(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const [ano, mes, dia] = semanaInicio.split('-')

  if (salvo) {
    return (
      <section className="mx-auto max-w-xl space-y-6 text-center">
        <Sprout className="mx-auto text-verdeAgua" size={40} aria-hidden />
        <h1 className="text-3xl">{ehAtual ? 'Reflexão guardada.' : 'Reflexão atualizada.'}</h1>
        <p className="text-textoSecundario">Olhar para o próprio caminho também é parte do processo.</p>
        <div className="flex flex-wrap justify-center gap-6">
          <button type="button" onClick={() => editarSemana(semanaAtual)} className="font-interface text-sm font-semibold text-petroleo underline">
            Ver reflexões
          </button>
          <Link to="/app" className="font-interface text-sm font-semibold text-petroleo underline">
            Voltar para o início
          </Link>
        </div>
      </section>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <form onSubmit={salvar} className="space-y-8">
        <div>
          <h1 className="text-3xl">
            Sua <em className="text-salvia">semana</em>
          </h1>
          {ehAtual ? (
            <p className="mt-2 text-textoSecundario">
              Semana iniciada em {dia}/{mes}/{ano}.{' '}
              {jaExistia ? 'Você já respondeu — pode ajustar se quiser.' : 'Pense nos objetivos que você está trabalhando na terapia.'}
            </p>
          ) : (
            <p className="mt-2 rounded-xl bg-nevoa px-4 py-3 text-sm text-petroleo">
              Editando a reflexão da <strong>semana de {dia}/{mes}/{ano}</strong>.{' '}
              <button type="button" onClick={() => editarSemana(semanaAtual)} className="font-semibold underline">
                Voltar para esta semana
              </button>
            </p>
          )}
        </div>

        {objetivosGerais && (
          <div className="rounded-2xl bg-nevoa p-5">
            <p className="flex items-center gap-2 font-interface text-sm font-semibold text-petroleo">
              <Target size={16} aria-hidden /> Seus objetivos na terapia
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{objetivosGerais}</p>
          </div>
        )}

        {combinadoDaSemana ? (
          <div className="rounded-2xl border-2 border-salvia bg-branco p-5">
            <p className="flex items-center gap-2 font-interface text-sm font-semibold text-petroleo">
              <Handshake size={16} aria-hidden /> Objetivo da semana · combinado na sessão
            </p>
            <p className="mt-2 whitespace-pre-wrap">{combinadoDaSemana}</p>
          </div>
        ) : (
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
        )}

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
          {enviando ? 'Salvando…' : ehAtual ? 'Salvar reflexão' : 'Salvar alterações'}
        </Botao>
      </form>

      <SeletorDeDia
        itens={anteriores}
        campoData="semanaInicio"
        convite="Escolha uma semana"
        formatarOpcao={(iso) => `Semana de ${formatarDia(iso, { day: '2-digit', month: '2-digit', year: 'numeric' })}`}
        renderItem={(r) => <CartaoReflexao r={r} combinado={combinados[r.semanaInicio]} onEditar={editarSemana} />}
      />
    </div>
  )
}
