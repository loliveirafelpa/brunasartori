import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from './lib/AuthContext'
import Logo from './components/Logo'
import AvisoCrise from './components/AvisoCrise'

// Moldura da área logada: exige login e, para pacientes, o consentimento de dados de saúde.
export default function AppShell() {
  const { sessao, perfil, ehAdmin, consentiu, carregando, sair } = useAuth()
  const { pathname } = useLocation()

  if (carregando || (sessao && !perfil)) {
    return <p className="p-10 text-center text-textoSecundario">Carregando…</p>
  }
  if (!sessao) return <Navigate to="/entrar" replace />
  if (!ehAdmin && !consentiu && pathname !== '/app/consentimento') {
    return <Navigate to="/app/consentimento" replace />
  }

  const linkClasse = ({ isActive }) =>
    `font-interface text-sm font-semibold ${isActive ? 'text-petroleo underline underline-offset-4' : 'text-textoSecundario hover:text-petroleo'}`

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-borda bg-branco">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo tamanho={40} />
            <nav className="flex flex-wrap gap-x-4 gap-y-1">
              {ehAdmin ? (
                <NavLink to="/app/admin" className={linkClasse}>Pacientes</NavLink>
              ) : (
                <>
                  <NavLink to="/app" end className={linkClasse}>Início</NavLink>
                  <NavLink to="/app/checkin" className={linkClasse}>Check-in</NavLink>
                  <NavLink to="/app/semana" className={linkClasse}>Semana</NavLink>
                  {perfil.registroPensamentosAtivo && (
                    <NavLink to="/app/pensamentos" className={linkClasse}>Pensamentos</NavLink>
                  )}
                </>
              )}
            </nav>
          </div>
          <button onClick={sair} className="flex items-center gap-1 font-interface text-sm text-textoSecundario hover:text-petroleo">
            <LogOut size={16} aria-hidden /> Sair
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      {!ehAdmin && (
        <footer className="mx-auto w-full max-w-xl px-4 pb-8">
          <AvisoCrise />
        </footer>
      )}
    </div>
  )
}
