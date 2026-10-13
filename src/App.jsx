import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import AppShell from './AppShell'
import Login from './pages/Login'
import DefinirSenha from './pages/DefinirSenha'
import Privacidade from './pages/Privacidade'
import MeusDados from './pages/app/MeusDados'
import Consentimento from './pages/app/Consentimento'
import Inicio from './pages/app/Inicio'
import CheckinDiario from './pages/app/CheckinDiario'
import ReflexaoSemanal from './pages/app/ReflexaoSemanal'
import RegistroPensamentos from './pages/app/RegistroPensamentos'
import Pacientes from './pages/app/admin/Pacientes'
import Paciente from './pages/app/admin/Paciente'
import NovoPaciente from './pages/app/admin/NovoPaciente'

// A checagem de verdade é o RLS no banco; isto só organiza a navegação.
function SomenteAdmin({ children }) {
  const { ehAdmin } = useAuth()
  return ehAdmin ? children : <Navigate to="/app" replace />
}

function SomentePaciente({ children }) {
  const { ehAdmin } = useAuth()
  return ehAdmin ? <Navigate to="/app/admin" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/entrar" element={<Login />} />
          <Route path="/definir-senha" element={<DefinirSenha />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/app" element={<AppShell />}>
            <Route index element={<SomentePaciente><Inicio /></SomentePaciente>} />
            <Route path="consentimento" element={<SomentePaciente><Consentimento /></SomentePaciente>} />
            <Route path="checkin" element={<SomentePaciente><CheckinDiario /></SomentePaciente>} />
            <Route path="semana" element={<SomentePaciente><ReflexaoSemanal /></SomentePaciente>} />
            <Route path="pensamentos" element={<SomentePaciente><RegistroPensamentos /></SomentePaciente>} />
            <Route path="meus-dados" element={<SomentePaciente><MeusDados /></SomentePaciente>} />
            <Route path="admin" element={<SomenteAdmin><Pacientes /></SomenteAdmin>} />
            <Route path="admin/pacientes/novo" element={<SomenteAdmin><NovoPaciente /></SomenteAdmin>} />
            <Route path="admin/pacientes/:id" element={<SomenteAdmin><Paciente /></SomenteAdmin>} />
          </Route>
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
