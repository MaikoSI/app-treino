import { type ComponentProps, lazy, type ReactNode, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Navegacao } from './components/Navegacao';
import { Carregando } from './components/ui';
import { useConfig } from './db/config';
import { aplicarTema } from './lib/tema';
import Config from './pages/Config';
import Historico from './pages/Historico';
import Inicio from './pages/Inicio';
import Programas from './pages/Programas';
import Progresso from './pages/Progresso';
import Treino from './pages/Treino';

/*
 * Lazy loading: as 5 abas e o treino vêm no pacote inicial (caminho principal, abrem na hora).
 * As telas secundárias carregam quando abertas, cada uma com o skeleton do seu formato.
 * O gráfico (Recharts) é a maior dependência.
 */
const Ajuda = lazy(() => import('./pages/Ajuda'));
const BoasVindas = lazy(() => import('./pages/BoasVindas'));
const Corpo = lazy(() => import('./pages/Corpo'));
const EditarPrograma = lazy(() => import('./pages/EditarPrograma'));
const ExercicioDetalhe = lazy(() => import('./pages/ExercicioDetalhe'));
const Exercicios = lazy(() => import('./pages/Exercicios'));
const Modelos = lazy(() => import('./pages/Modelos'));
const ProgressoExercicio = lazy(() => import('./pages/ProgressoExercicio'));
const Resumo = lazy(() => import('./pages/Resumo'));
const SessaoDetalhe = lazy(() => import('./pages/SessaoDetalhe'));
const Sobre = lazy(() => import('./pages/Sobre'));

/** Envolve uma tela lazy com o skeleton que ela mostraria. */
function adiado(elemento: ReactNode, fallback: ComponentProps<typeof Carregando>) {
  return <Suspense fallback={<Carregando {...fallback} />}>{elemento}</Suspense>;
}

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
    <div className={`mx-auto min-h-dvh max-w-lg ${semNavegacao ? '' : 'pb-32'}`}>
      {/* key = rota: cada troca de tela reinicia a animação de entrada */}
      <div key={pathname} className="pagina-entra">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/boas-vindas" element={adiado(<BoasVindas />, {})} />
          <Route path="/programas" element={<Programas />} />
          <Route path="/programas/modelos" element={adiado(<Modelos />, { titulo: 'Modelos prontos', voltar: true })} />
          <Route path="/programas/:id" element={adiado(<EditarPrograma />, { titulo: 'Editar programa', voltar: true })} />
          <Route path="/treino" element={<Treino />} />
          <Route path="/resumo/:id" element={adiado(<Resumo />, { formato: 'detalhe' })} />
          <Route path="/exercicios" element={adiado(<Exercicios />, { titulo: 'Exercícios', voltar: true, formato: 'lista' })} />
          <Route path="/exercicios/:id" element={adiado(<ExercicioDetalhe />, { titulo: 'Exercício', voltar: true })} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/historico/:id" element={adiado(<SessaoDetalhe />, { titulo: 'Treino', voltar: true, formato: 'detalhe' })} />
          <Route path="/progresso" element={<Progresso />} />
          <Route
            path="/progresso/:id"
            element={adiado(<ProgressoExercicio />, { titulo: 'Exercício', voltar: true, formato: 'grafico' })}
          />
          <Route path="/config" element={<Config />} />
          <Route path="/corpo" element={adiado(<Corpo />, { titulo: 'Peso e nutrição', voltar: true })} />
          <Route path="/sobre" element={adiado(<Sobre />, { titulo: 'Sobre', voltar: true })} />
          <Route path="/ajuda" element={adiado(<Ajuda />, { titulo: 'Como usar o app', voltar: true })} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!semNavegacao && <Navegacao />}
    </div>
  );
}
