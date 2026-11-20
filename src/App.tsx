import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Navegacao } from './components/Navegacao';
import { Carregando } from './components/ui';
import { useConfig } from './db/config';
import BoasVindas from './pages/BoasVindas';
import Config from './pages/Config';
import EditarPrograma from './pages/EditarPrograma';
import Exercicios from './pages/Exercicios';
import Historico from './pages/Historico';
import Inicio from './pages/Inicio';
import Modelos from './pages/Modelos';
import Programas from './pages/Programas';
import Progresso from './pages/Progresso';
import Resumo from './pages/Resumo';
import SessaoDetalhe from './pages/SessaoDetalhe';
import Sobre from './pages/Sobre';
import Treino from './pages/Treino';

// O gráfico (Recharts) é a maior dependência: carrega só quando abrir a tela.
const ProgressoExercicio = lazy(() => import('./pages/ProgressoExercicio'));

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
        <Route path="/historico" element={<Historico />} />
        <Route path="/historico/:id" element={<SessaoDetalhe />} />
        <Route path="/progresso" element={<Progresso />} />
        <Route
          path="/progresso/:id"
          element={
            <Suspense fallback={<Carregando />}>
              <ProgressoExercicio />
            </Suspense>
          }
        />
        <Route path="/config" element={<Config />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!semNavegacao && <Navegacao />}
    </div>
  );
}
