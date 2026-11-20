import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Navegacao } from './components/Navegacao';
import { Carregando } from './components/ui';
import { useConfig } from './db/config';
import BoasVindas from './pages/BoasVindas';
import EditarPrograma from './pages/EditarPrograma';
import { EmBreve } from './pages/EmBreve';
import Exercicios from './pages/Exercicios';
import Inicio from './pages/Inicio';
import Modelos from './pages/Modelos';
import Programas from './pages/Programas';
import Resumo from './pages/Resumo';
import Treino from './pages/Treino';

export default function App() {
  const config = useConfig();
  const { pathname } = useLocation();

  if (!config) return <Carregando />;
  if (!config.onboardingConcluido && pathname !== '/boas-vindas') return <Navigate to="/boas-vindas" replace />;

  const semNavegacao = pathname === '/boas-vindas' || pathname === '/treino' || pathname.startsWith('/resumo/');

  return (
    <div className={`mx-auto min-h-dvh max-w-lg ${semNavegacao ? '' : 'pb-24'}`}>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/boas-vindas" element={<BoasVindas />} />
        <Route path="/programas" element={<Programas />} />
        <Route path="/programas/modelos" element={<Modelos />} />
        <Route path="/programas/:id" element={<EditarPrograma />} />
        <Route path="/treino" element={<Treino />} />
        <Route path="/resumo/:id" element={<Resumo />} />
        <Route path="/exercicios" element={<Exercicios />} />
        <Route path="/historico" element={<EmBreve titulo="Histórico" />} />
        <Route path="/progresso" element={<EmBreve titulo="Progresso" />} />
        <Route path="/config" element={<EmBreve titulo="Ajustes" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!semNavegacao && <Navegacao />}
    </div>
  );
}
