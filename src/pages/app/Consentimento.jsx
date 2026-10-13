import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { registrarConsentimentos } from '../../lib/consentimentosApi'
import { TEXTO_CONSENTIMENTO_SAUDE } from '../../data/textosLegais'
import Botao from '../../components/Botao'

// Exibida no primeiro acesso do paciente, antes de qualquer registro.
// Os dois aceites são checkboxes separados (LGPD, Art. 11) e ficam gravados com data e hora.
export default function Consentimento() {
  const { usuario, recarregar } = useAuth()
  const navigate = useNavigate()
  const [termos, setTermos] = useState(false)
  const [saude, setSaude] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function confirmar() {
    setErro('')
    setEnviando(true)
    try {
      await registrarConsentimentos(usuario.id)
      await recarregar()
      navigate('/app', { replace: true })
    } catch {
      setErro('Não foi possível registrar agora. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl">Antes de começar</h1>
        <p className="mt-2 text-textoSecundario">
          Aqui você vai registrar como está se sentindo entre as sessões. Essas informações são suas e ajudam a
          conduzir o seu processo terapêutico. Por isso, cuidamos delas com sigilo.
        </p>
      </div>

      <div className="space-y-3 rounded-2xl bg-nevoa p-5 text-sm">
        <p className="flex items-center gap-2 font-interface font-semibold text-petroleo">
          <ShieldCheck size={18} aria-hidden /> Como seus dados são tratados
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Só você e a sua psicóloga podem ver o que você registra.</li>
          <li>Os dados são usados apenas para o seu acompanhamento. Nunca são vendidos nem compartilhados.</li>
          <li>Além da LGPD, tudo está protegido pelo sigilo profissional da Psicologia.</li>
          <li>Você pode baixar, apagar seus dados ou revogar este consentimento quando quiser, aqui no aplicativo.</li>
        </ul>
      </div>

      <label className="flex gap-3 rounded-2xl bg-branco p-4">
        <input type="checkbox" className="mt-1 h-5 w-5 accent-petroleo" checked={termos} onChange={(e) => setTermos(e.target.checked)} />
        <span>Li e aceito os termos de uso e a política de privacidade.</span>
      </label>

      <label className="flex gap-3 rounded-2xl border-2 border-salvia bg-branco p-4">
        <input type="checkbox" className="mt-1 h-5 w-5 accent-petroleo" checked={saude} onChange={(e) => setSaude(e.target.checked)} />
        <span>
          <strong className="font-interface text-petroleo">Consentimento para dados de saúde. </strong>
          {TEXTO_CONSENTIMENTO_SAUDE}
        </span>
      </label>

      {erro && <p className="text-sm text-alerta" role="alert">{erro}</p>}
      <Botao onClick={confirmar} disabled={!termos || !saude || enviando} className="w-full">
        {enviando ? 'Registrando…' : 'Concordo e quero começar'}
      </Botao>
    </section>
  )
}
