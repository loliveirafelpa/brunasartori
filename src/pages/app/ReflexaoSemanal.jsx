import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Handshake, Pencil, Target } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { buscarReflexaoDaSemana, inicioDaSemana, listarReflexoes, salvarReflexao } from '../../lib/reflexoesApi'
import { formatarDia } from '../../lib/sintese'
import { buscarObjetivosTerapeuticos, listarObjetivosSemana } from '../../lib/objetivosApi'
import EscolhaUnica from '../../components/EscolhaUnica'
import Campo from '../../components/Campo'
import Botao from '../../components/Botao'
import { Linha } from '../../components/RegistrosAnteriores'
import SeletorDeDia from '../../components/SeletorDeDia'
import Bloco from '../../components/Bloco'
import Pagina, { Destaque } from '../../components/Pagina'

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

  const [, mes, dia] = semanaInicio.split('-')

  const [a, m, d] = semanaInicio.split('-').map(Number)
  const domingo = new Date(a, m - 1, d + 6).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const intervalo = `${dia}/${mes} a ${domingo}`

  if (salvo) {
    return (
      <Pagina
        sobretitulo={`Semana de ${intervalo}`}
        titulo={
          ehAtual ? (
            <>
              Reflexão <Destaque>guardada</Destaque>.
            </>
          ) : (
            <>
              Reflexão <Destaque>atualizada</Destaque>.
            </>
          )
        }
        descricao="Olhar para o próprio caminho também é parte do processo."
      >
        <Bloco>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/app"
              className="inline-flex flex-1 items-center justify-center rounded-full bg-petroleo px-5 py-3 font-interface text-sm font-semibold text-branco hover:bg-petroleoEscuro"
            >
              Voltar para o início
            </Link>
            <Botao variante="secundario" className="flex-1 py-3" onClick={() => editarSemana(semanaAtual)}>
              Ver minhas reflexões
            </Botao>
          </div>
        </Bloco>
      </Pagina>
    )
  }

  return (
    <Pagina
      sobretitulo={ehAtual ? `Semana de ${intervalo}` : 'Editando uma semana anterior'}
      titulo={
        <>
          Sua <Destaque>semana</Destaque>
        </>
      }
      descricao={
        ehAtual
          ? jaExistia
            ? 'Você já respondeu esta semana. Pode ajustar se quiser.'
            : 'Um momento para olhar para os objetivos que você está trabalhando na terapia.'
          : null
      }
      aviso={
        !ehAtual && (
          <p className="rounded-2xl bg-branco/10 px-4 py-3 text-sm text-nevoa">
            Você está editando a reflexão da <strong className="text-branco">semana de {intervalo}</strong>.{' '}
            <button type="button" onClick={() => editarSemana(semanaAtual)} className="font-semibold text-branco underline">
              Voltar para esta semana
            </button>
          </p>
        )
      }
    >
      <form onSubmit={salvar} className="space-y-5">
        {combinadoDaSemana && (
          <section className="rounded-3xl border-l-4 border-verdeAgua bg-branco p-5 shadow-cartao sm:p-7">
            <p className="flex items-center gap-2 font-interface text-[11px] font-semibold uppercase tracking-[0.14em] text-petroleo">
              <Handshake size={15} className="text-salvia" aria-hidden /> Combinado na sessão
            </p>
            <p className="mt-3 whitespace-pre-wrap font-titulo text-xl italic leading-snug text-petroleo">“{combinadoDaSemana}”</p>
          </section>
        )}

        <Bloco titulo="Sua reflexão">
          {!combinadoDaSemana && (
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
        </Bloco>

        {erro && <p className="px-1 text-sm text-alerta" role="alert">{erro}</p>}
        <Botao type="submit" className="w-full py-3.5 text-base shadow-cartao" disabled={enviando}>
          {enviando ? 'Salvando…' : ehAtual ? 'Salvar reflexão' : 'Salvar alterações'}
        </Botao>
      </form>

      {anteriores.length > 0 && (
        <Bloco titulo="Reflexões anteriores">
          <SeletorDeDia
            rotulo="Escolha uma semana"
            itens={anteriores}
            campoData="semanaInicio"
            convite="Escolha uma semana"
            formatarOpcao={(iso) => `Semana de ${formatarDia(iso, { day: '2-digit', month: '2-digit', year: 'numeric' })}`}
            renderItem={(r) => <CartaoReflexao r={r} combinado={combinados[r.semanaInicio]} onEditar={editarSemana} />}
          />
        </Bloco>
      )}

      {/* Item fixo, definido pela psicóloga — fica por último. */}
      {objetivosGerais && (
        <Bloco titulo="Seus objetivos na terapia" icone={<Target size={15} />}>
          <p className="whitespace-pre-wrap font-titulo text-lg leading-relaxed text-petroleo">{objetivosGerais}</p>
        </Bloco>
      )}
    </Pagina>
  )
}
