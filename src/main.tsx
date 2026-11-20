import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Pede ao navegador para não apagar os dados do app quando faltar espaço.
void navigator.storage?.persist?.().catch(() => {});

// Só em desenvolvimento: acesso ao banco pelo console (e pelos testes no navegador).
if (import.meta.env.DEV) void import('./db').then(({ db }) => Object.assign(window, { db }));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
