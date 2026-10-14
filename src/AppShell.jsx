import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { BrainCircuit, CalendarHeart, House, KeyRound, LogOut, ShieldCheck, Sprout, Users } from 'lucide-react'
import { useAuth } from './lib/AuthContext'
import Logo from './components/Logo'
import AvisoCrise from './components/AvisoCrise'

// Moldura da área logada: exige login e, para pacientes, o consentimento de dados de saúde.
// Paciente: cabeçalho petróleo que continua na faixa de título de cada tela e, no celular,
// navegação fixa embaixo. Admin: mesmo cabeçalho, conteúdo em contêiner largo.
export default function AppShell() {
  const { sessao, perfil, ehAdmin, consentiu, carregando, sair } = useAuth()
  const { pathname } = useLocation()

  if (carregando || (sessao && !perfil)) {
    return <p className="p-10 text-center text-textoSecundario">Carregando…</p>
  }
  if (!sessao) return <Navigate to="/entrar" replace />
  // Conta criada pela psicóloga com senha provisória: trocar antes de qualquer coisa.
  if (sessao.user.user_metadata?.trocar_senha) return <Navigate to="/definir-senha" replace />
  // Sem consentimento, o paciente ainda pode autorizar de novo ou cuidar dos próprios dados.
  if (!ehAdmin && !consentiu && !['/app/consentimento', '/app/meus-dados'].includes(pathname)) {
    return <Navigate to="/app/consentimento" replace />
  }

  const links = ehAdmin
    ? [{ to: '/app/admin', rotulo: 'Pacientes', Icone: Users }]
    : consentiu
      ? [
          { to: '/app', rotulo: 'Início', Icone: House, end: true },
          { to: '/app/checkin', rotulo: 'Check-in', Icone: CalendarHeart },
          { to: '/app/semana', rotulo: 'Semana', Icone: Sprout },
          ...(perfil.registroPensamentosAtivo ? [{ to: '/app/pensamentos', rotulo: 'Pensamentos', Icone: BrainCircuit }] : []),
        ]
      : []

  const navBaixo = !ehAdmin && links.length > 0

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-petroleo text-branco">
        <div className={`mx-auto flex items-center justify-between gap-4 px-4 py-3 ${ehAdmin ? 'max-w-5xl' : 'max-w-xl sm:max-w-3xl'}`}>
          <div className="flex items-center gap-3">
            <Logo tamanho={36} />
            <p className="hidden font-interface text-xs leading-tight text-nevoa min-[380px]:block">
              Bruna Sartori
              <br />
              <span className="text-nevoa/70">Psicologia</span>
            </p>
          </div>

          <nav aria-label="Principal" className={`${navBaixo ? 'hidden sm:flex' : 'flex'} items-center gap-5`}>
            {links.map(({ to, rotulo, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `border-b-2 py-1 font-interface text-sm font-semibold transition-colors ${
                    isActive ? 'border-verdeAgua text-branco' : 'border-transparent text-nevoa hover:text-branco'
                  }`
                }
              >
                {rotulo}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {ehAdmin && (
              <NavLink
                to="/app/admin/senha"
                aria-label="Alterar senha"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 font-interface text-xs font-semibold hover:text-branco ${isActive ? 'text-branco' : 'text-nevoa'}`
                }
              >
                <KeyRound size={15} aria-hidden /> <span className="hidden sm:inline">Senha</span>
              </NavLink>
            )}
            {!ehAdmin && (
              <NavLink
                to="/app/meus-dados"
                aria-label="Meus dados"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 font-interface text-xs font-semibold hover:text-branco ${isActive ? 'text-branco' : 'text-nevoa'}`
                }
              >
                <ShieldCheck size={15} aria-hidden /> <span className="hidden sm:inline">Meus dados</span>
              </NavLink>
            )}
            <button onClick={sair} className="flex items-center gap-1.5 font-interface text-xs font-semibold text-nevoa hover:text-branco">
              <LogOut size={15} aria-hidden /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className={`flex-1 ${navBaixo ? 'pb-24 sm:pb-0' : ''}`}>
        {ehAdmin ? (
          <div className="mx-auto w-full max-w-5xl px-4 py-8">
            <Outlet />
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      {!ehAdmin && (
        <footer className={`px-4 pb-6 pt-2 ${navBaixo ? 'mb-20 sm:mb-0' : ''}`}>
          <AvisoCrise compacto />
          <p className="mt-2 text-center text-xs">
            <Link to="/privacidade" className="text-textoSecundario underline hover:text-petroleo">
              Política de privacidade
            </Link>
          </p>
        </footer>
      )}

      {navBaixo && (
        <nav
          aria-label="Principal"
          className="fixed inset-x-0 bottom-0 z-20 border-t border-borda bg-branco/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
        >
          <div className="mx-auto grid max-w-xl" style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}>
            {links.map((link) => {
              const Icone = link.Icone
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `relative flex flex-col items-center gap-1 py-2.5 font-interface text-[11px] font-semibold ${
                      isActive ? 'text-petroleo' : 'text-textoSecundario'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-verdeAgua" aria-hidden />}
                      <Icone size={22} strokeWidth={isActive ? 2.25 : 1.75} aria-hidden />
                      {link.rotulo}
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
