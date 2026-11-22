import { describe, expect, it } from 'vitest';
import { validarReceita } from '../lib/execucao';
import { execucaoDe, NOMES_COM_EXECUCAO } from '../lib/execucoes';
import { EXERCICIOS_INICIAIS } from './exerciciosIniciais';

/** Exercícios prontos que ainda não têm demonstração. Encolhe a cada lote; no fim, vazio. */
const PENDENTES: string[] = ['Abdominal supra', 'Abdominal na polia', 'Elevação de pernas', 'Prancha (segundos)'];

const DIRECAO = /sobe|suba|desce|desça|empurre|puxe|estenda|estique|flexione|dobre|leve|abra|feche|levante|abaixe|eleve|segure|mantenha/i;

describe('demonstrações de execução', () => {
  const nomes = EXERCICIOS_INICIAIS.map((e) => e.nome);

  it('só faltam os exercícios listados como pendentes', () => {
    expect(nomes.filter((n) => !NOMES_COM_EXECUCAO.includes(n))).toEqual(PENDENTES);
  });

  it('toda demonstração pertence a um exercício pronto', () => {
    expect(NOMES_COM_EXECUCAO.filter((n) => !nomes.includes(n))).toEqual([]);
  });

  describe.each(NOMES_COM_EXECUCAO)('%s', (nome) => {
    const ex = execucaoDe(nome)!;
    it('receita válida (limites, contatos e ritmo)', () => {
      expect(validarReceita(ex.receita)).toEqual([]);
    });
    it('explicação completa', () => {
      const { posicao, execucao, respiracao, erros } = ex.explicacao;
      for (const lista of [posicao, execucao, erros]) {
        expect(lista.length).toBeGreaterThan(0);
        for (const frase of lista) expect(frase.trim().length).toBeGreaterThan(10);
      }
      expect(respiracao.trim().length).toBeGreaterThan(10);
      expect(execucao.join(' ')).toMatch(DIRECAO);
      expect(ex.descricao.trim().length).toBeGreaterThan(10);
    });
  });
});
