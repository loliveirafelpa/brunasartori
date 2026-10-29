import { useEffect, useState } from 'react'
import { Check, Eye, Footprints, Hand, Ear, Wind, Coffee } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { listarCrises, registrarCrise } from '../../lib/protocolosApi'
import { CRISE_DURACAO, CRISE_ESTRATEGIAS, CRISE_LUGAR, CRISE_SINTOMAS } from '../../data/modulos'
import Pagina, { Destaque } from '../../components/Pagina'
import Bloco from '../../components/Bloco'
import Botao from '../../components/Botao'
import Campo from '../../components/Campo'
import BarraEscala from '../../components/BarraEscala'
import EscolhaUnica from '../../components/EscolhaUnica'
import EscolhaMultipla from '../../components/EscolhaMultipla'
import AvisoCrise from '../../components/AvisoCrise'
import Respiracao from '../../components/Respiracao'
import SeletorDeDia from '../../components/SeletorDeDia'
import { Linha } from '../../components/RegistrosAnteriores'

// Exercício de aterramento 5-4-3-2-1: trazer a atenção para o que está ao redor.
const ATERRAMENTO = [
  { n: 5, texto: 'coisas que você consegue ver', icone: Eye },
  { n: 4, texto: 'coisas que você consegue tocar', icone: Hand },
  { n: 3, texto: 'sons que você consegue ouvir', icone: Ear },
  { n: 2, texto: 'cheiros que você consegue sentir', icone: Wind },
  { n: 1, texto: 'sabor, ou uma coisa boa sobre você', icone: Coffee },
]

// Data e hora local no formato do campo datetime-local (AAAA-MM-DDTHH:MM).
const agoraLocal = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

const VAZIO = { ocorridoEm: agoraLocal(), intensidade: null, duracao: null, lugar: null, sintomas: [], estrategias: [], ajudou: '' }
const rotuloDe = (lista, v) => lista.find((o) => o.valor === v)?.rotulo ?? v

export default function Crise() {
  const { usuario } = useAuth()
  const [aba, setAba] = useState('agora')
  const [form, setForm] = useState(VAZIO)
  const [crises, setCrises] = useState([])
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    listarCrises(usuario.id).then(setCrises).catch(() => {})
  }, [usuario.id])

  const muda = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }))

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    if (form.intensidade === null) return setErro('Marque pelo menos a intensidade da crise.')
    setEnviando(true)
    try {
      const nova = await registrarCrise(usuario.id, { ...form, ocorridoEm: new Date(form.ocorridoEm).toISOString() })
      setCrises((cs) => [nova, ...cs])
      setForm({ ...VAZIO, ocorridoEm: agoraLocal() })
      setSalvo(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setErro('Não foi possível salvar agora. Tente de novo em instantes.')
    } finally {
      setEnviando(false)
    }
  }

  const Aba = ({ id, children }) => (
    <button
      type="button"
      onClick={() => {
        setAba(id)
        setSalvo(false)
      }}
      aria-pressed={aba === id}
      className={`flex-1 rounded-full px-4 py-2 font-interface text-xs font-semibold transition-colors ${
        aba === id ? 'bg-branco text-petroleo' : 'text-nevoa hover:text-branco'
      }`}
    >
      {children}
    </button>
  )

  return (
    <Pagina
      sobretitulo="Ansiedade"
      titulo={
        aba === 'agora' ? (
          <>
            Respire. Isso vai <Destaque>passar</Destaque>.
          </>
        ) : (
          <>
            Como foi a <Destaque>crise</Destaque>?
          </>
        )
      }
      descricao={
        aba === 'agora'
          ? 'Uma crise de ansiedade é muito desconfortável, mas não é perigosa e tem fim. Vá no seu ritmo.'
          : 'Registrar depois que passou ajuda você e sua psicóloga a entender o que acontece nesses momentos.'
      }
      aviso={
        <div className="flex gap-1 rounded-full bg-branco/10 p-1" role="group" aria-label="O que você quer fazer">
          <Aba id="agora">Estou em crise agora</Aba>
          <Aba id="registro">Registrar uma crise</Aba>
        </div>
      }
    >
      {aba === 'agora' ? (
        <>
          <Bloco titulo="Respiração">
            <Respiracao />
          </Bloco>
          <Bloco titulo="Exercício 5-4-3-2-1" icone={<Footprints size={15} />}>
            <div className="space-y-4">
              <p className="text-textoSecundario">Olhe ao redor e, sem pressa, encontre:</p>
              <ol className="space-y-3">
                {ATERRAMENTO.map((passo) => {
                  const Icone = passo.icone
                  return (
                    <li key={passo.n} className="flex items-center gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-petroleo font-titulo text-xl text-verdeAgua">{passo.n}</span>
                      <span className="flex-1 leading-snug">{passo.texto}</span>
                      <Icone size={18} className="text-salvia" aria-hidden />
                    </li>
                  )
                })}
              </ol>
            </div>
          </Bloco>
          <AvisoCrise destaque />
          <Botao variante="secundario" className="w-full py-3" onClick={() => setAba('registro')}>
            Já passou. Quero registrar como foi
          </Botao>
        </>
      ) : (
        <>
          {salvo && (
            <Bloco>
              <p className="flex items-center gap-2 font-titulo text-xl text-petroleo">
                <Check className="text-verdeAgua" aria-hidden /> Crise registrada.
              </p>
              <p className="-mt-6 text-textoSecundario">Obrigada por compartilhar. Isso vai ajudar na sua próxima sessão.</p>
            </Bloco>
          )}
          <form onSubmit={salvar} className="space-y-5">
            <Bloco titulo="A crise">
              <Campo rotulo="Quando aconteceu?" id="quando" type="datetime-local" required value={form.ocorridoEm} onChange={(e) => muda('ocorridoEm')(e.target.value)} />
              <BarraEscala id="intensidade" rotulo="Qual foi a intensidade?" minimo="Leve" maximo="Extrema" valor={form.intensidade} onChange={muda('intensidade')} />
              <EscolhaUnica nome="duracao" legenda="Quanto tempo durou, mais ou menos?" opcoes={CRISE_DURACAO} valor={form.duracao} onChange={muda('duracao')} colunas={4} />
              <EscolhaUnica nome="lugar" legenda="Onde você estava?" opcoes={CRISE_LUGAR} valor={form.lugar} onChange={muda('lugar')} colunas={3} />
              <EscolhaMultipla legenda="O que você sentiu?" ajuda="Marque quantas quiser." opcoes={CRISE_SINTOMAS} valores={form.sintomas} onChange={muda('sintomas')} />
            </Bloco>
            <Bloco titulo="O que você fez">
              <EscolhaMultipla legenda="O que você fez para atravessar?" ajuda="Marque quantas quiser." opcoes={CRISE_ESTRATEGIAS} valores={form.estrategias} onChange={muda('estrategias')} />
              <Campo
                rotulo="O que ajudou, nem que fosse um pouco?"
                id="ajudou"
                multilinha
                maxLength={2000}
                placeholder="Opcional. Escreva com suas palavras."
                value={form.ajudou}
                onChange={(e) => muda('ajudou')(e.target.value)}
              />
            </Bloco>
            {erro && <p className="px-1 text-sm text-alerta" role="alert">{erro}</p>}
            <Botao type="submit" className="w-full py-3.5 text-base shadow-cartao" disabled={enviando}>
              {enviando ? 'Salvando…' : 'Salvar registro'}
            </Botao>
          </form>

          {crises.length > 0 && (
            <Bloco titulo="Crises registradas">
              <SeletorDeDia
                rotulo="Escolha uma crise"
                convite="Escolha uma crise"
                itens={crises}
                campoData="ocorridoEm"
                formatarOpcao={(iso, c) =>
                  `${new Date(iso).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · ${c.intensidade}/10`
                }
                renderItem={(c) => (
                  <>
                    <Linha rotulo="Intensidade">{c.intensidade}/10</Linha>
                    {c.duracao && <Linha rotulo="Duração">{rotuloDe(CRISE_DURACAO, c.duracao)}</Linha>}
                    {c.lugar && <Linha rotulo="Onde">{rotuloDe(CRISE_LUGAR, c.lugar)}</Linha>}
                    {c.sintomas.length > 0 && <Linha rotulo="Sentiu">{c.sintomas.map((s) => rotuloDe(CRISE_SINTOMAS, s)).join(', ')}</Linha>}
                    {c.estrategias.length > 0 && <Linha rotulo="Fez">{c.estrategias.map((s) => rotuloDe(CRISE_ESTRATEGIAS, s)).join(', ')}</Linha>}
                    {c.ajudou && <Linha rotulo="O que ajudou">{c.ajudou}</Linha>}
                  </>
                )}
              />
            </Bloco>
          )}
        </>
      )}
    </Pagina>
  )
}
