import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Navegacao } from './components/Navegacao';
import { Carregando } from './components/ui';
import { useConfig } from './db/config';
import Exercicios from './pages/Exercicios';
import Inicio from './pages/Inicio';
import { EmBreve } from './pages/EmBreve';

export default function App() {
  const config = useConfig();
  const { pathname } = useLocation();

  if (!config) return <Carregando />;
  if (!config.onboardingConcluido && pathname !== '/boas-vindas') return <Navigate to="/boas-vindas" replace />;

  const semNavegacao = pathname === '/boas-vindas' || pathname === '/treino';

  return (
    <div className={`mx-auto min-h-dvh max-w-lg ${semNavegacao ? '' : 'pb-24'}`}>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/boas-vindas" element={<EmBreve titulo="Boas-vindas" />} />
        <Route path="/programas" element={<EmBreve titulo="Programas" />} />
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
