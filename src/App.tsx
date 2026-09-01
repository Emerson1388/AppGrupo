import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom"
import { AppProvider, useApp } from "./context/AppContext"
import { ThemeProvider } from "./context/ThemeContext"
import { Layout } from "./components/Layout"
import { Login } from "./pages/Login"
import { Cadastro } from "./pages/Cadastro"
import { Feed } from "./pages/Feed"
import { Agenda } from "./pages/Agenda"
import { Calendario } from "./pages/Calendario"
import { TreinoDetalhe } from "./pages/TreinoDetalhe"
import { Ranking } from "./pages/Ranking"
import { Perfil } from "./pages/Perfil"
import { NovoTreino } from "./pages/NovoTreino"
import { Sugestoes } from "./pages/Sugestoes"
import { CheckinQr } from "./pages/CheckinQr"

import { Convite } from "./pages/Convite"
import { Mensagens } from "./pages/Mensagens"
import { Conversa } from "./pages/Conversa"
import { Membros } from "./pages/Membros"
import { CookieNotice } from "./components/CookieNotice"
import { VerificarEmail } from "./pages/VerificarEmail"
import { ConfirmarEmail } from "./pages/ConfirmarEmail"
import { EsqueciSenha } from "./pages/EsqueciSenha"
import { RedefinirSenha } from "./pages/RedefinirSenha"
import { AuthCallback } from "./pages/AuthCallback"
import { Privacidade } from "./pages/Privacidade"
import { Termos } from "./pages/Termos"

function Guard() {
  const { me } = useApp()
  const location = useLocation()
  if (!me) return <Navigate to="/g/plasts-run" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/verificar-email" element={<VerificarEmail />} />
            <Route path="/confirmar-email" element={<ConfirmarEmail />} />
            <Route path="/esqueci-senha" element={<EsqueciSenha />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/privacidade" element={<Privacidade />} />
            <Route path="/termos" element={<Termos />} />
            <Route path="/g/:slug" element={<Convite />} />
            <Route element={<Guard />}>
              <Route path="/checkin/:token" element={<CheckinQr />} />
              <Route element={<Layout />}>
                <Route path="/" element={<Feed />} />
                <Route path="/agenda" element={<Agenda />} />
                <Route path="/agenda/:id" element={<TreinoDetalhe />} />
                <Route path="/corridas" element={<Calendario />} />
                <Route path="/ranking" element={<Ranking />} />
                <Route path="/perfil" element={<Perfil />} />
                <Route path="/perfil/:id" element={<Perfil />} />
                <Route path="/novo-treino" element={<NovoTreino />} />
                <Route path="/sugestoes" element={<Sugestoes />} />
                <Route path="/mensagens" element={<Mensagens />} />
                <Route path="/mensagens/:id" element={<Conversa />} />
                <Route path="/membros" element={<Membros />} />
              </Route>
            </Route>
          </Routes>
          <CookieNotice />
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  )
}
