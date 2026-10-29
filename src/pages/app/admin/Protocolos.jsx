// Aba "Protocolos" do painel do paciente: liga/desliga módulos e, dentro deles, o questionário
// (com a frequência e o "Pedir agora"), e mostra as crises registradas.
// As respostas na íntegra (módulos dia a dia e questionários item a item) ficam na aba "Detalhamento".
import { useState } from 'react'
import { ClipboardList, Send } from 'lucide-react'
import { definirEscala, definirModulo } from '../../../lib/perfisApi'
import { formatarDia } from '../../../lib/sintese'
import { hojeLocal } from '../../../lib/datas'
import { ESCALAS, FREQUENCIAS, escalaPendente, proximaAplicacao } from '../../../data/escalas'
import { CRISE_DURACAO, CRISE_ESTRATEGIAS, CRISE_LUGAR, CRISE_SINTOMAS, GRUPOS, MODULOS } from '../../../data/modulos'

const rotuloDe = (lista, v) => lista.find((o) => o.valor === v)?.rotulo ?? v
const dataCurta = (iso) => formatarDia(iso, { day: '2-digit', month: '2-digit', year: '2-digit' })

function Interruptor({ ligado, onChange, disabled, rotulo }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      disabled={disabled}
      onClick={() => onChange(!ligado)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${ligado ? 'bg-petroleo' : 'bg-borda'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-branco shadow transition-all ${ligado ? 'left-[1.375rem]' : 'left-0.5'}`} />
    </button>
  )
}

// Questionário dentro de um módulo ligado: opcional, com a frequência escolhida pela psicóloga.
// Ligar já pede uma primeira aplicação; "Pedir agora" pede outra fora do ritmo combinado.
function EscalaDoModulo({ perfil, escala, ultimo, onAlterado }) {
  const config = perfil.escalas[escala.id]
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const pendente = escalaPendente(config, ultimo, hojeLocal())
  const proxima = proximaAplicacao(config, ultimo)

  async function salvar(novo) {
    setSalvando(true)
    setErro('')
    try {
      await definirEscala(perfil.id, escala.id, novo)
      const escalas = { ...perfil.escalas }
      if (novo) escalas[escala.id] = novo
      else delete escalas[escala.id]
      onAlterado({ escalas })
    } catch {
      setErro('Não foi possível alterar agora.')
    } finally {
      setSalvando(false)
    }
  }

  const agoraIso = () => new Date().toISOString()
  let situacao = ''
  if (config) {
    if (pendente) situacao = `Aparece agora no Início do paciente, até ele responder.${ultimo ? ` Última resposta em ${dataCurta(ultimo.data)}.` : ''}`
    else if (config.frequencia === 'unica') situacao = `Respondido em ${dataCurta(ultimo.data)}. Para aplicar de novo, use “Pedir agora”.`
    else situacao = `Última resposta em ${dataCurta(ultimo.data)} · a próxima aparece a partir de ${dataCurta(proxima)}.`
  }

  return (
    <div className="mt-3 rounded-xl bg-papel p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 text-sm">
          <ClipboardList size={16} className="shrink-0 text-petroleo" aria-hidden />
          <span>
            <span className="font-interface font-semibold text-texto">Aplicar {escala.nome}</span>
            <span className="block text-xs text-textoSecundario sm:inline"><span className="hidden sm:inline"> · </span>opcional, {escala.itens.length} perguntas</span>
          </span>
        </p>
        <Interruptor
          rotulo={`Aplicar ${escala.nome}`}
          ligado={Boolean(config)}
          disabled={salvando}
          onChange={(ativo) => salvar(ativo ? { frequencia: escala.intervaloDias, ativadaEm: agoraIso(), pedidoEm: null } : null)}
        />
      </div>
      {config && (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label htmlFor={`freq-${escala.id}`} className="sr-only">Frequência</label>
            <select
              id={`freq-${escala.id}`}
              value={config.frequencia}
              disabled={salvando}
              onChange={(e) => salvar({ ...config, frequencia: e.target.value === 'unica' ? 'unica' : Number(e.target.value) })}
              className="rounded-full border border-borda bg-branco px-3 py-1.5 font-interface text-xs font-semibold text-petroleo"
            >
              {FREQUENCIAS.map((f) => (
                <option key={f.valor} value={f.valor}>{f.rotulo}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => salvar({ ...config, pedidoEm: agoraIso() })}
              disabled={salvando || pendente}
              className="flex items-center gap-1.5 rounded-full border border-petroleo px-3 py-1.5 font-interface text-xs font-semibold text-petroleo hover:bg-nevoa disabled:border-borda disabled:text-textoSecundario disabled:hover:bg-transparent"
            >
              <Send size={12} aria-hidden /> {pendente ? 'Aguardando resposta' : 'Pedir agora'}
            </button>
          </div>
          <p className="mt-2 text-xs text-textoSecundario">{situacao}</p>
        </>
      )}
      {erro && <p className="mt-2 text-xs text-alerta">{erro}</p>}
    </div>
  )
}

export function ModulosDoPaciente({ perfil, escalas, onAlterado }) {
  const [salvando, setSalvando] = useState(null)
  const [erro, setErro] = useState('')

  async function alternar(m, ativo) {
    setSalvando(m.id)
    setErro('')
    try {
      await definirModulo(perfil.id, m.id, ativo)
      onAlterado({ modulos: { ...perfil.modulos, [m.id]: ativo } })
    } catch {
      setErro('Não foi possível alterar agora.')
    } finally {
      setSalvando(null)
    }
  }

  return (
    <section className="rounded-2xl bg-branco p-5 shadow-sm sm:p-6">
      <h2 className="text-xl sm:text-2xl">Módulos e protocolos</h2>
      <p className="mt-1 text-sm text-textoSecundario">
        Ligue o que fizer sentido para o momento do paciente. Cada um acrescenta poucas perguntas ao check-in e aparece no resumo.
        Alguns têm um questionário opcional, ligado à parte, com a frequência que você escolher. Desligar não apaga o que já foi registrado.
      </p>
      {erro && <p className="mt-2 text-sm text-alerta">{erro}</p>}
      {GRUPOS.map((g) => (
        <div key={g.id} className="mt-5">
          <p className="font-interface text-xs font-semibold uppercase tracking-wider text-petroleo">{g.rotulo}</p>
          <ul className="mt-2 divide-y divide-borda">
            {MODULOS.filter((m) => m.grupo === g.id).map((m) => (
              <li key={m.id} className="py-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-interface text-sm font-semibold text-texto">{m.nome}</p>
                    <p className="mt-0.5 text-sm text-textoSecundario">{m.resumo}</p>
                    {m.publico && <p className="mt-1 text-xs text-atencao">{m.publico}</p>}
                  </div>
                  <Interruptor
                    rotulo={m.nome}
                    ligado={Boolean(perfil.modulos[m.id])}
                    disabled={salvando === m.id}
                    onChange={(ativo) => alternar(m, ativo)}
                  />
                </div>
                {m.escala && perfil.modulos[m.id] && (
                  <EscalaDoModulo
                    perfil={perfil}
                    escala={ESCALAS[m.escala]}
                    ultimo={escalas.find((e) => e.escala.id === m.escala)?.ultimo}
                    onAlterado={onAlterado}
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}

function Crises({ crises }) {
  return (
    <section className="rounded-2xl bg-branco p-5 shadow-sm sm:p-6">
      <h2 className="text-xl sm:text-2xl">Crises registradas</h2>
      {!crises.length ? (
        <p className="mt-2 text-textoSecundario">Nenhuma crise registrada neste período.</p>
      ) : (
        <ul className="mt-4 divide-y divide-borda">
          {crises.map((c) => (
            <li key={c.id} className="grid gap-1 py-3 text-sm sm:grid-cols-[10rem,1fr] sm:gap-6">
              <div>
                <p className="font-interface text-xs font-semibold capitalize text-petroleo">
                  {new Date(c.ocorridoEm).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="font-titulo text-2xl text-petroleo">
                  {c.intensidade}
                  <span className="text-sm text-textoSecundario">/10</span>
                </p>
              </div>
              <div className="space-y-0.5">
                <p>
                  {[c.duracao && rotuloDe(CRISE_DURACAO, c.duracao), c.lugar && rotuloDe(CRISE_LUGAR, c.lugar)].filter(Boolean).join(' · ')}
                </p>
                {c.sintomas.length > 0 && <p className="text-textoSecundario">Sentiu: {c.sintomas.map((s) => rotuloDe(CRISE_SINTOMAS, s).toLowerCase()).join(', ')}</p>}
                {c.estrategias.length > 0 && <p className="text-textoSecundario">Fez: {c.estrategias.map((s) => rotuloDe(CRISE_ESTRATEGIAS, s).toLowerCase()).join(', ')}</p>}
                {c.ajudou && <p className="italic">“{c.ajudou}”</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function Protocolos({ perfil, onPerfilAlterado, crises, escalas }) {
  return (
    <div className="space-y-8">
      <ModulosDoPaciente perfil={perfil} escalas={escalas} onAlterado={onPerfilAlterado} />
      {(perfil.modulos.crise || crises.length > 0) && <Crises crises={crises} />}
    </div>
  )
}
