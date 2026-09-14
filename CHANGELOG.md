# Changelog

All notable changes to common-docs-chrome are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.1-SNAPSHOT.6] - 2026-09-14

### Added

- Curated code themes. Core exports `CodeThemeOption`, `CODE_THEME_OPTIONS`
  (`follow` plus the Catppuccin flavours, Nord and the Kolektiv palettes) and
  `codeThemeOptions(config)`, which restricts the list to the themes a site
  offers (so `themeFamilies` applies) and appends any `config.themes`.
  `ThemePicker` renders site themes grouped by family — one `menu-title` per
  family, Catppuccin shown by flavour (for example `Mocha`) — with the curated
  code themes below `follow`.
- `RepoConfig.remotes` (`FooterLink[]`). When supplied, `defineDocsChrome`
  derives `scm` from it, deduplicated by `href` and order-preserving;
  otherwise it derives a single `{ label: 'Source', href: repo.url }`. An
  explicit `scm` still wins. `deriveScm(repo)` is exported.

### Changed

- `ScmMenu` renders a single icon link when the deduplicated `scm` list has one
  entry (previously it always opened a popover); several links keep the popover
  menu and zero links render nothing. `defineDocsChrome` no longer emits the
  duplicate `Source` / `yuri.capital` pair for `repo.url`.

## [0.0.1-SNAPSHOT.5] - 2026-09-14

### Added

- Customizable navbar. `DocsChromeConfig.navbar` (`NavbarConfig`) toggles each
  built-in control (`showBrand`, `showLabel`, `showLang`, `showSwitchers`,
  `showFramework`, `showScm`, `showTheme`) and adds `links`; `resolveNavbar`
  layers `DEFAULT_NAVBAR`, the site config and a per-page override, and the
  Astro layouts accept a `navbar` prop. `BaseLayout`/`DocsLayout` forward
  `brand`, `navbar-start`, `navbar-center` and `navbar-end` slots. Defaults
  render the stock navbar unchanged.

## [0.0.1-SNAPSHOT.4] - 2026-09-14

### Added

- Generic documentation switchers. `DocsChromeConfig.switchers` accepts any
  number of named switches (`SwitcherConfig`/`SwitcherOption`) in addition to
  the built-in language pair; each gets an `<html data-<id>>` attribute, a
  `[data-<id>-panel]` visibility contract (via `resolveSwitchers` /
  `visibilityCss`) and `data-pref="sw:<id>"` controls backed by `kdc:<id>`
  prefs. `ChromePrefs` gains `switchers` and `PrefOptions` gains
  `switcherAllowed` / `defaultSwitchers`; `buildNoFlashScript(keys?, switchers?)`
  and `initToggleRelevance` cover every switcher kind. New `Switcher.astro`;
  `LangToggle.astro` now delegates to it. Backward compatible: `langs`,
  `defaultLang`, `[data-lang-panel]`, `PREF_KEYS`, `noFlashScript`,
  `initChrome`, `visibilityCss` and `LangToggle` keep working unchanged.

## [0.0.1-SNAPSHOT.3] - 2026-09-14

### Changed

- feat: render the brand mark from `@kolektiv/brand-core`. `Mark.astro` and
  `BuiltByMark.astro` no longer vendor Kolektiv SVG artwork; the brand package
  is the single source of truth for the mark.

## [0.0.1-SNAPSHOT.2] - 2026-09-14

### Changed

- Widened the theme picker popover to `w-96` and capped it with
  `max-w-[calc(100vw-2rem)]` so it stays on-screen on small viewports.

### Added

- Language and framework toggles now declare their relevance via
  `data-kdc-toggle="lang"` / `data-kdc-toggle="framework"`. The new
  `initToggleRelevance` core helper (and its dependency-free
  `toggleRelevanceScript` inline form) hides a toggle on any page that has no
  matching `[data-lang-panel]` / `[data-framework-panel]` block. Both layouts
  run the inline script before first paint, so relevant pages never flash the
  controls.

## [0.0.1-SNAPSHOT.1] - 2026-09-14

### Added

- `@kolektiv/common-docs-chrome` — framework-agnostic core plus Astro chrome
  components for Kolektiv documentation sites.
- Core exports: a unified theme registry (`themes`), a preference engine
  (`prefs`), Shiki config/theme helpers (`shiki`), a typed site config with
  defaults (`config`) and base-aware path helpers (`paths`).
- Astro components: `BaseHead`, `BaseLayout`, `DocsLayout`, `Navbar`, `Sidebar`,
  `Footer`, `ThemePicker`, `LangToggle`, `FrameworkPicker`, `ScmMenu`, `Mark`,
  `BuiltByMark` and `SearchDialog`.
- `styles/chrome.css` (Tailwind 4 + daisyUI 5 + `@kolektiv/themes/theme.css` +
  `@source`) and `styles/brand-fonts.css` (Kolektiv brand typography).
- Private Astro playground used as the build/test harness.
- Tag-driven publish workflow targeting the hosted `keel-npm` repository.
