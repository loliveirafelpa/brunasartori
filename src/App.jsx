import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import AppShell from './AppShell'
import Login from './pages/Login'
import DefinirSenha from './pages/DefinirSenha'
import Consentimento from './pages/app/Consentimento'
import Inicio from './pages/app/Inicio'
import CheckinDiario from './pages/app/CheckinDiario'
import ReflexaoSemanal from './pages/app/ReflexaoSemanal'
import RegistroPensamentos from './pages/app/RegistroPensamentos'
import Pacientes from './pages/app/admin/Pacientes'

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
          <Route path="/app" element={<AppShell />}>
            <Route index element={<SomentePaciente><Inicio /></SomentePaciente>} />
            <Route path="consentimento" element={<SomentePaciente><Consentimento /></SomentePaciente>} />
            <Route path="checkin" element={<SomentePaciente><CheckinDiario /></SomentePaciente>} />
            <Route path="semana" element={<SomentePaciente><ReflexaoSemanal /></SomentePaciente>} />
            <Route path="pensamentos" element={<SomentePaciente><RegistroPensamentos /></SomentePaciente>} />
            <Route path="admin"element={<SomenteAdmin><Pacientes /></SomenteAdmin>} />
          </Route>
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
