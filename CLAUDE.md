# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Weightlifting log PWA (Hevy-style) for personal use. **No backend, no login**: all data lives in the browser's IndexedDB on each device. UI text is **Brazilian Portuguese**, mobile-first, dark theme only. Code identifiers are also in Portuguese (`sessao`, `serie`, `carga`, `programaDia`…); keep that convention.

## Commands

```bash
npm run dev          # dev server on all interfaces (phone on same Wi-Fi via the "Network" URL)
npm test             # Vitest, all tests
npx vitest run src/lib/forca.test.ts      # single file
npx vitest run -t "sugestaoProgressao"    # tests matching a name
npm run typecheck    # tsc --noEmit
npm run build        # typecheck + production build into dist/ (with service worker)
npm run preview      # serve dist/ (needed to test offline/PWA; dev mode has no SW)
```

Node ≥ 22.12. TypeScript is v7 (`tsc` only typechecks; `noEmit`). No ESLint/Prettier configured.

## Architecture

- **`src/db/`**: Dexie database (`index.ts`, schema v1) plus all data operations. Pages call these functions instead of writing to tables directly.
  - `tipos.ts`: entity types. `id: number` is required in the types; Dexie's `EntityTable<T,'id'>` makes it optional on insert, so build new rows as `Omit<T,'id'>`.
  - Booleans (`ativo`, `concluida`) **cannot be IndexedDB indexes**; they are filtered in memory.
  - `config` is a single row with key `'app'`. Read and write it via `config.ts` (`lerConfig`/`salvarConfig`/`useConfig`), which merges `CONFIG_PADRAO` so new fields get defaults.
  - First run: the `populate` event seeds `exerciciosIniciais.ts` and the default config.
  - `divisoes.ts`: ready-made splits. They reference exercises **by name**, resolved to ids when a program is created. `divisoes.test.ts` asserts every name exists in the seed list.
- **Sessions are copies.** `iniciarTreino` copies the program day into `sessaoSeries`, including per-set `repsMin/repsMax/descansoSeg` and `ordem`, so editing or deleting a program never changes history. Exercise position within a workout is `sessaoSeries.ordem`. There is no separate session-exercise table; `lib/treino.ts:agruparPorExercicio` groups the sets for display.
- **The in-progress workout is just a session with `concluida = false`** (at most one; `iniciarTreino` returns the existing one). Every edit is written to Dexie immediately, which is what makes "close the app and resume" work. `finalizarTreino` deletes unchecked sets and refuses to finish when none are checked.
- "History"/records only count **concluded sets of concluded sessions** (`ultimasSeries`, `seriesAnteriores`, `historicoDeSeries` in `db/sessoes.ts`). A record requires prior history for that exercise; the first time an exercise is done never counts as a PR.
- **`src/lib/`**: pure, unit-tested rules: Epley 1RM, progression hint (+2.5 kg, or +5 kg for `GRUPOS_PERNA`), plate calculator (greedy, computed in hundredths), next day in the program, weeks starting **Monday**, weekly streak (the current week never breaks the streak), chart and record aggregation. Put new business rules here with tests, not in components.
- **UI**: `HashRouter` (works on GitHub Pages subpaths without server config) plus `base: './'` in `vite.config.ts`. Reactive reads use `useLiveQuery` from `dexie-react-hooks`. A liveQuery that can legitimately find nothing should return `null`, not `undefined`, because `undefined` means "loading".
- `App.tsx` redirects to `/boas-vindas` until `config.onboardingConcluido`. After changing config, navigate only once `useConfig()` reflects the change (see `BoasVindas.tsx`); otherwise the stale value bounces you back.
- The rest timer state lives in `localStorage` (`components/Descanso.tsx`). This is per-device and transient by design; everything else lives in Dexie.
- `ProgressoExercicio` (Recharts) is `lazy()`-loaded to keep the initial bundle small. Chart colors (`#3987e5`, `#d95926`) were validated for the dark surface; don't use the lime accent for chart series.
- **PWA**: `vite-plugin-pwa` with `registerType: 'prompt'`. `components/AvisoAtualizacao.tsx` shows "Nova versão disponível" so an update never reloads mid-workout. Icons in `public/` are rendered from `public/icone.svg`.
- **Backup** (`db/backup.ts`): JSON `{ app: 'app-treino', versao, exportadoEm, dados: {table: rows} }`. `validarBackup` checks everything before `restaurarBackup` clears and replaces all tables in one transaction. If you add a table or a required field, update `TABELAS` in `db/index.ts`, `CAMPOS` in `backup.ts`, and bump the Dexie version with a migration.

## "Sobre" page

`pages/Sobre.tsx` holds the evidence-based training guide the user provided (shown at `/sobre`, linked from Início and Ajustes). Its section **"Como o app usa este guia"** describes what the app actually does (splits, progression, rest defaults…). Update it whenever those behaviors or defaults change, so it never claims something the app doesn't do.

## Testing notes

- DB tests use `import 'fake-indexeddb/auto'` and reset with `await db.delete(); await db.open();` in `beforeEach`.
- In dev builds, `window.db` exposes the Dexie instance (`main.tsx`), which is handy for seeding data from the browser console.

## Deploy

`.github/workflows/deploy.yml` builds, tests and deploys to GitHub Pages on push to `main` (Pages source must be "GitHub Actions"). `netlify.toml` covers Netlify. Install/offline only work over HTTPS (or localhost).
