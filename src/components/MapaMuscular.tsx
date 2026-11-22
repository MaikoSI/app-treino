import type { GrupoMuscular } from '../db/tipos';
import { creditos, type InfoMusculo } from '../lib/volume';

/**
 * Mapa muscular: corpo de frente e de costas, com o músculo principal pintado de verde cheio e os secundários
 * em verde claro. A legenda em texto repete a informação (cor não é a única pista).
 *
 * As formas do lado esquerdo da figura são desenhadas uma vez e espelhadas; `centro` são peças inteiras (cabeça, abdômen).
 */
interface Forma {
  d: string;
  grupo?: GrupoMuscular;
  centro?: boolean;
}

const CABECA: Forma[] = [
  { d: 'M50 3 C55 3 58 7 58 13 C58 19 55 23 50 23 C45 23 42 19 42 13 C42 7 45 3 50 3Z', centro: true },
  { d: 'M45 21 L55 21 L56 29 L44 29Z', centro: true },
];

// Mãos, joelhos e pés: partes neutras, iguais nas duas vistas.
const EXTREMIDADES: Forma[] = [
  { d: 'M17 90 C19 89 22 89 23 91 L22 99 C20 101 17 100 16 98Z' },
  { d: 'M35 141 C38 140 43 140 45 141 L45 148 C42 149 38 149 35 148Z' },
  { d: 'M37 183 C40 182 43 183 44 184 L46 190 C42 192 37 192 34 190Z' },
];

export const FRENTE: Forma[] = [
  ...CABECA,
  ...EXTREMIDADES,
  // quadril (neutro), por baixo do abdômen e das coxas
  { d: 'M35 74 L65 74 L66 90 L50 98 L34 90Z', centro: true },
  { grupo: 'Ombros', d: 'M38 30 C31 29 24 33 22 42 C24 46 28 46 31 44 C33 39 35 34 38 30Z' },
  { grupo: 'Peito', d: 'M49.5 31 L39 30.5 C35 35 32.5 41 32.5 47 C37 52 45 53 49.5 50Z' },
  { grupo: 'Abdômen', d: 'M42 53 C46 55 54 55 58 53 L57.5 80 C54 86 46 86 42.5 80Z', centro: true },
  { grupo: 'Abdômen', d: 'M33 50 C36 53 39 54 41 54 L41.5 80 C39 79 36 77 35 73 C33.5 65 33 57 33 50Z' },
  { grupo: 'Bíceps', d: 'M22 45 C25 47 29 47 31 45.5 C31.5 53 30 59 27.5 63 C24.5 63.5 21.5 62 20.5 58.5 C19.5 53 20.5 48 22 45Z' },
  { grupo: 'Antebraço', d: 'M20.5 61 C22.5 64 25.5 65.5 27.5 65 C27 73 25.5 81 23 88 C21 88.5 18.5 88 17 87 C16.5 79 17.5 69 20.5 61Z' },
  { grupo: 'Quadríceps', d: 'M34 89 C39 93 44 96 49 99 C49 114 47.5 127 45.5 138 C41.5 139.5 37.5 139.5 35 138 C32.5 123 31.5 105 34 89Z' },
  {
    grupo: 'Panturrilha',
    d: 'M35.5 150 C38.5 149 42.5 149 45 150 C46 160 45 171 43.5 181 C41 182 39 182 37.5 181 C35 171 34.5 160 35.5 150Z',
  },
];

export const COSTAS: Forma[] = [
  ...CABECA,
  ...EXTREMIDADES,
  { grupo: 'Costas', d: 'M50 22 L50 46 L38.5 31 C42 28 46 25 50 22Z' },
  { grupo: 'Costas', d: 'M50 48 L37.5 32.5 C34 37 32.5 44 33 50 C34.5 60 38.5 68 42 74 L50 74Z' },
  { grupo: 'Ombros', d: 'M37.5 30 C30.5 29.5 24 33 22 42 C24 46 28 46 31 44 C32.5 39 34.5 34 37.5 30Z' },
  { grupo: 'Tríceps', d: 'M22 45 C25 47 29 47 31 45.5 C31.5 53 30 59 27.5 63 C24.5 63.5 21.5 62 20.5 58.5 C19.5 53 20.5 48 22 45Z' },
  { grupo: 'Antebraço', d: 'M20.5 61 C22.5 64 25.5 65.5 27.5 65 C27 73 25.5 81 23 88 C21 88.5 18.5 88 17 87 C16.5 79 17.5 69 20.5 61Z' },
  { grupo: 'Glúteos', d: 'M49.5 75.5 L36 75.5 C33 81 32 89 34.5 95 C39.5 99 45.5 99 49.5 96Z' },
  {
    grupo: 'Posteriores',
    d: 'M34.5 97.5 C39.5 100.5 45 100.5 49 99.5 C49 114 47.5 127 45.5 138 C41.5 139.5 37.5 139.5 35 138 C32.5 124 32.5 110 34.5 97.5Z',
  },
  { grupo: 'Panturrilha', d: 'M35 150 C39 148 44 148.5 46 150.5 C47.5 160 45.5 170 43.5 180 C41 182 39 182 37 180 C34 170 33 159 35 150Z' },
];

type Nivel = 'principal' | 'secundario';

// Cores opacas (misturadas com o fundo do cartão), para as formas sobrepostas não escurecerem nas emendas.
const COR: Record<Nivel | 'nenhum', string> = {
  principal: 'var(--concluido)',
  secundario: 'color-mix(in srgb, var(--concluido) 40%, var(--cartao))',
  nenhum: 'color-mix(in srgb, var(--secundario) 22%, var(--cartao))',
};

function Figura({ formas, niveis, rotulo }: { formas: Forma[]; niveis: Map<GrupoMuscular, Nivel>; rotulo: string }) {
  const cor = (f: Forma) => COR[(f.grupo && niveis.get(f.grupo)) || 'nenhum'];
  return (
    <figure className="flex flex-1 flex-col items-center gap-1">
      <svg
        viewBox="12 0 76 195"
        className="h-auto w-full max-w-36"
        aria-hidden="true"
        stroke="var(--cartao)"
        strokeWidth={1.2}
        strokeLinejoin="round"
      >
        {formas.map((f, i) =>
          f.centro ? (
            <path key={i} d={f.d} fill={cor(f)} />
          ) : (
            <g key={i}>
              <path d={f.d} fill={cor(f)} />
              <path d={f.d} fill={cor(f)} transform="translate(100 0) scale(-1 1)" />
            </g>
          ),
        )}
      </svg>
      <figcaption className="text-xs text-secundario">{rotulo}</figcaption>
    </figure>
  );
}

export function MapaMuscular({ exercicio }: { exercicio: InfoMusculo }) {
  const niveis = new Map<GrupoMuscular, Nivel>(creditos(exercicio).map(([g, c]) => [g, c >= 1 ? 'principal' : 'secundario']));
  const secundarios = [...niveis].filter(([, n]) => n === 'secundario').map(([g]) => g);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Figura formas={FRENTE} niveis={niveis} rotulo="Frente" />
        <Figura formas={COSTAS} niveis={niveis} rotulo="Costas" />
      </div>
      <ul className="flex flex-col gap-1.5 text-sm">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3.5 shrink-0 rounded-sm" style={{ background: COR.principal }} />
          <span>
            <span className="text-secundario">Principal:</span> <strong>{exercicio.grupoMuscular}</strong>
          </span>
        </li>
        {secundarios.length > 0 && (
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="size-3.5 shrink-0 rounded-sm" style={{ background: COR.secundario }} />
            <span>
              <span className="text-secundario">Também trabalha:</span> {secundarios.join(', ')}
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}
