# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Weightlifting log PWA (Hevy-style) for personal use. **No backend, no login**: all data lives in the browser's IndexedDB on each device. UI text is **Brazilian Portuguese**, mobile-first, dark theme by default (optional light theme, see theming below). Code identifiers are also in Portuguese (`sessao`, `serie`, `carga`, `programaDia`…); keep that convention.

## Commands

```bash
npm run dev          # dev server on all interfaces (phone on same Wi-Fi via the "Network" URL)
npm test             # Vitest, all tests (npm run test:watch for watch mode)
npx vitest run src/lib/forca.test.ts      # single file
npx vitest run -t "sugestaoProgressao"    # tests matching a name
npm run typecheck    # tsc --noEmit
npm run build        # typecheck + production build into dist/ (with service worker)
npm run preview      # serve dist/ (needed to test offline/PWA; dev mode has no SW)
```

Node ≥ 22.12. TypeScript is v7 (`tsc` only typechecks; `noEmit`). No ESLint/Prettier configured.

## Architecture

- **`src/db/`**: Dexie database (`index.ts`, schema v2) plus all data operations. Pages call these functions instead of writing to tables directly.
  - `tipos.ts`: entity types. `id: number` is required in the types; Dexie's `EntityTable<T,'id'>` makes it optional on insert, so build new rows as `Omit<T,'id'>`.
  - Booleans (`ativo`, `concluida`) **cannot be IndexedDB indexes**; they are filtered in memory.
  - `config` is a single row with key `'app'`. Read and write it via `config.ts` (`lerConfig`/`salvarConfig`/`useConfig`), which merges `CONFIG_PADRAO` so new fields get defaults.
  - First run: the `populate` event seeds `exerciciosIniciais.ts` and the default config.
  - `divisoes.ts`: ready-made splits (one per 2–6 days). Items are only **exercise name + sets**; reps and rest come from `lib/metas.ts:metaPadrao` (exercise `tipo` composto/isolado + `config.objetivo`). `divisoes.test.ts` asserts every name exists in the seed list **and** that each split meets the guide via `lib/volume.ts:analisarPrograma` (every `GRUPOS_PRINCIPAIS` muscle ≥2x/week and 10–20 weekly sets; ≥8 for the 2-day split). Changing a split means re-running that test.
  - Exercises carry `tipo` and `secundarios`; secondaries count **half a set** in volume. Sets with `rir ≥ 5` don't count.
  - Tables (`TABELAS` in `index.ts`): exercicios, programas, programaDias, programaExercicios, sessoes, sessaoSeries, pesos (body-weight log, `pesos.ts`), config. Shared reactive hooks such as `useExerciciosMap` live in `hooks.ts`.
  - v1→v2 conversion lives in `migracoes.ts` and is shared by the Dexie upgrade and by restoring v1 backups.
- **Sessions are copies.** `iniciarTreino` copies the program day into `sessaoSeries`, including per-set `repsMin/repsMax/descansoSeg` and `ordem`, so editing or deleting a program never changes history. Exercise position within a workout is `sessaoSeries.ordem`. There is no separate session-exercise table; `lib/treino.ts:agruparPorExercicio` groups the sets for display.
- **The in-progress workout is just a session with `concluida = false`** (at most one; `iniciarTreino` returns the existing one). Every edit is written to Dexie immediately, which is what makes "close the app and resume" work. `finalizarTreino` deletes unchecked sets and refuses to finish when none are checked.
- "History"/records only count **concluded sets of concluded sessions** (`ultimasSeries`, `seriesAnteriores`, `historicoDeSeries` in `db/sessoes.ts`). A record requires prior history for that exercise; the first time an exercise is done never counts as a PR.
- Guide rules ("Regras para o app"): `lib/metas.ts` (default reps/rest, `seriesComAjuste`: deload = half the sets, bad sleep = −1 set on exercises with ≥3), `lib/volume.ts` (weekly volume, program analysis), `forca.ts:estagnado` (3 sessions without beating the prior best e1RM or volume; deload/sleep sessions excluded via `sessao.ajuste`), `lib/nutricao.ts` (weekly weight averages and pace, protein, caffeine). Deload is `config.semanaLeveAte`; while active, `iniciarTreino` always uses `'deload'`.
- **`src/lib/`**: pure, unit-tested rules: Epley 1RM, progression hint (+2.5 kg, or +5 kg for `GRUPOS_PERNA`), plate calculator (greedy, computed in hundredths), next day in the program, weeks starting **Monday**, weekly streak (the current week never breaks the streak), chart and record aggregation. Put new business rules here with tests, not in components.
- **UI**: `HashRouter` (works on GitHub Pages subpaths without server config) plus `base: './'` in `vite.config.ts`. Reactive reads use `useLiveQuery` from `dexie-react-hooks`. A liveQuery that can legitimately find nothing should return `null`, not `undefined`, because `undefined` means "loading".
- `App.tsx` redirects to `/boas-vindas` until `config.onboardingConcluido`. After changing config, navigate only once `useConfig()` reflects the change (see `BoasVindas.tsx`); otherwise the stale value bounces you back.
- The rest timer state lives in `localStorage` (`components/Descanso.tsx`). This is per-device and transient by design; everything else lives in Dexie.
- `ProgressoExercicio` (Recharts) is `lazy()`-loaded to keep the initial bundle small. Its colors are read from the theme at runtime (`lib/tema.ts:corDoTema`): max load = `--destaque` solid, estimated 1RM = `--secundario` **dashed** (the dash is the secondary encoding; don't make the two lines differ by color alone).
- **Visual identity / theming** (`src/index.css`): Tailwind v4 has no `tailwind.config`; tokens live in `@theme inline` and point to CSS variables defined for `:root` (dark, default, the user's exact palette) and `:root[data-theme='claro']` (light). Use the semantic classes (`bg-cartao`, `text-secundario`, `bg-primaria text-sobre-primaria`, `text-primaria-texto`, `bg-concluido`, `text-destaque-texto`, `text-alerta-texto`, `bg-volume-*`, `bg-trilho`), never raw hex. Roles: green = main action and done/ideal, blue = records and timers, red = alerts only. `*-texto` tokens exist because in the light theme the brand green/blue/red fail AA as text and are darkened. Every text pair was checked for WCAG AA; re-check contrast when adding a color combination. Cards use `rounded-xl` (12px), and touch targets are at least `min-h-12` (48px).
- The theme is stored in `config.tema` and applied by `aplicarTema` (in `App.tsx`). It is mirrored to `localStorage` so the inline script in `index.html` sets `data-theme` before React loads.
- **PWA**: `vite-plugin-pwa` with `registerType: 'prompt'`. `components/AvisoAtualizacao.tsx` shows "Nova versão disponível" so an update never reloads mid-workout. Icons in `public/` are rendered from `public/icone.svg`.
- **Backup** (`db/backup.ts`): JSON `{ app: 'app-treino', versao, exportadoEm, dados: {table: rows} }`. `validarBackup` checks everything before `restaurarBackup` clears and replaces all tables in one transaction. If you add a table or a required field, update `TABELAS` in `db/index.ts`, `CAMPOS` in `backup.ts`, and bump the Dexie version with a migration.

## "Sobre" page

`pages/Sobre.tsx` holds the evidence-based training guide the user provided (shown at `/sobre`, linked from Início and Ajustes). Its section **"Como o app usa este guia"** describes what the app actually does (splits, progression, rest defaults…). Update it whenever those behaviors or defaults change, so it never claims something the app doesn't do.

## Testing notes

- DB tests use `import 'fake-indexeddb/auto'` and reset with `await db.delete(); await db.open();` in `beforeEach`.
- In dev builds, `window.db` exposes the Dexie instance (`main.tsx`), which is handy for seeding data from the browser console.

## Deploy

`.github/workflows/deploy.yml` builds, tests and deploys to GitHub Pages on push to `main` (Pages source must be "GitHub Actions"). `netlify.toml` covers Netlify. Install/offline only work over HTTPS (or localhost).
