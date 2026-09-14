# Changelog

All notable changes to common-docs-chrome are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
