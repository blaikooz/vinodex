// @ts-check
/**
 * The linter the repo did not have.
 *
 * Through v6 this project ran four gates plus a render gate and **no static
 * analysis of the code itself**. The tell was seven
 * `// eslint-disable-next-line react-hooks/exhaustive-deps` comments in
 * `App.tsx`, `ChipFilterScreen`, `InsightSection`, `PassportScreen` and
 * `TastingQuizScreen` — written against a rule that had never once run, so
 * they suppressed nothing and documented a hazard nobody was checking.
 *
 * Three plugins and no more:
 *
 * - **typescript-eslint** for the rules `tsc` cannot express. `strict`,
 *   `noUncheckedIndexedAccess`, `noUnusedLocals` and `noUnusedParameters` are
 *   already on in `tsconfig.json`, so the type-level ground is covered; what
 *   is added here is the `any` surface, which is the W14/W15 finding.
 * - **react-hooks**, for `exhaustive-deps` and `rules-of-hooks`. This is the
 *   rule those seven comments were addressed to.
 * - **jsx-a11y**, because the chassis is a pile of divs and the house rule is
 *   that it does not have to be. It found nothing new on the first run — the
 *   repo has zero `<div onClick>` without a role — which is worth knowing
 *   rather than assuming.
 *
 * **Not type-aware linting.** `typescript-eslint`'s `recommendedTypeChecked`
 * needs a program per run and roughly triples the gate's cost, for rules that
 * overlap heavily with the `strict` settings already on. If a specific
 * type-aware rule is wanted later it can be enabled on its own.
 *
 * **The baseline.** The first run reported real findings; they are fixed in
 * their own commits rather than silenced here. Rules that would have required
 * a behavioural change to satisfy are set to `warn` with a note, never to
 * `off`, so they stay visible.
 *
 * **And the warning count is capped** (L2). `eslint .` exits 0 on warnings,
 * so for its first several commits the baseline was a contract enforced by
 * nothing at all -- and it had already drifted, 27 -> 28, inside the range
 * this note was written in. `npm run lint` passes `--max-warnings`, so the
 * number in `package.json` is the real ceiling: it comes DOWN as items land
 * and a commit that raises it has to say why.
 */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default tseslint.config(
  {
    // `dist/` is build output, `shared/` is a mirror we may not edit (a lint
    // error there is unfixable by construction), and the two frozen iOS
    // generators under `scripts/` are copies whose live originals live in
    // vinodex-ios.
    ignores: [
      'dist/**',
      'shared/**',
      'node_modules/**',
      'web/public/**',
      'scripts/generate-ios-data.ts',
      'web/e2e/.artifacts/**',
      'web/e2e/.shots/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,

      // The W14/W15 surface. An `any` is how a discriminated union gets
      // bypassed, which is exactly what happened on the passport, quiz and
      // chip-facet paths — `grapeScan.ts` narrows with `isGrapeEntry` and is
      // the idiom the rest should follow.
      '@typescript-eslint/no-explicit-any': 'error',

      // `_`-prefixed is the repo's existing convention for a deliberately
      // unused prop (`DeviceLayout`'s `_subtitle`, `_centerHeaderText`), kept
      // for call-site compatibility. Honour it rather than rewriting call
      // sites to satisfy a linter.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],

      // `tsc` owns this one and reports it better.
      'no-undef': 'off',
      'no-unused-vars': 'off',

      // The device draws its own furniture; a decorative span with an
      // `aria-hidden` is correct and not a missing role.
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',

      // ----------------------------------------------------------------
      // Standing downgrades — NOT baseline. These are rules whose default
      // severity is wrong for this codebase, with the reason stated. They
      // do not shrink over time; the entries under BASELINE below do.
      // ----------------------------------------------------------------

      // 9 sites, and several are *documented deliberate choices* — e.g.
      // `SettingsPanel.tsx:578` reads `profiles()` in an effect precisely
      // because it seeds HORIZON on first read, and a localStorage write
      // during render is a side effect React may run twice (review L5).
      // A rule that would have this codebase undo a fix it reasoned its way
      // to is a warning, not an error.
      'react-hooks/set-state-in-effect': 'warn',

      // The three.js ambient module declaration. That dependency ships no
      // types and the repo deliberately does not carry `@types/three`; the
      // `any`s in `vite-env.d.ts` ARE the shim, and `unknown` there would
      // break every call site in RetroGlobeScreen without making anything
      // safer. A standing exemption rather than a baseline entry, because it
      // is not a defect that shrinks — it goes when the types arrive.
      //
      // 5 sites, all of them a text field the user has just chosen to open:
      // the unlock code, the cheat console, the two search boxes and the
      // name prompt. Focusing the field a modal exists to hold is the
      // behaviour, not an accident, and v6 L35 explicitly *added* one of
      // them. Kept visible rather than silenced.
      'jsx-a11y/no-autofocus': 'warn',
    },
  },
  {
    // Tests reach for fixtures and stubs that are legitimately loose.
    files: ['**/*.test.{ts,tsx}', 'web/e2e/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // Playwright's fixture signature is `async ({ page }, use) => ...`, and
    // `use` is not React's `use`. The rule matches on the name alone.
    files: ['web/e2e/**/*.ts'],
    rules: { 'react-hooks/rules-of-hooks': 'off' },
  },
  {
    // See the note by `no-autofocus`: this file is the three.js shim.
    files: ['web/vite-env.d.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
  {
    // Node scripts, not browser code.
    files: ['scripts/**/*.{ts,mjs,js}', '*.config.{ts,js,mjs}'],
    languageOptions: { globals: globals.node },
  },

  // ======================================================================
  // BASELINE — the first run's real findings, scoped to the exact files
  // that carry them, each with the item that removes it.
  //
  // Every entry here is a **defect the linter found on the day it was
  // installed**, not a rule this codebase disagrees with (those are the
  // standing downgrades above). Each block names its owner. **This section
  // only ever shrinks**; a block is deleted by the commit that fixes its
  // files, and a new file may not be added to one.
  // ======================================================================
  {
    // W14 — FIXED for passport.ts, quiz.ts, chipFilter.ts, artSprites.tsx and
    // find-missing-refs.ts; all five narrow with the shared type guards now.
    // What is left is one Node script that assembles a free-form JSON
    // document, where the `any` is the shape of the output rather than a
    // bypassed union. Owner: the encyclopedia tooling, not this pass.
    files: ['scripts/cleanEncyclopediaText.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'warn' },
  },
  {
    // W1 — five route components declared inside App's render body, so every
    // App re-render remounts the whole routed subtree. `react-hooks`
    // found this independently on its first run, which is the argument for
    // the linter in one line.
    //
    // FIXED for App.tsx (W1) and for UnlockScreen (M3).
    //
    // The note that used to stand here filed UnlockScreen's `Key` beside
    // MoonDialScreen's `Row` as "the same shape at smaller scale", which was
    // true of the mechanism and false of the effect: `Row` is
    // non-interactive and stateless, so a remount costs a little work; `Key`
    // renders a `<button>` and every press calls `setCode`, so all twelve
    // keys were rebuilt after each digit and keyboard focus was lost from the
    // key just pressed. Grading a hook defect by the size of the component
    // rather than by what the component does is how that got baselined.
    //
    // `Row` genuinely is cosmetic, and is the only entry left.
    files: [
      'web/components/MoonDialScreen.tsx',
    ],
    rules: { 'react-hooks/static-components': 'warn' },
  },
);
