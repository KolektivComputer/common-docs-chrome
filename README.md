# @kolektiv/common-docs-chrome

Framework-agnostic core + Astro components for the shared Kolektiv documentation
chrome. It gives every Kolektiv docs site the same navbar, sidebar, footer,
theme picker, code themes and "Built by Kolektiv Computing" mark.

- **Core** (`@kolektiv/common-docs-chrome`) — theme registry, preference engine,
  Shiki helpers, typed site config, base-aware paths. ESM + type declarations.
- **Astro components** (`@kolektiv/common-docs-chrome/astro/*`) — layouts and
  chrome, shipped as `.astro` source so your Astro/Vite build compiles them.
- **Styles** (`@kolektiv/common-docs-chrome/styles/*`) — Tailwind 4 + daisyUI 5
  chrome and optional brand typography.

MIT licensed. Built by [Kolektiv Computing](https://kolektiv.computer).

## Install

```bash
pnpm add @kolektiv/common-docs-chrome @kolektiv/themes
# Peer dependencies (your site almost certainly already has these):
pnpm add astro tailwindcss daisyui
```

`@kolektiv/brand-core` (the Kolektiv brand mark renderer) is installed
transitively as a dependency; you only need it directly if you render the mark
yourself.

Requirements: Node >= 22, Astro >= 5, Tailwind CSS 4, daisyUI 5.

The package resolves `@kolektiv/*` from the aggregate registry
`https://repo.yuri.capital/repository/npm-public/`. Add to your `.npmrc`:

```ini
@kolektiv:registry=https://repo.yuri.capital/repository/npm-public/
```

## Consumer setup

### 1. Global stylesheet

Create `src/styles/global.css` and import it once (e.g. in a layout):

```css
@import "tailwindcss";
@import "@kolektiv/common-docs-chrome/styles/chrome.css";
@import "@kolektiv/common-docs-chrome/styles/brand-fonts.css";
```

- `chrome.css` declares the daisyUI plugin, imports
  `@kolektiv/themes/theme.css`, and adds `@source` directives so Tailwind scans
  the shipped components. **Do not** add a second `@plugin "daisyui"` block.
- `brand-fonts.css` is optional. It imports the brand typefaces from
  `@fontsource` and defines `--font-display`, `--font-sans` and `--font-mono`.
  Install the fonts it references:

  ```bash
  pnpm add @fontsource/inclusive-sans @fontsource/source-sans-3 @fontsource/iosevka
  ```

If your site wants its own fonts, skip `brand-fonts.css` and define the
`--font-*` variables yourself.

### 2. Astro config

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { createShikiConfig } from '@kolektiv/common-docs-chrome';

import { docs } from './src/docs-chrome.ts';

export default defineConfig({
  site: docs.siteUrl,
  base: docs.base,
  markdown: {
    // Registers every built-in + site-specific Shiki theme.
    shikiConfig: createShikiConfig(docs.themes),
  },
  vite: { plugins: [tailwindcss()] },
});
```

### 3. Site config

Create `src/docs-chrome.ts` with `defineDocsChrome`:

```ts
import { defineDocsChrome } from '@kolektiv/common-docs-chrome';

export const docs = defineDocsChrome({
  name: 'Kalendee',
  description: 'Self-hosted CalDAV server and clients.',
  siteUrl: 'https://docs.kalendee.example',
  defaultTheme: 'kalendee-dark',
  themeFamilies: ['kalendee', 'kolektiv', 'catppuccin', 'nord', 'daisyui'],
  themeFamily: 'kalendee',
  themes: [
    {
      id: 'kalendee-dark',
      label: 'Kalendee Dark',
      scheme: 'dark',
      family: 'kalendee',
      shiki: 'catppuccin-mocha',
      colors: { 'base-100': '#0b1020', 'base-content': '#e6e9f5', primary: '#6f8cff' },
    },
  ],
  nav: [
    {
      label: 'Getting started',
      items: [
        { label: 'Overview', href: '/', description: 'Start here' },
        { label: 'Install', href: '/docs/install' },
        { label: 'GitHub', href: 'https://github.com/KolektivComputer/kalendee', external: true },
      ],
    },
  ],
  repo: { url: 'https://github.com/KolektivComputer/kalendee', branch: 'main' },
  langs: [
    { id: 'kts', label: 'Kotlin' },
    { id: 'bash', label: 'Shell' },
  ],
  frameworks: [
    { id: 'compose', label: 'Compose' },
    { id: 'web', label: 'Web' },
  ],
});
```

### 4. Use a layout

```astro
---
// src/pages/docs/index.astro
import DocsLayout from '@kolektiv/common-docs-chrome/astro/DocsLayout.astro';
import { docs } from '../../docs-chrome';
import '../../styles/global.css';
---

<DocsLayout config={docs} title="Overview">
  <h1>Overview</h1>
  <p>Your content. The sidebar and navbar come from the config.</p>
</DocsLayout>
```

For marketing/landing pages use `BaseLayout`:

```astro
---
import BaseLayout from '@kolektiv/common-docs-chrome/astro/BaseLayout.astro';
import { docs } from '../docs-chrome';
import '../styles/global.css';
---

<BaseLayout config={docs} title="Overview">
  <h1>Your landing page</h1>
</BaseLayout>
```

For content collections, point your `.md`/`.mdx` layout at a small wrapper that
renders `DocsLayout`:

```astro
---
import DocsLayout from '@kolektiv/common-docs-chrome/astro/DocsLayout.astro';
import { docs } from '../docs-chrome';
import '../styles/global.css';
const { frontmatter } = Astro.props;
---

<DocsLayout config={docs} title={frontmatter.title} description={frontmatter.description}>
  <slot />
</DocsLayout>
```

## Public API

### Core — `import { ... } from '@kolektiv/common-docs-chrome'`

Config:

- `DocsChromeConfig`, `NavSection`, `NavItem`, `FooterConfig`, `FooterLink`,
  `RepoConfig`, `BuiltByConfig`
- `defineDocsChrome(config)` — fills defaults, returns a normalised config
- `pageLabelFor(config, pathname)`, `findNavItem(config, pathname)`
- `visibilityCss(config)` — `[data-lang-panel]` / `[data-framework-panel]` rules
- `DEFAULT_CODE_THEME`, `DEFAULT_THEME_FAMILY`, `DEFAULT_BUILT_BY`

Themes:

- Types `ChromeTheme`, `ThemeFamily`, `ThemeScheme`, `ChromeThemeGroup`
- `allChromeThemes()` — every built-in palette + daisyUI light/dark
- `themesByFamily(themes?)` — `Record<family, ChromeTheme[]>`
- `groupChromeThemes(themes?, order?)` — ordered `{ family, label, themes }[]`
- `siteThemes(config)` — built-ins filtered by `themeFamilies` + `config.themes`
- `resolveTheme(id, themes?)` — resolve an id or alias
- `shikiThemeForChrome(id, themes?)` — Shiki registration for a theme
- `themeCssFor(themes)` — daisyUI CSS for the supplied themes
- `isBuiltinPalette(id)`, `themeFamilyLabel(family)`

Preferences:

- `ChromePrefs`, `PrefOptions`, `PrefKeys`, `PREF_KEYS`, `DEFAULT_CODE_THEME`
- `readPrefs(options)`, `applyPrefs(prefs, options)`,
  `syncControls(root?, options)`, `initChrome(options)`
- `noFlashScript` (inline `<head>` string), `buildNoFlashScript(keys?)`

Shiki:

- `defaultShikiThemes`, `createShikiConfig(extraThemes?)`,
  `shikiThemeCss(themes?)`, `shikiFor(id, themes?)`, `hasShikiTheme(id, themes?)`

Paths:

- `path(to, base?)`, `stripBase(pathname, base?)`, `normalizeBase(base?)`,
  `isExternal(href)`, `joinPath(base, to)`

### Astro components

Every component lives at `@kolektiv/common-docs-chrome/astro/<Name>.astro`:

| Component | Purpose |
| --- | --- |
| `BaseHead.astro` | SEO/OG/canonical meta, no-flash script, theme + Shiki CSS |
| `BaseLayout.astro` | Marketing/landing shell (navbar + main + footer) |
| `DocsLayout.astro` | Primary docs shell (sidebar lockup, navbar, footer) |
| `Navbar.astro` | Sticky navbar with the current page label and controls |
| `Sidebar.astro` | Categorised nav, optional per-item icons, active highlight |
| `Footer.astro` | Footer with links and the built-by mark |
| `ThemePicker.astro` | Site + code theme popover grouped by family |
| `LangToggle.astro` | Language switch (renders only when `langs` is set) |
| `FrameworkPicker.astro` | Framework switch (renders only when `frameworks` is set) |
| `ScmMenu.astro` | Source-control menu (renders when `scm`/`repo` is set) |
| `Mark.astro` | Logo/mark image, with the `@kolektiv/brand-core` icon mark as fallback |
| `BuiltByMark.astro` | Always-on "Built by Kolektiv Computing" mark |
| `SearchDialog.astro` | Client-side search over the configured nav |

`@kolektiv/common-docs-chrome/astro` also exports `ASTRO_COMPONENTS` (a map of
component names to import paths).

## `DocsChromeConfig` reference

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `name` | `string` | — | Required. Used in the lockup, titles, footer. |
| `title` | `string` | `name` | Document title prefix. |
| `description` | `string` | — | Required. Meta description / OG. |
| `siteUrl` | `string` | — | Required. Canonical origin. |
| `base` | `string` | `/` | Astro base path. |
| `logo` | `string` | — | Logo/wordmark URL for the navbar. |
| `mark` | `string` | — | Icon URL; falls back to the `@kolektiv/brand-core` icon mark. |
| `repo` | `RepoConfig` | — | `{ url, branch?, editBaseUrl? }`. |
| `nav` | `NavSection[]` | `[]` | Sidebar/nav model. |
| `defaultTheme` | `string` | — | Required. Applied on first visit + SSR. |
| `defaultCodeTheme` | `string` | `follow` | A theme id or `follow`. |
| `themeFamilies` | `ThemeFamily[]` | all | Restrict + order families in the picker. |
| `themeFamily` | `ThemeFamily` | `site` | Family assigned to `themes` entries. |
| `themes` | `ChromeTheme[]` | `[]` | Site-specific themes (override by id). |
| `langs` | `{ id, label }[]` | — | Enables `LangToggle`. |
| `frameworks` | `{ id, label }[]` | — | Enables `FrameworkPicker`. |
| `defaultLang` | `string` | first `langs` | SSR default. |
| `defaultFramework` | `string` | first `frameworks` | SSR default. |
| `scm` | `FooterLink[]` | derived from `repo` | Source-control menu links. |
| `footer.links` | `FooterLink[]` | `[]` | Footer link column. |
| `footer.copyright` | `string` | `© {year} Kolektiv Computing` | `{year}` is replaced. |
| `footer.tagline` | `string` | — | Blurb next to the built-by mark. |
| `builtBy` | `{ href?, label?, mark? }` | `https://kolektiv.computer` | Built-by mark. |

`NavItem` is `{ label, href, icon?, external?, description? }`. `icon` is inline
SVG path data (`d`) for a 24×24 viewBox. External links open in a new tab.

## Theme families, defaults and site themes

The registry unifies three sources:

1. Every palette from `@kolektiv/themes` — `nord`, `catppuccin-latte/frappe/macchiato/mocha`,
   `kolektiv-light/dark`. Families: `nord`, `catppuccin`, `kolektiv`.
2. daisyUI built-ins `light` and `dark`. Family: `daisyui`.
3. Site-specific themes from `config.themes`. Family: `config.themeFamily` (default `site`).

`siteThemes(config)` returns the built-ins filtered by `config.themeFamilies`
(omit it to offer everything) plus every `config.themes` entry. A site theme with
the same id as a built-in overrides it.

Choosing a default family per site:

- **Keel**: `themeFamilies: ['catppuccin', 'nord', 'kolektiv', 'daisyui']`,
  `defaultTheme: 'catppuccin-mocha'`.
- **Brand**: `themeFamilies: ['kolektiv', 'daisyui']`,
  `defaultTheme: 'kolektiv-dark'`.
- **Kalendee**: `themeFamilies: ['kalendee', 'kolektiv', 'catppuccin', 'nord', 'daisyui']`,
  `themeFamily: 'kalendee'`, `defaultTheme: 'kalendee-dark'`.

### Adding a site-specific theme

Provide a **full** daisyUI colour set so every token resolves. The easiest way is
to base it on an existing palette:

```ts
import { defineDocsChrome } from '@kolektiv/common-docs-chrome';
import { getTheme } from '@kolektiv/themes';

const base = getTheme('catppuccin-mocha')?.colors ?? {};

const theme = {
  id: 'kalendee-dark',
  label: 'Kalendee Dark',
  scheme: 'dark' as const,
  family: 'kalendee',
  shiki: 'catppuccin-mocha', // a Shiki preset id, or a theme object
  colors: { ...base, primary: 'oklch(0.72 0.16 250)' },
};
```

`themeCssFor` emits the `--color-*` variables for site themes; the layouts inject
them automatically, so no extra CSS is needed.

### Code themes

Code blocks are rendered by Shiki with every theme registered via
`createShikiConfig(themes)` (keys equal theme ids). The active code theme is
selected by `data-code-theme`:

- `follow` (default) tracks the site theme.
- Any theme id pins code blocks to that theme.

`ThemePicker` offers `Follow site theme` plus every registered theme.

## Preferences, no-flash and accessibility

`initChrome` (wired automatically by the layouts) stores the site theme, code
theme, language and framework in `localStorage` (`kdc:theme`,
`kdc:code-theme`, `kdc:lang`, `kdc:framework`) and reflects them onto `<html>`
as `data-theme`, `data-code-theme`, `data-lang` and `data-framework`.
`noFlashScript` is inlined in `<head>` so returning visitors never see a flash
of the default theme.

Accessibility notes:

- The skip link, `aria-current="page"` on the active nav item, and labelled
  controls are built in.
- Pickers use native radios inside labelled fieldsets; popovers use the
  `popover`/`popovertarget` API and carry `role="dialog"` + `aria-label`.
- The search dialog is a native `<dialog>` with keyboard support
  (`Ctrl/⌘ K`, `/`, arrow keys, `Enter`, `Esc`).
- `prefers-reduced-motion` disables transitions.
- Decorative icons are `aria-hidden`; standalone icons get an `aria-label`.

### Panel visibility

Use `data-lang-panel="<id>"` and `data-framework-panel="<id>"` (or `"all"`) on
content blocks. `visibilityCss(config)` — injected by `BaseHead` — shows the
block matching the active `data-lang` / `data-framework`.

## Built-by requirement

Every Kolektiv documentation site must show the "Built by Kolektiv Computing"
mark. `Footer.astro` **always** renders `BuiltByMark.astro`; do not remove it.
Override only the destination/label via `config.builtBy`.

## Brand mark

The Kolektiv brand artwork is not vendored here. `Mark.astro` and
`BuiltByMark.astro` render it with `renderBrandMark` from
[`@kolektiv/brand-core`](https://github.com/KolektivComputer/brand):

```astro
---
import { renderBrandMark } from '@kolektiv/brand-core';
const mark = renderBrandMark({ variant: 'builtByMark', title: 'Built by Kolektiv Computing', color: 'currentColor' });
---
<Fragment set:html={mark} />
```

`renderBrandMark` returns an SSR-safe SVG string (`variant` is one of `full`,
`builtByMark`, `computingWordmark`, `wordmark` or `iconMark`; a `title` adds
`role="img"`/`aria-label`, otherwise the mark is `aria-hidden`). `renderBrandMark`
always emits the full built-by canvas, so `Mark.astro` uses the tightly-cropped
`renderBrandVariant('iconMark', …)` instead; `BuiltByMark.astro` uses the
`builtByMark` variant. The components pass the site's configured
`mark`/`logo`/`builtBy.mark` image through first; the brand renderer is the
fallback. This keeps `@kolektiv/brand-core` the single source of truth for the
mark.

## Publishing this package

- Registry: `https://repo.yuri.capital/repository/keel-npm/` (via
  `publishConfig.registry`).
- Fetch is anonymous from `https://repo.yuri.capital/repository/npm-public/`.
- `pnpm build` → `dist/` (ESM + d.ts) with tsup.
- `.github/workflows/publish.yml` publishes on `v*` tags or manual dispatch and
  supports `DRY_RUN`. It uses `YURI_CAPITAL_REPO_USERNAME` /
  `YURI_CAPITAL_REPO_PASSWORD`.
- `.github/workflows/ci.yml` runs typecheck, tests, build and the playground
  build. `.github/workflows/release.yml` creates a GitHub Release from
  `CHANGELOG.md`.

## Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @kolektiv/common-docs-chrome-playground build
```

The `playground/` app is a private Astro site that consumes the built package
through the workspace link. It is the end-to-end verification harness and is not
published.
