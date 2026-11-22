# AGENTS.md

Instructions for any coding agent (Claude Code, Codex, Copilot, Cursor…) working in this repository. `CLAUDE.md` only imports this file, so keep everything here.

## Project

Weightlifting log PWA (Hevy-style) for personal use. **No backend, no login**: all data lives in the browser's IndexedDB on each device. UI text is **Brazilian Portuguese**, mobile-first, Apple HIG-style theme, light/dark following the OS with a manual override (see theming below). Code identifiers are also in Portuguese (`sessao`, `serie`, `carga`, `programaDia`…); keep that convention.

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

## Working standards (mandatory for every agent)

These rules come from the project owner and apply to every task, whatever the model or tool.

### 1. GitHub workflow
- **Issue first.** Every task (bug fix, improvement or new feature) starts with a GitHub Issue: clear title, description (problem, what will change, acceptance criteria) and one type label: `bug`, `enhancement` or `feature`.
- **Never commit to `main`.** One branch per Issue (`feat/…`, `fix/…`, `chore/…`, `docs/…`), then a Pull Request.
- **PR description:** reference the Issue (`Closes #12`), explain what changed and how to test it.
- **PRs gate deploys.** Only what is reviewed, approved and merged into `main` reaches production (the Pages deploy runs on `main`).
- **Commit messages follow Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `ci:`…), enforced by commitlint.
- **Privacy:** commits use the GitHub noreply e-mail already set in `git config user.email`. Never commit backups, `.env`, tokens, DSNs or personal data. Push, Issue and PR creation are outward-facing: do them only when the owner asked.

### 2. UI and UX
- Follow the motion principles of github.com/kylezantos/design-principles.
- Every screen/component that loads data has: a **skeleton** while loading; **lazy loading** of images, routes and heavy components; smooth **enter, exit and transition** animations; a loading/progress indicator for slow actions.
- Respect `prefers-reduced-motion`: animations collapse to instant (or a plain fade) when it is set.

### 3. Visual theme (Apple Human Interface Guidelines)
All styling goes through the design tokens in `src/index.css` (colors, type, spacing, radii, shadows, motion). No raw hex in components.
- **Type:** system font (`-apple-system, BlinkMacSystemFont, "SF Pro Text"…`) with Inter as fallback. Titles semibold with slightly tight tracking.
- **Buttons:** primary = solid blue, white text, 12px radius (pill for small buttons), no border; secondary = translucent gray fill, blue text; text/link = blue text only; destructive = red. Minimum 44px touch target. Pressed: `scale(0.97)` + slightly lower opacity with a smooth transition. Disabled: reduced opacity.
- **Surfaces:** layered grouped backgrounds (light gray behind, white cards in front; black/dark gray in dark mode), cards with 12–16px radius and very subtle shadows.
- **Glass** (`backdrop-filter` blur) on the top bars, tab bar, menus, sheets and the rest timer bar.
- **Controls:** iOS-style inputs, switches, segmented controls, grouped lists and bottom sheets on mobile.
- **Icons:** thin, consistent line icons (Lucide), wrapped in `components/Icones.tsx`.
- **Light/dark automatic** (follows the OS), with a manual override in Ajustes.
- **Motion:** spring-like easing, nothing abrupt.
- Lots of white space, few elements per screen, clear hierarchy.
- **WCAG AA contrast and visible keyboard focus always win.** Where an exact Apple color fails AA as text or as a button fill with white text, use the darker accessible variant (the `*-texto` tokens and the button fill) and keep the Apple color for icons, tints and indicators.

### 4. Quality, tests and monitoring
- **Observability:** Sentry for errors and OpenTelemetry for logs/metrics/traces, ready to export to Datadog or New Relic. This app has no backend and keeps personal training data on the device, so telemetry is **off unless configured** by environment variables at build time, and never sends workout data or personal fields.
- **Code quality:** Biome (lint + format), commitlint (Conventional Commits), Knip (unused files/exports/deps), dependency-cruiser (layer rules: `lib/` is pure and imports nothing from `db/`, `pages/` or `components/`; `db/` doesn't import UI), Stryker (mutation testing on `src/lib`).
- **Tests:** unit and integration tests for the core logic, Playwright end-to-end tests for critical user flows, coverage uploaded to Codecov.
- **CI:** all of the above runs in GitHub Actions on every PR. A PR can only be merged when lint, tests and build pass (branch protection on `main`).

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
- `ProgressoExercicio` (Recharts) is `lazy()`-loaded to keep the initial bundle small. Its colors are read from the theme at runtime (`lib/tema.ts:corDoTema`): max load = `--destaque` (orange) solid, estimated 1RM = `--secundario` **dashed** (the dash is the secondary encoding; don't make the two lines differ by color alone).
- **Visual theme / tokens** (`src/index.css`): Apple Human Interface Guidelines look. Tailwind v4 has no `tailwind.config`; tokens live in `@theme inline` and point to CSS variables: light in `:root`, dark under `@media (prefers-color-scheme: dark) :root:not([data-theme='claro'])` **and** `:root[data-theme='escuro']` (keep both dark blocks identical). Besides colors there are tokens for radius (`rounded-cartao` 16px, `rounded-controle` 12px), shadows (`shadow-cartao`, `shadow-flutuante`) and motion (`ease-mola`, `ease-saida`), plus utilities `vidro` (backdrop blur for bars, tab bar, sheets, timer) and `pressionavel` (iOS press: scale 0.97 + opacity). Use semantic classes (`bg-cartao`, `bg-cartao-2` = translucent fill, `text-secundario`, `bg-primaria text-sobre-primaria`, `text-primaria-texto`, `text-tinta`, `bg-concluido`, `text-destaque-texto`, `text-alerta-texto`, `bg-volume-*`, `bg-trilho`, `bg-polegar`), never raw hex. Roles: **blue = action/selection**, **green = done/ideal** (checked set, goal, switch on), **orange = records and timers**, **red = alerts/destructive**. Exact Apple colors fail AA as text or under white text, so the primary button uses `#0071E3` (4.7:1 with white), text uses the accessible `*-texto` variants, and the exact colors (`--tinta` #007AFF/#0A84FF, #FF9500, #FF3B30) are for icons, fills and indicators. Re-check contrast for any new pair. Base components in `components/ui.tsx`: `Botao` (primario/secundario/fantasma=text link/perigo, `grande`, `pequeno`=pill), `Cartao`, `Cabecalho`, `Painel` (bottom sheet with grabber), `Contador`, `Interruptor` (iOS switch), `Segmentado` (segmented control with sliding thumb). Icons come only from `components/Icones.tsx` (Lucide, stroke 1.75). Type: system font stack (`-apple-system`, SF Pro) with self-hosted Inter (Latin subset, `@font-face` in `index.css`) as fallback; titles semibold with tight tracking; numbers `tabular-nums`. Touch targets ≥ 44px (`min-h-11`; most controls use `min-h-12`). `prefers-reduced-motion` disables slides and press scaling (rule at the end of the tokens).
- The theme is stored in `config.tema` (`'sistema'` default, `'claro'`, `'escuro'`) and applied by `lib/tema.ts:aplicarTema` (in `App.tsx`): `'sistema'` removes `data-theme` so CSS follows the OS; manual choices set it. It is mirrored to `localStorage` so the inline script in `index.html` applies a manual choice before React loads. There is one `theme-color` meta per color scheme. Anything computing colors in JS (charts) must re-read them when `temaEfetivo(config.tema, useSistemaEscuro())` changes.
- **PWA**: `vite-plugin-pwa` with `registerType: 'prompt'`. `components/AvisoAtualizacao.tsx` shows "Nova versão disponível" so an update never reloads mid-workout. Icons in `public/` are rendered from `public/icone.svg`.
- **Backup** (`db/backup.ts`): JSON `{ app: 'app-treino', versao, exportadoEm, dados: {table: rows} }`. `validarBackup` checks everything before `restaurarBackup` clears and replaces all tables in one transaction. If you add a table or a required field, update `TABELAS` in `db/index.ts`, `CAMPOS` in `backup.ts`, and bump the Dexie version with a migration.

## "Sobre" page

`pages/Sobre.tsx` holds the evidence-based training guide the user provided (shown at `/sobre`, linked from Início and Ajustes). Its section **"Como o app usa este guia"** describes what the app actually does (splits, progression, rest defaults…). Update it whenever those behaviors or defaults change, so it never claims something the app doesn't do.

## "Como usar o app" page

`pages/Ajuda.tsx` (`/ajuda`, linked from a card on Início and from Ajustes) explains each screen in plain language. Like Sobre, update it whenever a feature, label or default changes, so it never describes something the app doesn't do. Sections open from the chips via `abrirSecao` (no `#` anchors: HashRouter owns the hash).

## Muscle map

`components/MapaMuscular.tsx` draws front/back SVG figures from `grupoMuscular` + `secundarios` (via `lib/volume.ts:creditos`), so it works for user-created exercises too. Left-side shapes are mirrored; colors are opaque `color-mix` of theme tokens so overlapping shapes don't show seams. `MapaMuscular.test.ts` asserts every `GRUPOS_MUSCULARES` entry is drawn: add a shape when adding a group. Shown on `/exercicios/:id` (`ExercicioDetalhe`), in the selector's ⓘ button and in the workout's exercise menu.

## Testing notes

- DB tests use `import 'fake-indexeddb/auto'` and reset with `await db.delete(); await db.open();` in `beforeEach`.
- In dev builds, `window.db` exposes the Dexie instance (`main.tsx`), which is handy for seeding data from the browser console.

## Deploy

`.github/workflows/deploy.yml` builds, tests and deploys to GitHub Pages on push to `main` (Pages source must be "GitHub Actions"). `netlify.toml` covers Netlify. Install/offline only work over HTTPS (or localhost).
