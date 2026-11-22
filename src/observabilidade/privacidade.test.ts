import { describe, expect, it } from 'vitest';
import { limparEvento, limparUrl, rotaSemIds } from './privacidade';

describe('rotaSemIds', () => {
  it('troca ids numéricos por :id, sem mexer em nomes', () => {
    expect(rotaSemIds('/exercicios/12')).toBe('/exercicios/:id');
    expect(rotaSemIds('/programas/3/dias/45')).toBe('/programas/:id/dias/:id');
    expect(rotaSemIds('/treino')).toBe('/treino');
    expect(rotaSemIds('/semana2')).toBe('/semana2');
  });
});

describe('limparUrl', () => {
  it('tira query e ids da rota do HashRouter', () => {
    expect(limparUrl('https://x.github.io/app-treino/?a=1#/sessoes/99?b=2')).toBe('https://x.github.io/app-treino/#/sessoes/:id');
  });
  it('URL inválida vira texto vazio', () => {
    expect(limparUrl('não é url')).toBe('');
  });
});

describe('limparEvento', () => {
  it('remove usuário, extras, cabeçalhos, cookies e contextos que não sejam do navegador/sistema/aparelho', () => {
    const evento = limparEvento({
      user: { id: '1', email: 'a@b.c', ip_address: '1.2.3.4' },
      extra: { carga: 100 },
      contexts: { browser: { name: 'Chrome' }, os: { name: 'Android' }, state: { treino: 'x' } },
      request: { url: 'https://x/#/exercicios/7', headers: { 'User-Agent': 'y' }, cookies: 'c', query_string: 'q', data: { peso: 80 } },
    });
    expect(evento).toEqual({
      contexts: { browser: { name: 'Chrome' }, os: { name: 'Android' } },
      request: { url: 'https://x/#/exercicios/:id' },
    });
  });

  it('mantém só breadcrumbs de navegação, sem ids, e descarta cliques, console e requisições', () => {
    const evento = limparEvento({
      breadcrumbs: [
        { category: 'ui.click', data: { alvo: 'input[value=100]' } },
        { category: 'console', data: { mensagem: 'peso 80' } },
        { category: 'navigation', data: { from: '/sessoes/4?x=1', to: '/exercicios/9', extra: 'y' } },
        { category: 'fetch', data: { url: 'https://x' } },
      ],
    });
    expect(evento.breadcrumbs).toEqual([{ category: 'navigation', data: { from: '/sessoes/:id', to: '/exercicios/:id' } }]);
  });
});
