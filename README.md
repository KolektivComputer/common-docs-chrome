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
  switchers: [
    {
      id: 'gradle',
      label: 'Build script',
      options: [
        { id: 'kts', label: 'Kotlin' },
        { id: 'groovy', label: 'Groovy' },
      ],
    },
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

- `DocsChromeConfig`, `NavSection`, `NavItem`, `NavbarConfig`, `FooterConfig`,
  `FooterLink`, `RepoConfig`, `BuiltByConfig`, `SwitcherConfig`, `SwitcherOption`
- `defineDocsChrome(config)` — fills defaults, returns a normalised config
- `pageLabelFor(config, pathname)`, `findNavItem(config, pathname)`
- `resolveNavbar(config, override?)` — navbar flags + links, layered over
  `DEFAULT_NAVBAR`
- `resolveSwitchers(config)` — implicit `lang` plus every generic switcher
- `deriveScm(repo)` — `remotes` (deduped) or a single `Source` link for `url`
- `visibilityCss(config)` — `[data-lang-panel]` / `[data-<id>-panel]` /
  `[data-framework-panel]` rules
- `RESERVED_SWITCHER_IDS`, `DEFAULT_CODE_THEME`, `DEFAULT_THEME_FAMILY`,
  `DEFAULT_BUILT_BY`, `DEFAULT_NAVBAR`

Themes:

- Types `ChromeTheme`, `ThemeFamily`, `ThemeScheme`, `ChromeThemeGroup`,
  `CodeThemeOption`
- `allChromeThemes()` — every built-in palette + daisyUI light/dark
- `themesByFamily(themes?)` — `Record<family, ChromeTheme[]>`
- `groupChromeThemes(themes?, order?)` — ordered `{ family, label, themes }[]`
- `siteThemes(config)` — built-ins filtered by `themeFamilies` + `config.themes`
- `CODE_THEME_OPTIONS` — curated code themes (`follow` + Kolektiv palettes)
- `codeThemeOptions(config?)` — curated code themes available for a site
- `resolveTheme(id, themes?)` — resolve an id or alias
- `shikiThemeForChrome(id, themes?)` — Shiki registration for a theme
- `themeCssFor(themes)` — daisyUI CSS for the supplied themes
- `isBuiltinPalette(id)`, `themeFamilyLabel(family)`

Preferences:

- `ChromePrefs`, `PrefOptions`, `PrefKeys`, `PREF_KEYS`, `DEFAULT_CODE_THEME`
- `readPrefs(options)`, `applyPrefs(prefs, options)`,
  `syncControls(root?, options)`, `initChrome(options)`
- `switcherStorageKey(id)`, `switcherPrefValue(id)`
- `initToggleRelevance(root?)`, `toggleRelevanceScript`,
  `TOGGLE_RELEVANCE_ATTR`
- `noFlashScript` (inline `<head>` string),
  `buildNoFlashScript(keys?, switchers?)`

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
| `Footer.astro` | Footer with links, the identity lockup, the built-by mark and copyright |
| `ThemePicker.astro` | Site themes grouped by family + curated code themes |
| `LangToggle.astro` | Language switch (renders only when `langs` is set) |
| `Switcher.astro` | Generic segmented switcher (renders a `SwitcherConfig`) |
| `FrameworkPicker.astro` | Framework switch (renders only when `frameworks` is set) |
| `ScmMenu.astro` | Source-control link (one) or popover menu (many) |
| `Mark.astro` | Logo/mark image, with the `@kolektiv/brand-core` icon mark as fallback |
| `BuiltByMark.astro` | Always-on "Built by Kolektiv Computing" mark; `markClass` sizes the artwork (default `h-10 w-auto`) |
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
| `repo` | `RepoConfig` | — | `{ url, branch?, editBaseUrl?, remotes? }`. |
| `nav` | `NavSection[]` | `[]` | Sidebar/nav model. |
| `defaultTheme` | `string` | — | Required. Applied on first visit + SSR. |
| `defaultCodeTheme` | `string` | `follow` | A theme id or `follow`. |
| `themeFamilies` | `ThemeFamily[]` | all | Restrict + order families in the picker. |
| `themeFamily` | `ThemeFamily` | `site` | Family assigned to `themes` entries. |
| `themes` | `ChromeTheme[]` | `[]` | Site-specific themes (override by id). |
| `langs` | `{ id, label }[]` | — | Enables `LangToggle` (the implicit `lang` switcher). |
| `frameworks` | `{ id, label }[]` | — | Enables `FrameworkPicker`. |
| `defaultLang` | `string` | first `langs` | SSR default. |
| `defaultFramework` | `string` | first `frameworks` | SSR default. |
| `switchers` | `SwitcherConfig[]` | `[]` | Extra generic switchers (see below). |
| `navbar` | `NavbarConfig` | all shown | Toggle built-in controls and add navbar links (see below). |
| `scm` | `FooterLink[]` | `repo.remotes`, else one `Source` link for `repo.url` | Source-control links; deduplicated by `href`. |
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

`ThemePicker` groups the site themes by family (one `menu-title` heading per
family, ordered by `themeFamilies`) and offers a **curated** code-theme list —
`Follow site theme`, the Catppuccin flavours (shown by flavour, e.g. `Mocha`),
Nord, and the Kolektiv palettes. The curated list is restricted to the themes
that exist for the site, then any `config.themes` are appended, so custom site
themes appear in both lists. `codeThemeOptions(config)` returns that list and
`CODE_THEME_OPTIONS` is the curated constant.

## Source-control links

`ScmMenu` renders the deduplicated `scm` list. With **one** link it is a single
icon link (`title` / `aria-label` = the link label; external links get
`target`/`rel`); with **several** it opens the popover menu; with **none** it
renders nothing.

By default `scm` is derived from `repo`: `repo.remotes` when supplied
(deduplicated by `href`, order preserved), otherwise a single
`{ label: 'Source', href: repo.url }`. An explicit `config.scm` always wins.

```ts
repo: {
  url: 'https://github.com/KolektivComputer/keel',
  remotes: [
    { label: 'GitHub', href: 'https://github.com/KolektivComputer/keel' },
    { label: 'yuri.capital', href: 'https://yuri.capital/keel' },
  ],
},
```

## Generic switchers

Besides the language pair and the framework dropdown, a site can declare any
number of named either/or (or n-option) switches — for example a `gradle`
switch between `kts` and `groovy`:

```ts
switchers: [
  {
    id: 'gradle',
    label: 'Build script',
    options: [
      { id: 'kts', label: 'Kotlin' },
      { id: 'groovy', label: 'Groovy' },
    ],
  },
],
```

`SwitcherConfig` is `{ id, label?, options: { id, label }[], default? }`.
`resolveSwitchers(config)` returns the implicit `lang` switcher (derived from
`langs`, when set) followed by every configured switcher; empty-option switchers
are dropped and the reserved ids `lang`, `framework`, `theme` and `codeTheme`
are ignored, because those are owned by `LangToggle`, `FrameworkPicker` and
`ThemePicker` and already have dedicated preference keys, `<html>` attributes
and no-flash handling.

Each switcher gets an `<html data-<id>>` attribute and a matching panel
contract:

```html
<html data-gradle="kts">
  <!-- shown for any option: --> <div data-gradle-panel="all">…</div>
  <!-- shown for one option: --> <div data-gradle-panel="kts">…</div>
  <div data-gradle-panel="groovy">…</div>
</html>
```

`visibilityCss(config)` hides every `[data-<id>-panel]` (plus
`[data-framework-panel]`) and reveals the panels matching the active
`data-<id>`. `Navbar` renders one `Switcher.astro` per configured switcher,
with `data-kdc-toggle="<id>"` so a control is hidden on pages that have no
matching panel.

Generic switcher controls use `data-pref="sw:<id>"` (the built-in `lang` /
`framework` controls keep `data-pref="lang"` / `data-pref="framework"`).
`initChrome` routes `sw:<id>` changes into `applyPrefs`, which persists them to
`kdc:<id>` and reflects them onto `data-<id>`. `syncControls` supports radio
groups (`checked`) and `<select>` (`value`) and fills label slots
`[data-switcher-current="<id>"]`, next to the built-in `[data-*-current]` slots:

```html
<input type="radio" name="kdc-gradle" data-pref="sw:gradle" value="kts" />
<span data-switcher-current="gradle"></span>
```

Both the generic switchers and the framework dropdown persist through the same
chrome preference state (`[data-pref]` + `localStorage` + `<html>` attributes),
so a single `initChrome` call keeps every control in sync. The framework
dropdown stays a distinct concept: its options are dev-chosen and it is not
merged into the generic switcher.

## Customising the navbar

`Navbar` renders a fixed set of controls. Without forking, a site can hide any
built-in control, add its own links, and inject content into named slots. All
of it is optional: omitting `navbar` (and every slot) renders the stock navbar
exactly.

```ts
navbar: {
  showBrand: true,     // brand lockup
  showLabel: true,     // current page label
  showLang: true,      // language switch
  showSwitchers: true, // extra configured switchers
  showFramework: true, // framework dropdown
  showScm: true,       // SCM menu
  showTheme: true,     // theme picker
  links: [
    { label: 'Blog', href: '/blog' },
    { label: 'GitHub', href: 'https://github.com/acme/site', external: true },
  ],
},
```

`NavbarConfig` is `{ showBrand?, …, showTheme?, links? }` and every flag
defaults to `true`. `links` accepts `NavItem`s (`{ label, href, icon?,
external? }`) rendered as ghost buttons after the switchers and before the
SCM/theme controls; external links open in a new tab, non-external links go
through `path()` so they respect `base`, and duplicate `href`s are collapsed.

The layouts also accept a per-page `navbar` override — merged over
`config.navbar` — and forward four named slots:

| Slot | Position |
| --- | --- |
| `brand` | Replaces the brand lockup when filled. |
| `navbar-start` | Inside `navbar-start`, after the brand. |
| `navbar-center` | Inside `navbar-center`, replacing the page label when filled. |
| `navbar-end` | At the very end of the end cluster. |

```astro
---
import DocsLayout from '@kolektiv/common-docs-chrome/astro/DocsLayout.astro';
import { docs } from '../docs-chrome';
---

<DocsLayout config={docs} title="Overview" navbar={{ showTheme: false }}>
  <a slot="navbar-end" href="/changelog">Changelog</a>
  <p>Page content, as usual.</p>
</DocsLayout>
```

`resolveNavbar(config, override?)` returns the merged `{ showBrand, …,
links }` and is what the layouts use; `DEFAULT_NAVBAR` holds the all-true
defaults.

## Preferences, no-flash and accessibility

`initChrome` (wired automatically by the layouts) stores the site theme, code
theme, language, framework and every generic switcher in `localStorage`
(`kdc:theme`, `kdc:code-theme`, `kdc:lang`, `kdc:framework`, `kdc:<id>`) and
reflects them onto `<html>` as `data-theme`, `data-code-theme`, `data-lang`,
`data-framework` and `data-<id>`. `buildNoFlashScript(keys?, switchers?)` is
inlined in `<head>` so returning visitors never see a flash of the default
theme or an extra switcher's default.

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

Use `data-lang-panel="<id>"`, `data-<id>-panel="<id>"` (for a generic switcher)
and `data-framework-panel="<id>"` — or `"all"` — on content blocks.
`visibilityCss(config)` — injected by `BaseHead` — shows the block matching the
active `data-lang` / `data-<id>` / `data-framework`.

## Built-by requirement

Every Kolektiv documentation site must show the "Built by Kolektiv Computing"
mark. `Footer.astro` **always** renders `BuiltByMark.astro`; do not remove it.
Override only the destination/label via `config.builtBy`.

The footer identity column reads top-to-bottom as the `Mark` + `config.name`
lockup, the tagline, the built-by mark (a slightly larger gap below the
identity), then the copyright line (a small gap above it). `BuiltByMark` takes
`markClass` for the artwork classes — default `h-10 w-auto`, matching the brand
docs footer — and `class` for the `<a>` wrapper. The artwork viewBox is
2761×1415 (about 1.95:1), so size it by height; never use square `size-*`
utilities.

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
