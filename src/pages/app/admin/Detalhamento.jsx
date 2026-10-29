// Aba "Detalhamento" do painel do paciente: tudo o que foi respondido, na íntegra.
// Check-in básico dia a dia, as respostas de cada módulo dia a dia e os questionários item a item.
// Os resumos e gráficos ficam nas outras abas; aqui é para conferir o detalhe.
import { useState } from 'react'
import { AlertTriangle, ChevronDown } from 'lucide-react'
import { formatarDia, rotuloEmocao, rotuloSituacao } from '../../../lib/sintese'
import { ESCALA_ENERGIA, ESCALA_SONO, HUMORES } from '../../../data/checkinOpcoes'
import { MODULOS, textoResposta } from '../../../data/modulos'

const decimal = (v, casas = 1) => (v === null ? '—' : v.toFixed(casas).replace('.', ','))
const dataCurta = (iso) => formatarDia(iso, { day: '2-digit', month: '2-digit', year: '2-digit' })

const rotuloEscala = (escala, v) => (v ? escala[v - 1] : '—')

function CheckinDiaADia({ dias, checkins }) {
  const porDia = Object.fromEntries(checkins.map((c) => [c.data, c]))
  return (
    <div className="overflow-x-auto rounded-2xl bg-branco shadow-sm">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="bg-petroleo font-interface text-xs uppercase tracking-wider text-nevoa">
          <tr>
            <th className="px-4 py-3">Dia</th>
            <th className="px-4 py-3">Humor</th>
            <th className="px-4 py-3">Emoção</th>
            <th className="px-4 py-3">Ansiedade</th>
            <th className="px-4 py-3">Sono</th>
            <th className="px-4 py-3">Energia</th>
            <th className="px-4 py-3">Movimento</th>
            <th className="px-4 py-3">Situações</th>
          </tr>
        </thead>
        <tbody>
          {[...dias].reverse().map((dia) => {
            const c = porDia[dia]
            if (!c) {
              return (
                <tr key={dia} className="border-b border-borda last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 font-interface text-xs font-semibold capitalize">{formatarDia(dia)}</td>
                  <td colSpan={7} className="px-4 py-3 italic text-textoSecundario">sem registro</td>
                </tr>
              )
            }
            const humor = HUMORES.find((h) => h.valor === c.humor)
            return [
              <tr key={dia} className={c.acontecimento ? '' : 'border-b border-borda last:border-0'}>
                <td className="whitespace-nowrap px-4 py-3 font-interface text-xs font-semibold capitalize">{formatarDia(dia)}</td>
                <td className="whitespace-nowrap px-4 py-3"><span aria-hidden>{humor.emoji}</span> {humor.rotulo}</td>
                <td className="px-4 py-3">{rotuloEmocao(c)}</td>
                <td className="px-4 py-3">{c.ansiedade === null ? '—' : `${c.ansiedade}/10`}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  {rotuloEscala(ESCALA_SONO, c.sonoQualidade)}
                  {c.sonoHoras !== null && <span className="text-textoSecundario"> · {decimal(c.sonoHoras)}h</span>}
                </td>
                <td className="px-4 py-3">{rotuloEscala(ESCALA_ENERGIA, c.energia)}</td>
                <td className="px-4 py-3">{c.exercicio === null ? '—' : c.exercicio ? 'Sim' : 'Não'}</td>
                <td className="px-4 py-3">
                  {c.situacoes.map((s) => (s === 'outra' && c.situacaoOutra ? c.situacaoOutra : rotuloSituacao(s))).join(', ') || '—'}
                </td>
              </tr>,
              c.acontecimento && (
                <tr key={`${dia}-acontecimento`} className="border-b border-borda last:border-0">
                  <td />
                  <td colSpan={7} className="px-4 pb-3 text-textoSecundario">
                    <span className="font-interface text-xs font-semibold text-petroleo">Acontecimento: </span>
                    {c.acontecimento}
                  </td>
                </tr>
              ),
            ]
          })}
        </tbody>
      </table>
    </div>
  )
}

// Respostas de um módulo dia a dia: uma linha por dia, uma coluna por pergunta.
function TabelaModulo({ modulo, dias, checkins }) {
  const porDia = Object.fromEntries(checkins.map((c) => [c.data, c.modulos?.[modulo.id]]))
  const comResposta = [...dias].reverse().filter((d) => porDia[d])
  return (
    <section className="space-y-3">
      <h2 className="text-xl sm:text-2xl">{modulo.nome}</h2>
      {!comResposta.length ? (
        <p className="text-textoSecundario">Sem respostas neste período.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-branco shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-petroleo font-interface text-xs uppercase tracking-wider text-nevoa">
              <tr>
                <th className="px-4 py-3">Dia</th>
                {modulo.perguntas.map((p) => (
                  <th key={p.id} className="px-4 py-3">{p.curto}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comResposta.map((dia) => (
                <tr key={dia} className="border-b border-borda last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 font-interface text-xs font-semibold capitalize">{formatarDia(dia)}</td>
                  {modulo.perguntas.map((p) => (
                    <td key={p.id} className="px-4 py-3">{textoResposta(p, porDia[dia][p.id]) ?? <span className="text-textoSecundario">—</span>}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// Respostas item a item de uma aplicação, com a pontuação do item na aplicação anterior para comparar.
function RespostasDetalhadas({ escala, historico }) {
  const [selecionada, setSelecionada] = useState(historico[0].id)
  const i = Math.max(0, historico.findIndex((h) => h.id === selecionada))
  const atual = historico[i]
  const antes = historico[i + 1]

  return (
    <div className="mt-4 border-t border-borda pt-4">
      {historico.length > 1 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Aplicação">
          {historico.map((h) => (
            <button
              key={h.id}
              type="button"
              aria-pressed={h.id === atual.id}
              onClick={() => setSelecionada(h.id)}
              className={`rounded-full px-3 py-1 font-interface text-xs font-semibold ${
                h.id === atual.id ? 'bg-petroleo text-branco' : 'bg-nevoa text-petroleo hover:bg-borda'
              }`}
            >
              {dataCurta(h.data)} · {h.total} pts
            </button>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs italic text-textoSecundario">{escala.instrucao}</p>
      <div className="mt-2 hidden grid-cols-[1fr,14rem,6rem] gap-4 font-interface text-xs font-semibold uppercase tracking-wider text-textoSecundario sm:grid">
        <span>Pergunta</span>
        <span>Resposta</span>
        <span className="text-right">Pontos</span>
      </div>
      <ol className="mt-1 divide-y divide-borda">
        {escala.itens.map((item, n) => {
          const pontos = atual.respostas[n]
          const opcao = item.opcoes.find((o) => o.pontos === pontos)
          const maximo = Math.max(...item.opcoes.map((o) => o.pontos))
          const risco = n === escala.itemRisco && pontos > 0
          const anterior = antes?.respostas[n]
          return (
            <li
              key={item.texto}
              className={`grid gap-1 py-2.5 sm:grid-cols-[1fr,14rem,6rem] sm:items-center sm:gap-4 ${risco ? '-mx-2 rounded-lg bg-alertaFundo px-2' : ''}`}
            >
              <p className="text-sm">
                <span className="mr-1 font-interface text-xs font-semibold text-petroleo">{n + 1}.</span>
                {item.texto}
              </p>
              <p className={`flex items-start gap-1.5 text-sm font-semibold ${risco ? 'text-alerta' : 'text-texto'}`}>
                {risco && <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />}
                {opcao?.rotulo ?? '—'}
              </p>
              <p className="text-xs text-textoSecundario sm:text-right">
                <span className="font-interface font-semibold text-petroleo">{pontos}</span> de {maximo}
                {anterior !== undefined && anterior !== pontos && <span className="ml-2 sm:ml-0 sm:block">antes: {anterior}</span>}
              </p>
            </li>
          )
        })}
      </ol>
      <p className="mt-2 border-t border-borda pt-2 text-right font-interface text-sm font-semibold text-petroleo">
        Total: {atual.total} de {escala.maximo}
        {antes && <span className="font-corpo text-xs font-normal text-textoSecundario"> · antes: {antes.total} em {dataCurta(antes.data)}</span>}
      </p>
    </div>
  )
}

// Questionários: último resultado, o anterior e o histórico, com a referência do instrumento.
// "Ver respostas" abre o questionário item a item (o cartão passa a ocupar a largura toda).
function Questionarios({ escalas }) {
  const [aberto, setAberto] = useState(null)
  if (!escalas.length) return null
  return (
    <section className="rounded-2xl bg-branco p-5 shadow-sm sm:p-6">
      <h2 className="text-xl sm:text-2xl">Questionários</h2>
      <p className="mt-1 text-sm text-textoSecundario">Instrumentos de rastreio respondidos pelo paciente, com todas as aplicações (não só as do período). A pontuação não é diagnóstico e o paciente não a vê.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {escalas.map(({ escala, ultimo, anterior, historico }) => {
          const acima = ultimo.total >= escala.corte
          const risco = escala.itemRisco !== undefined && ultimo.respostas[escala.itemRisco] > 0
          const detalhe = aberto === escala.id
          return (
            <div key={escala.id} className={`rounded-xl border border-borda p-4 ${detalhe ? 'md:col-span-2' : ''}`}>
              <p className="font-interface text-xs font-semibold uppercase tracking-wider text-petroleo">{escala.nome}</p>
              <p className="mt-2 font-titulo text-3xl leading-none text-petroleo">
                {ultimo.total}
                <span className="ml-0.5 font-corpo text-sm text-textoSecundario">/{escala.maximo}</span>
              </p>
              <p className="mt-1 text-xs text-textoSecundario">
                em {dataCurta(ultimo.data)}
                {anterior && ` · anterior: ${anterior.total} em ${dataCurta(anterior.data)}`}
              </p>
              {acima && <p className="mt-2 rounded-lg bg-atencaoFundo px-2.5 py-1.5 text-xs text-atencao">Na faixa a partir do ponto de corte de referência ({escala.corte}).</p>}
              {risco && (
                <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-alertaFundo px-2.5 py-1.5 text-xs text-alerta">
                  <AlertTriangle size={13} className="mt-px shrink-0" aria-hidden /> Item sobre pensar em se machucar marcado.
                </p>
              )}
              <p className="mt-2 text-xs text-textoSecundario">{escala.referencia}</p>
              {historico.length > 1 && (
                <div className="mt-3 flex items-end gap-1.5" aria-label="Histórico de pontuações">
                  {[...historico].reverse().map((h) => (
                    <div key={h.id} className="flex flex-1 flex-col items-center gap-1">
                      <span className="font-interface text-xs font-semibold text-petroleo">{h.total}</span>
                      <span
                        className={`w-full rounded-t ${h.total >= escala.corte ? 'bg-atencao/70' : 'bg-verdeAgua'}`}
                        style={{ height: `${Math.max(4, (h.total / escala.maximo) * 56)}px` }}
                      />
                      <span className="text-xs text-textoSecundario">{formatarDia(h.data, { day: '2-digit', month: '2-digit' })}</span>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                aria-expanded={detalhe}
                onClick={() => setAberto(detalhe ? null : escala.id)}
                className="-ml-3 mt-3 inline-flex h-8 items-center gap-1.5 rounded-full px-3 font-interface text-xs font-semibold text-petroleo hover:bg-nevoa"
              >
                {detalhe ? 'Fechar respostas' : 'Ver respostas item a item'}
                <ChevronDown size={14} className={`transition-transform ${detalhe ? 'rotate-180' : ''}`} aria-hidden />
              </button>
              {detalhe && <RespostasDetalhadas escala={escala} historico={historico} />}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default function Detalhamento({ perfil, dias, checkins, escalas }) {
  const modulos = MODULOS.filter((m) => perfil.modulos[m.id] || checkins.some((c) => c.modulos?.[m.id]))
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl">Check-in dia a dia</h2>
        <CheckinDiaADia dias={dias} checkins={checkins} />
      </section>
      {modulos.map((m) => (
        <TabelaModulo key={m.id} modulo={m} dias={dias} checkins={checkins} />
      ))}
      <Questionarios escalas={escalas} />
    </div>
  )
}
