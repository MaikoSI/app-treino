import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { AvisoAtualizacao } from './components/AvisoAtualizacao';
import './index.css';
import { iniciarObservabilidade, relatarErro } from './observabilidade';

// Telemetria opcional: desligada sem as variáveis de ambiente do build (ver AGENTS.md).
iniciarObservabilidade();

// Pede ao navegador para não apagar os dados do app quando faltar espaço.
void navigator.storage?.persist?.().catch(() => {});

// Só em desenvolvimento: acesso ao banco pelo console (e pelos testes no navegador).
if (import.meta.env.DEV) void import('./db').then(({ db }) => Object.assign(window, { db }));

createRoot(document.getElementById('root')!, {
  onUncaughtError: (erro) => {
    relatarErro(erro);
    console.error(erro);
  },
  onCaughtError: (erro) => {
    relatarErro(erro);
    console.error(erro);
  },
}).render(
  <StrictMode>
    <HashRouter>
      <App />
      <AvisoAtualizacao />
    </HashRouter>
  </StrictMode>,
);
