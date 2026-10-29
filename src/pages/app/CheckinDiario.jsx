import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { buscarCheckinDoDia, hojeLocal, listarCheckins, listarDatasDeCheckin, salvarCheckin } from '../../lib/checkinsApi'
import { calcularSequencia } from '../../lib/sequencia'
import { diasDoPeriodo, formatarDia, rotuloEmocao, rotuloSituacao } from '../../lib/sintese'
import { EMOCOES, ESCALA_ENERGIA, ESCALA_SONO, HUMORES, MOVIMENTO, SITUACOES } from '../../data/checkinOpcoes'
import EscolhaUnica from '../../components/EscolhaUnica'
import BarraEscala from '../../components/BarraEscala'
import EscolhaMultipla from '../../components/EscolhaMultipla'
import Campo from '../../components/Campo'
import Botao from '../../components/Botao'
import AvisoCrise from '../../components/AvisoCrise'
import Bloco from '../../components/Bloco'
import Pagina, { Destaque } from '../../components/Pagina'
import { Linha } from '../../components/RegistrosAnteriores'
import SeletorDeDia from '../../components/SeletorDeDia'
import Sequencia from '../../components/Sequencia'
import RodaHorasSono from '../../components/RodaHorasSono'
import PerguntasModulo from '../../components/PerguntasModulo'
import { limparRespostas, MODULOS, modulosAtivos, textoResposta } from '../../data/modulos'
import { diasDesdeUltimoCigarro, pedeAvisoDeCrise } from '../../lib/sinteseModulos'

const escala = (rotulos) => rotulos.map((rotulo, i) => ({ valor: i + 1, rotulo }))

// Respostas dos módulos num registro anterior: "Cigarro — Fumou: Não · Vontade: 6/10".
function LinhasModulos({ modulos }) {
  return MODULOS.filter((m) => modulos?.[m.id]).map((m) => {
    const partes = m.perguntas
      .map((p) => {
        const texto = textoResposta(p, modulos[m.id][p.id])
        return texto && `${p.rotulo.replace(/\?$/, '')}: ${texto}`
      })
      .filter(Boolean)
    return partes.length ? (
      <Linha key={m.id} rotulo={m.tituloPaciente}>
        {partes.join(' · ')}
      </Linha>
    ) : null
  })
}

const VAZIO = {
  modulos: {},
  humor: null,
  emocao: null,
  emocaoOutra: '',
  ansiedade: null,
  sonoHoras: '',
  sonoQualidade: null,
  energia: null,
  exercicio: null,
  acontecimento: '',
  situacoes: [],
  situacaoOutra: '',
}

function CartaoCheckin({ c, onEditar }) {
  const humor = HUMORES.find((h) => h.valor === c.humor)
  const situacoes = c.situacoes.map((s) => (s === 'outra' && c.situacaoOutra ? c.situacaoOutra : rotuloSituacao(s))).join(', ')
  return (
    <>
      <Linha rotulo="Humor">{humor.emoji} {humor.rotulo}</Linha>
      <Linha rotulo="Emoção">{rotuloEmocao(c)}</Linha>
      {situacoes && <Linha rotulo="Situações">{situacoes}</Linha>}
      {c.ansiedade !== null && <Linha rotulo="Ansiedade ou estresse">{c.ansiedade}/10</Linha>}
      {c.sonoQualidade && (
        <Linha rotulo="Sono">
          {ESCALA_SONO[c.sonoQualidade - 1]}
          {c.sonoHoras !== null && `, ${String(c.sonoHoras).replace('.', ',')}h`}
        </Linha>
      )}
      {c.energia && <Linha rotulo="Energia">{ESCALA_ENERGIA[c.energia - 1]}</Linha>}
      {c.exercicio !== null && <Linha rotulo="Movimento">{c.exercicio ? 'Sim' : 'Não'}</Linha>}
      {c.acontecimento && <Linha rotulo="Acontecimento">{c.acontecimento}</Linha>}
      <LinhasModulos modulos={c.modulos} />
      <Botao variante="secundario" className="mt-2" onClick={() => onEditar(c.data)}>
        <Pencil size={14} aria-hidden /> Editar este dia
      </Botao>
    </>
  )
}

export default function CheckinDiario() {
  const { usuario, perfil } = useAuth()
  const ativos = modulosAtivos(perfil)
  const hoje = hojeLocal()
  const [data, setData] = useState(hoje) // dia sendo preenchido: hoje ou um dia anterior em edição
  const ehHoje = data === hoje
  const [form, setForm] = useState(VAZIO)
  const [jaExistia, setJaExistia] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [anteriores, setAnteriores] = useState([])
  const [sequencia, setSequencia] = useState(null)

  useEffect(() => {
    listarCheckins(usuario.id, diasDoPeriodo(60)[0])
      .then((cs) => setAnteriores(cs.filter((c) => c.data !== hoje)))
      .catch(() => {})
  }, [usuario.id, hoje])

  useEffect(() => {
    setForm(VAZIO)
    setJaExistia(false)
    buscarCheckinDoDia(usuario.id, data)
      .then((c) => {
        if (!c) return
        setJaExistia(true)
        setForm({
          ...VAZIO,
          ...c,
          sonoHoras: c.sonoHoras ?? '',
          emocaoOutra: c.emocaoOutra ?? '',
          acontecimento: c.acontecimento ?? '',
          situacaoOutra: c.situacaoOutra ?? '',
          modulos: c.modulos ?? {},
        })
      })
      .catch(() => {})
  }, [usuario.id, data])

  const muda = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }))
  const mudaModulo = (id) => (respostas) => setForm((f) => ({ ...f, modulos: { ...f.modulos, [id]: respostas } }))

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    if (!form.humor || !form.emocao) return setErro('Responda pelo menos como você está e a emoção mais presente.')
    setEnviando(true)
    // Módulos ligados: guarda só as perguntas visíveis. Desligados: mantém o que já havia no dia.
    const modulos = { ...form.modulos }
    for (const m of ativos) {
      const limpas = limparRespostas(m, form.modulos[m.id] ?? {})
      if (Object.keys(limpas).length) modulos[m.id] = limpas
      else delete modulos[m.id]
    }
    try {
      const salvoAgora = await salvarCheckin({
        ...form,
        modulos,
        userId: usuario.id,
        data,
        sonoHoras: form.sonoHoras === '' ? null : Number(form.sonoHoras),
      })
      setAnteriores((cs) => (ehHoje ? cs : cs.map((c) => (c.data === data ? salvoAgora : c))))
      setForm((f) => ({ ...f, modulos }))
      setSalvo(true)
      if (ehHoje) listarDatasDeCheckin(usuario.id).then((datas) => setSequencia(calcularSequencia(datas))).catch(() => {})
    } catch {
      setErro('Não foi possível salvar agora. Suas respostas continuam aqui — tente de novo em instantes.')
    } finally {
      setEnviando(false)
    }
  }

  function editarDia(dia) {
    setData(dia)
    setSalvo(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const diaPorExtenso = formatarDia(data, { weekday: 'long', day: '2-digit', month: '2-digit' })

  const hojePorExtenso = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  if (salvo) {
    const humorBaixo = form.humor <= 2 || pedeAvisoDeCrise(form.modulos)
    const semFumar = perfil.modulos.tabagismo && ehHoje ? diasDesdeUltimoCigarro([{ data, modulos: form.modulos }, ...anteriores], hoje) : null
    return (
      <Pagina
        sobretitulo={ehHoje ? hojePorExtenso : diaPorExtenso}
        titulo={
          ehHoje ? (
            <>
              Obrigada por <Destaque>registrar</Destaque>.
            </>
          ) : (
            <>
              Check-in <Destaque>atualizado</Destaque>.
            </>
          )
        }
        descricao={
          ehHoje
            ? 'Seu check-in de hoje foi guardado e vai ajudar na sua próxima sessão.'
            : `As alterações de ${diaPorExtenso} foram guardadas.`
        }
      >
        {humorBaixo && <AvisoCrise destaque />}
        {ehHoje && sequencia && <Sequencia sequencia={sequencia} />}
        {semFumar > 0 && (
          <Bloco>
            <p className="font-titulo text-xl leading-snug text-petroleo">
              {semFumar} {semFumar === 1 ? 'dia' : 'dias'} sem fumar.
            </p>
            <p className="-mt-6 text-sm text-textoSecundario">Cada dia conta. Se a vontade apertar, lembre do que combinou na sessão.</p>
          </Bloco>
        )}
        <Bloco>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/app"
              className="inline-flex flex-1 items-center justify-center rounded-full bg-petroleo px-5 py-3 font-interface text-sm font-semibold text-branco hover:bg-petroleoEscuro"
            >
              Voltar para o início
            </Link>
            <Botao variante="secundario" className="flex-1 py-3" onClick={() => editarDia(hoje)}>
              Ver meus check-ins
            </Botao>
          </div>
        </Bloco>
      </Pagina>
    )
  }

  return (
    <Pagina
      sobretitulo={ehHoje ? hojePorExtenso : 'Editando um dia anterior'}
      titulo={
        <>
          Como foi o seu <Destaque>dia</Destaque>?
        </>
      }
      descricao={
        ehHoje
          ? jaExistia
            ? 'Você já registrou hoje. Pode ajustar se quiser.'
            : 'Leva menos de um minuto. Responda só o que fizer sentido.'
          : null
      }
      aviso={
        !ehHoje && (
          <p className="rounded-2xl bg-branco/10 px-4 py-3 text-sm text-nevoa">
            Você está editando o check-in de <strong className="capitalize text-branco">{diaPorExtenso}</strong>.{' '}
            <button type="button" onClick={() => editarDia(hoje)} className="font-semibold text-branco underline">
              Voltar para hoje
            </button>
          </p>
        )
      }
    >
      <form onSubmit={salvar} className="space-y-5">
        <Bloco titulo="Como você está">
          <EscolhaUnica nome="humor" legenda="Como você está se sentindo?" opcoes={HUMORES} valor={form.humor} onChange={muda('humor')} />

          <div className="space-y-3">
            <EscolhaMultipla
              legenda="Qual emoção esteve mais presente?"
              opcoes={EMOCOES}
              valores={form.emocao ? [form.emocao] : []}
              onChange={(vs) => muda('emocao')(vs.find((v) => v !== form.emocao) ?? null)}
            />
            {form.emocao === 'outra' && (
              <Campo rotulo="Qual?" id="emocao-outra" maxLength={80} value={form.emocaoOutra} onChange={(e) => muda('emocaoOutra')(e.target.value)} />
            )}
          </div>

          <div className="space-y-3">
            <EscolhaMultipla
              legenda="Alguma situação esteve ligada ao que você sentiu?"
              ajuda="Opcional. Marque quantas quiser."
              opcoes={SITUACOES}
              valores={form.situacoes}
              onChange={muda('situacoes')}
            />
            {form.situacoes.includes('outra') && (
              <Campo rotulo="Qual situação?" id="situacao-outra" maxLength={80} value={form.situacaoOutra} onChange={(e) => muda('situacaoOutra')(e.target.value)} />
            )}
          </div>
        </Bloco>

        <Bloco titulo="Seu corpo hoje">
          <BarraEscala
            id="ansiedade"
            rotulo="Quanta ansiedade ou estresse você sentiu?"
            minimo="Nenhuma"
            maximo="Extrema"
            opcional
            valor={form.ansiedade}
            onChange={muda('ansiedade')}
          />

          <div className="space-y-3">
            <EscolhaUnica nome="sono" legenda="Como foi seu sono na última noite?" opcoes={escala(ESCALA_SONO)} valor={form.sonoQualidade} onChange={muda('sonoQualidade')} />
            <RodaHorasSono
              id="sono-horas"
              rotulo="Quantas horas você dormiu, mais ou menos?"
              valor={form.sonoHoras}
              onChange={muda('sonoHoras')}
            />
          </div>

          <EscolhaUnica nome="energia" legenda="Como esteve sua energia?" opcoes={escala(ESCALA_ENERGIA)} valor={form.energia} onChange={muda('energia')} />

          <EscolhaUnica nome="exercicio" legenda="Você se movimentou hoje?" opcoes={MOVIMENTO} valor={form.exercicio} onChange={muda('exercicio')} colunas={2} />
        </Bloco>

        {ativos.map((m) => (
          <Bloco key={m.id} titulo={m.tituloPaciente}>
            <PerguntasModulo modulo={m} respostas={form.modulos[m.id]} onChange={mudaModulo(m.id)} />
          </Bloco>
        ))}

        <Bloco titulo="Seu dia">
          <Campo
            rotulo="Aconteceu algo importante hoje?"
            id="acontecimento"
            multilinha
            maxLength={4000}
            placeholder="Opcional. Escreva com suas palavras."
            value={form.acontecimento}
            onChange={(e) => muda('acontecimento')(e.target.value)}
          />
        </Bloco>

        {erro && <p className="px-1 text-sm text-alerta" role="alert">{erro}</p>}
        <Botao type="submit" className="w-full py-3.5 text-base shadow-cartao" disabled={enviando}>
          {enviando ? 'Salvando…' : ehHoje ? 'Salvar check-in' : 'Salvar alterações'}
        </Botao>
      </form>

      {anteriores.length > 0 && (
        <Bloco titulo="Check-ins anteriores">
          <SeletorDeDia rotulo="Escolha um dia" itens={anteriores} renderItem={(c) => <CartaoCheckin c={c} onEditar={editarDia} />} />
        </Bloco>
      )}
    </Pagina>
  )
}
