import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Navegacao } from './components/Navegacao';
import { Carregando } from './components/ui';
import { useConfig } from './db/config';
import { aplicarTema } from './lib/tema';
import Ajuda from './pages/Ajuda';
import BoasVindas from './pages/BoasVindas';
import Config from './pages/Config';
import Corpo from './pages/Corpo';
import EditarPrograma from './pages/EditarPrograma';
import ExercicioDetalhe from './pages/ExercicioDetalhe';
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
  const tema = config?.tema;

  useEffect(() => {
    if (tema) aplicarTema(tema);
  }, [tema]);

  if (!config) return <Carregando />;
  if (!config.onboardingConcluido && pathname !== '/boas-vindas') return <Navigate to="/boas-vindas" replace />;

  const semNavegacao = pathname === '/boas-vindas' || pathname === '/treino' || pathname.startsWith('/resumo/');

  return (
    <div className={`mx-auto min-h-dvh max-w-lg ${semNavegacao ? '' : 'pb-24'}`}>
      {/* key = rota: cada troca de tela reinicia a animação de entrada */}
      <div key={pathname} className="pagina-entra">
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/boas-vindas" element={<BoasVindas />} />
        <Route path="/programas" element={<Programas />} />
        <Route path="/programas/modelos" element={<Modelos />} />
        <Route path="/programas/:id" element={<EditarPrograma />} />
        <Route path="/treino" element={<Treino />} />
        <Route path="/resumo/:id" element={<Resumo />} />
        <Route path="/exercicios" element={<Exercicios />} />
        <Route path="/exercicios/:id" element={<ExercicioDetalhe />} />
        <Route path="/historico" element={<Historico />} />
        <Route path="/historico/:id" element={<SessaoDetalhe />} />
        <Route path="/progresso" element={<Progresso />} />
        <Route
          path="/progresso/:id"
          element={
            <Suspense fallback={<Carregando titulo="Exercício" voltar formato="grafico" />}>
              <ProgressoExercicio />
            </Suspense>
          }
        />
        <Route path="/config" element={<Config />} />
        <Route path="/corpo" element={<Corpo />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/ajuda" element={<Ajuda />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
      {!semNavegacao && <Navegacao />}
    </div>
  );
}
