import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { registrarConsentimentos } from '../../lib/consentimentosApi'
import { TEXTO_CONSENTIMENTO_SAUDE } from '../../data/textosLegais'
import Botao from '../../components/Botao'
import Bloco from '../../components/Bloco'
import Pagina, { Destaque } from '../../components/Pagina'

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
    <Pagina
      sobretitulo="Primeiro acesso"
      titulo={
        <>
          Antes de <Destaque>começar</Destaque>
        </>
      }
      descricao="Aqui você vai registrar como está se sentindo entre as sessões. Essas informações são suas e ajudam a conduzir o seu processo terapêutico."
    >
      <Bloco titulo="Como seus dados são tratados" icone={<ShieldCheck size={15} />}>
        <ul className="space-y-2.5 text-sm leading-relaxed">
          <li>Só você e a sua psicóloga podem ver o que você registra.</li>
          <li>Os dados são usados apenas para o seu acompanhamento. Nunca são vendidos nem compartilhados.</li>
          <li>Além da LGPD, tudo está protegido pelo sigilo profissional da Psicologia.</li>
          <li>Você pode baixar, apagar seus dados ou revogar este consentimento quando quiser, aqui no aplicativo.</li>
        </ul>
      </Bloco>

      <Bloco>
        <div className="space-y-3">
          <label className="flex cursor-pointer gap-3 rounded-2xl bg-papel p-4 text-sm leading-relaxed">
            <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-petroleo" checked={termos} onChange={(e) => setTermos(e.target.checked)} />
            <span>
              Li e aceito os termos de uso e a{' '}
              <Link to="/privacidade" target="_blank" className="font-semibold text-petroleo underline">
                política de privacidade
              </Link>
              .
            </span>
          </label>

          <label className="flex cursor-pointer gap-3 rounded-2xl border-2 border-salvia bg-branco p-4 text-sm leading-relaxed">
            <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-petroleo" checked={saude} onChange={(e) => setSaude(e.target.checked)} />
            <span>
              <strong className="font-interface text-petroleo">Consentimento para dados de saúde. </strong>
              {TEXTO_CONSENTIMENTO_SAUDE}
            </span>
          </label>
        </div>

        {erro && <p className="text-sm text-alerta" role="alert">{erro}</p>}
        <Botao onClick={confirmar} disabled={!termos || !saude || enviando} className="w-full py-3">
          {enviando ? 'Registrando…' : 'Concordo e quero começar'}
        </Botao>
      </Bloco>
    </Pagina>
  )
}
