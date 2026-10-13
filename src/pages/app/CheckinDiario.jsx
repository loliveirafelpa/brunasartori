import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { buscarCheckinDoDia, hojeLocal, listarCheckins, salvarCheckin } from '../../lib/checkinsApi'
import { diasDoPeriodo, rotuloEmocao, rotuloSituacao } from '../../lib/sintese'
import { EMOCOES, ESCALA_ENERGIA, ESCALA_SONO, HUMORES, SITUACOES } from '../../data/checkinOpcoes'
import EscolhaUnica from '../../components/EscolhaUnica'
import BarraEscala from '../../components/BarraEscala'
import EscolhaMultipla from '../../components/EscolhaMultipla'
import Campo from '../../components/Campo'
import Botao from '../../components/Botao'
import AvisoCrise from '../../components/AvisoCrise'
import { Linha } from '../../components/RegistrosAnteriores'
import SeletorDeDia from '../../components/SeletorDeDia'

const escala = (rotulos) => rotulos.map((rotulo, i) => ({ valor: i + 1, rotulo }))

const VAZIO = {
  humor: null,
  emocao: null,
  emocaoOutra: '',
  ansiedade: null,
  sonoHoras: '',
  sonoQualidade: null,
  energia: null,
  acontecimento: '',
  situacoes: [],
  situacaoOutra: '',
}

function CartaoCheckin({ c }) {
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
      {c.acontecimento && <Linha rotulo="Acontecimento">{c.acontecimento}</Linha>}
    </>
  )
}

export default function CheckinDiario() {
  const { usuario } = useAuth()
  const data = hojeLocal()
  const [form, setForm] = useState(VAZIO)
  const [jaExistia, setJaExistia] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [anteriores, setAnteriores] = useState([])

  useEffect(() => {
    listarCheckins(usuario.id, diasDoPeriodo(60)[0])
      .then((cs) => setAnteriores(cs.filter((c) => c.data !== data)))
      .catch(() => {})
  }, [usuario.id, data])

  useEffect(() => {
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
        })
      })
      .catch(() => {})
  }, [usuario.id, data])

  const muda = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }))

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    if (!form.humor || !form.emocao) return setErro('Responda pelo menos como você está e a emoção mais presente.')
    setEnviando(true)
    try {
      await salvarCheckin({
        ...form,
        userId: usuario.id,
        data,
        sonoHoras: form.sonoHoras === '' ? null : Number(form.sonoHoras),
      })
      setSalvo(true)
    } catch {
      setErro('Não foi possível salvar agora. Suas respostas continuam aqui — tente de novo em instantes.')
    } finally {
      setEnviando(false)
    }
  }

  if (salvo) {
    const humorBaixo = form.humor <= 2
    return (
      <section className="mx-auto max-w-xl space-y-6 text-center">
        <Heart className="mx-auto text-verdeAgua" size={40} aria-hidden />
        <h1 className="text-3xl">Obrigada por registrar.</h1>
        <p className="text-textoSecundario">
          Seu check-in de hoje foi guardado e vai ajudar na sua próxima sessão.
        </p>
        {humorBaixo && <AvisoCrise destaque />}
        <Link to="/app" className="inline-block font-interface text-sm font-semibold text-petroleo underline">
          Voltar para o início
        </Link>
      </section>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <form onSubmit={salvar} className="space-y-8">
        <div>
          <h1 className="text-3xl">
            Como foi o seu <em className="text-salvia">dia</em>?
          </h1>
          <p className="mt-2 text-textoSecundario">
            {jaExistia ? 'Você já registrou hoje — pode ajustar se quiser.' : 'Leva menos de um minuto. Responda só o que fizer sentido.'}
          </p>
        </div>

        <EscolhaUnica nome="humor" legenda="Como você está se sentindo?" opcoes={HUMORES} valor={form.humor} onChange={muda('humor')} />

        <div className="space-y-3">
          <EscolhaUnica nome="emocao" legenda="Qual emoção esteve mais presente?" opcoes={EMOCOES} valor={form.emocao} onChange={muda('emocao')} colunas={4} />
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
          <Campo rotulo="Quantas horas você dormiu, mais ou menos?" id="sono-horas" type="number" min="0" max="24" step="0.5" inputMode="decimal" value={form.sonoHoras} onChange={(e) => muda('sonoHoras')(e.target.value)} />
        </div>

        <EscolhaUnica nome="energia" legenda="Como esteve sua energia?" opcoes={escala(ESCALA_ENERGIA)} valor={form.energia} onChange={muda('energia')} />

        <Campo
          rotulo="Aconteceu algo importante hoje?"
          id="acontecimento"
          multilinha
          maxLength={4000}
          placeholder="Opcional — escreva com suas palavras."
          value={form.acontecimento}
          onChange={(e) => muda('acontecimento')(e.target.value)}
        />

        {erro && <p className="text-sm text-alerta" role="alert">{erro}</p>}
        <Botao type="submit" className="w-full" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Salvar check-in'}
        </Botao>
      </form>

      <SeletorDeDia itens={anteriores} renderItem={(c) => <CartaoCheckin c={c} />} />
    </div>
  )
}
