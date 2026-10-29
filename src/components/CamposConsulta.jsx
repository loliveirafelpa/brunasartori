// Campos do horário fixo da consulta: dia da semana, horário, frequência e, no quinzenal,
// a data da próxima sessão (para saber em quais semanas ela cai). Usado no cadastro e na ficha.
// `valor`: { diaSemana, hora, frequencia, referencia } — diaSemana '' = sem horário definido.
import { DIAS_SEMANA, FREQUENCIAS_CONSULTA, proximoDiaDaSemana } from '../data/consulta'
import { diaDaSemana, hojeLocal } from '../lib/datas'

const campo =
  'mt-1.5 w-full rounded-xl border border-borda/70 bg-papel px-4 py-3 text-texto focus:border-petroleo focus:bg-branco disabled:opacity-50'

export default function CamposConsulta({ id = 'consulta', valor, onChange }) {
  const muda = (mudancas) => onChange({ ...valor, ...mudancas })
  const semDia = valor.diaSemana === ''

  function mudaDia(e) {
    const diaSemana = e.target.value
    // No quinzenal, a data da próxima sessão acompanha o dia escolhido.
    const referencia = diaSemana !== '' && valor.frequencia === 'quinzenal' ? proximoDiaDaSemana(Number(diaSemana)) : valor.referencia
    muda({ diaSemana, referencia })
  }

  function mudaFrequencia(frequencia) {
    const referencia = frequencia === 'quinzenal' && !valor.referencia && !semDia ? proximoDiaDaSemana(Number(valor.diaSemana)) : valor.referencia
    muda({ frequencia, referencia })
  }

  // Escolher a data da próxima sessão também acerta o dia da semana.
  function mudaReferencia(e) {
    const referencia = e.target.value
    muda(referencia ? { referencia, diaSemana: String(diaDaSemana(referencia)) } : { referencia })
  }

  return (
    <fieldset className="space-y-3">
      <legend className="font-interface text-sm font-semibold text-texto">Dia e horário da consulta</legend>
      <div className="grid grid-cols-[minmax(0,1fr),8rem] gap-3">
        <label className="block">
          <span className="sr-only">Dia da semana</span>
          <select id={`${id}-dia`} value={valor.diaSemana} onChange={mudaDia} className={campo}>
            <option value="">Sem horário fixo</option>
            {DIAS_SEMANA.map((d) => (
              <option key={d.valor} value={d.valor}>
                {d.plural}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Horário</span>
          <input
            id={`${id}-hora`}
            type="time"
            step={900}
            disabled={semDia}
            required={!semDia}
            value={valor.hora}
            onChange={(e) => muda({ hora: e.target.value })}
            className={campo}
          />
        </label>
      </div>

      {!semDia && (
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          <div className="flex rounded-full border border-borda bg-branco p-1" role="group" aria-label="Frequência">
            {FREQUENCIAS_CONSULTA.map((f) => (
              <button
                key={f.valor}
                type="button"
                onClick={() => mudaFrequencia(f.valor)}
                aria-pressed={valor.frequencia === f.valor}
                className={`h-8 rounded-full px-4 font-interface text-xs font-semibold ${
                  valor.frequencia === f.valor ? 'bg-petroleo text-branco' : 'text-textoSecundario hover:text-petroleo'
                }`}
              >
                {f.rotulo}
              </button>
            ))}
          </div>
          {valor.frequencia === 'quinzenal' && (
            <label className="block font-interface text-xs font-semibold text-textoSecundario">
              Próxima sessão
              <input
                id={`${id}-referencia`}
                type="date"
                min={hojeLocal()}
                required
                value={valor.referencia}
                onChange={mudaReferencia}
                className="mt-1 block rounded-xl border border-borda/70 bg-papel px-3 py-1.5 font-corpo text-sm font-normal text-texto focus:border-petroleo focus:bg-branco"
              />
            </label>
          )}
        </div>
      )}
      <p className="text-xs text-textoSecundario">
        {semDia
          ? 'Com o horário definido, a lista de pacientes pode ser ordenada pela consulta mais próxima.'
          : valor.frequencia === 'quinzenal'
            ? 'A data da próxima sessão define em quais semanas a consulta cai.'
            : 'Usado para ordenar a lista de pacientes pela consulta mais próxima.'}
      </p>
    </fieldset>
  )
}
