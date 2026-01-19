import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import Home from "./pages/Home.jsx";
import Destaques from "./pages/Destaques.jsx";
import Lancamentos from "./pages/Lancamentos.jsx";
import PropertyDetail from "./pages/PropertyDetail.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import BuscaDetalhada from "./pages/BuscaDetalhada.jsx";
import BuscaMapa from "./pages/BuscaMapa.jsx";
import Anunciar from "./pages/Anunciar.jsx";
import SolicitarImovel from "./pages/SolicitarImovel.jsx";
import AnunciantePerfil from "./pages/AnunciantePerfil.jsx";

// User Admin Pages
import Dashboard from "./pages/admin/Dashboard.jsx";
import NovoImovel from "./pages/admin/NovoImovel.jsx";
import EditarImovel from "./pages/admin/EditarImovel.jsx";
import GerenciarImoveis from "./pages/admin/GerenciarImoveis.jsx";
import Perfil from "./pages/admin/Perfil.jsx";
import Notificacoes from "./pages/admin/Notificacoes.jsx";
import MinhasVisitas from "./pages/admin/MinhasVisitas.jsx";

// Master Admin Pages
import AdminMasterDashboard from "./pages/admin/AdminMasterDashboard.jsx";
import AdminSeniorDashboard from "./pages/admin/AdminSeniorDashboard.jsx";
import AdminGerenciarUsuarios from "./pages/admin/AdminGerenciarUsuarios.jsx";
import AdminGerenciarImoveis from "./pages/admin/AdminGerenciarImoveis.jsx";
import AdminGerenciarBanners from "./pages/admin/AdminGerenciarBanners.jsx";
import AdminMuralOportunidades from "./pages/admin/MuralOportunidades.jsx";

// Parcerias Pages
import ParceriasHub from "./pages/parcerias/ParceriasHub.jsx";
import PublicarDemanda from "./pages/parcerias/PublicarDemanda.jsx";
import MuralOportunidades from "./pages/parcerias/MuralOportunidades.jsx";
import MinhasDemandas from "./pages/parcerias/MinhasDemandas.jsx";
import DetalheDemanda from "./pages/parcerias/DetalheDemanda.jsx";
import VerPropostas from "./pages/parcerias/VerPropostas.jsx";

import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/destaques" element={<Destaques />} />
            <Route path="/lancamentos" element={<Lancamentos />} />
            <Route path="/imovel/:id" element={<PropertyDetail />} />
            <Route path="/anunciante/:userId" element={<AnunciantePerfil />} />
            <Route path="/cadastro" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/busca-detalhada" element={<BuscaDetalhada />} />
            <Route path="/busca-mapa" element={<BuscaMapa />} />
            <Route path="/anunciar" element={<Anunciar />} />
            <Route path="/solicitar" element={<SolicitarImovel />} />
            
            {/* Protected User Routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/imoveis/novo" element={
              <ProtectedRoute>
                <NovoImovel />
              </ProtectedRoute>
            } />
            <Route path="/admin/imoveis" element={
              <ProtectedRoute>
                <GerenciarImoveis />
              </ProtectedRoute>
            } />
            <Route path="/admin/imoveis/editar/:id" element={
              <ProtectedRoute>
                <EditarImovel />
              </ProtectedRoute>
            } />
            <Route path="/admin/perfil" element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            } />
            <Route path="/admin/notificacoes" element={
              <ProtectedRoute>
                <Notificacoes />
              </ProtectedRoute>
            } />
            <Route path="/admin/visitas" element={
              <ProtectedRoute>
                <MinhasVisitas />
              </ProtectedRoute>
            } />
            
            {/* Parcerias Routes */}
            <Route path="/admin/parcerias" element={
              <ProtectedRoute>
                <ParceriasHub />
              </ProtectedRoute>
            } />
            <Route path="/admin/parcerias/publicar" element={
              <ProtectedRoute>
                <PublicarDemanda />
              </ProtectedRoute>
            } />
            <Route path="/admin/parcerias/mural" element={
              <ProtectedRoute>
                <MuralOportunidades />
              </ProtectedRoute>
            } />
            <Route path="/admin/parcerias/minhas" element={
              <ProtectedRoute>
                <MinhasDemandas />
              </ProtectedRoute>
            } />
            <Route path="/admin/parcerias/demanda/:id" element={
              <ProtectedRoute>
                <DetalheDemanda />
              </ProtectedRoute>
            } />
            <Route path="/admin/parcerias/propostas/:demandId" element={
              <ProtectedRoute>
                <VerPropostas />
              </ProtectedRoute>
            } />

            {/* Master Admin Routes */}
            <Route path="/admin/master" element={
              <ProtectedRoute>
                <AdminMasterDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/senior" element={
              <ProtectedRoute>
                <AdminSeniorDashboard />
              </ProtectedRoute>
            } />

            <Route path="/admin/master/users" element={
              <ProtectedRoute>
                <AdminGerenciarUsuarios />
              </ProtectedRoute>
            } />
            <Route path="/admin/master/properties" element={
              <ProtectedRoute>
                <AdminGerenciarImoveis />
              </ProtectedRoute>
            } />
            <Route path="/admin/master/banners" element={
              <ProtectedRoute>
                <AdminGerenciarBanners />
              </ProtectedRoute>
            } />
            <Route path="/admin/master/oportunidades" element={
              <ProtectedRoute>
                <AdminMuralOportunidades />
              </ProtectedRoute>
            } />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
