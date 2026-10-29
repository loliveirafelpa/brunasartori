// Perguntas de um módulo/protocolo no check-in, montadas a partir de data/modulos.js.
// `respostas` é o objeto do módulo (ex.: { fumou: true, quantidade: 8 }).
import { perguntaVisivel, SIM_NAO } from '../data/modulos'
import EscolhaUnica from './EscolhaUnica'
import EscolhaMultipla from './EscolhaMultipla'
import BarraEscala from './BarraEscala'
import Campo from './Campo'

// Opção "exclusiva" (ex.: "Nada disso"): marcá-la desmarca as outras, e vice-versa.
function comExclusiva(opcoes, anteriores, novos) {
  const exclusivas = opcoes.filter((o) => o.exclusiva).map((o) => o.valor)
  const recem = novos.find((v) => !anteriores.includes(v))
  if (recem !== undefined && exclusivas.includes(recem)) return [recem]
  return novos.filter((v) => !exclusivas.includes(v))
}

export default function PerguntasModulo({ modulo, respostas = {}, onChange }) {
  const muda = (id) => (valor) => onChange({ ...respostas, [id]: valor })

  return modulo.perguntas
    .filter((p) => perguntaVisivel(p, respostas))
    .map((p) => {
      const id = `${modulo.id}-${p.id}`
      const valor = respostas[p.id]
      switch (p.tipo) {
        case 'simnao':
          return (
            <div key={id}>
              <EscolhaUnica nome={id} legenda={p.rotulo} opcoes={SIM_NAO} valor={valor} onChange={muda(p.id)} colunas={2} />
              {p.ajuda && <p className="mt-2 text-sm text-textoSecundario">{p.ajuda}</p>}
            </div>
          )
        case 'unica':
          return (
            <div key={id}>
              <EscolhaUnica
                nome={id}
                legenda={p.rotulo}
                opcoes={p.opcoes}
                valor={valor}
                onChange={muda(p.id)}
                colunas={p.colunas ?? Math.min(p.opcoes.length, 5)}
              />
              {p.ajuda && <p className="mt-2 text-sm text-textoSecundario">{p.ajuda}</p>}
            </div>
          )
        case 'multipla':
          return (
            <EscolhaMultipla
              key={id}
              legenda={p.rotulo}
              ajuda={p.ajuda ?? 'Marque quantas quiser.'}
              opcoes={p.opcoes}
              valores={valor ?? []}
              onChange={(novos) => muda(p.id)(comExclusiva(p.opcoes, valor ?? [], novos))}
            />
          )
        case 'escala':
          return (
            <BarraEscala
              key={id}
              id={id}
              rotulo={p.rotulo}
              ajuda={p.ajuda}
              minimo={p.minimo}
              maximo={p.maximo}
              opcional
              valor={valor ?? null}
              onChange={muda(p.id)}
            />
          )
        case 'hora':
          return (
            <div key={id}>
              <label htmlFor={id} className="font-titulo text-lg leading-snug text-petroleo">
                {p.rotulo}
              </label>
              <input
                id={id}
                type="time"
                value={valor ?? ''}
                onChange={(e) => muda(p.id)(e.target.value || null)}
                className="mt-3 block w-40 rounded-xl border border-borda/70 bg-papel px-4 py-3 font-interface text-texto focus:border-petroleo focus:bg-branco"
              />
            </div>
          )
        case 'texto':
          return (
            <Campo
              key={id}
              id={id}
              rotulo={p.rotulo}
              ajuda={p.ajuda}
              multilinha
              rows={3}
              maxLength={200}
              value={valor ?? ''}
              onChange={(e) => muda(p.id)(e.target.value || null)}
            />
          )
        default:
          return null
      }
    })
}
