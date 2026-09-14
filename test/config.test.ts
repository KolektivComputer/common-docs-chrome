import { describe, expect, it } from 'vitest';

import {
  DEFAULT_NAVBAR,
  defineDocsChrome,
  findNavItem,
  pageLabelFor,
  resolveNavbar,
  resolveSwitchers,
  visibilityCss,
} from '../src/core/config.js';

const config = defineDocsChrome({
  name: 'Keel',
  description: 'Host-owned routing.',
  siteUrl: 'https://keel.example',
  base: '/docs/',
  defaultTheme: 'catppuccin-mocha',
  nav: [
    {
      label: 'Getting started',
      items: [
        { label: 'Overview', href: '/', description: 'Start here' },
        { label: 'Install', href: '/install' },
        { label: 'GitHub', href: 'https://github.com/KolektivComputer/keel', external: true },
      ],
    },
  ],
  repo: { url: 'https://github.com/KolektivComputer/keel' },
  langs: [
    { id: 'ts', label: 'TS' },
    { id: 'js', label: 'JS' },
  ],
  frameworks: [{ id: 'svelte', label: 'Svelte' }],
});

const scriptConfig = defineDocsChrome({
  name: 'Keel',
  description: 'Generic switchers.',
  siteUrl: 'https://keel.example',
  defaultTheme: 'catppuccin-mocha',
  nav: [],
  defaultLang: 'ts',
  langs: [
    { id: 'ts', label: 'TS' },
    { id: 'js', label: 'JS' },
  ],
  switchers: [
    {
      id: 'gradle',
      label: 'Build script',
      default: 'kts',
      options: [
        { id: 'kts', label: 'Kotlin' },
        { id: 'groovy', label: 'Groovy' },
      ],
    },
  ],
});

describe('defineDocsChrome', () => {
  it('fills in defaults', () => {
    expect(config.title).toBe('Keel');
    expect(config.base).toBe('/docs/');
    expect(config.defaultCodeTheme).toBe('follow');
    expect(config.themeFamily).toBe('site');
    expect(config.builtBy?.label).toBe('Built by Kolektiv Computing');
    expect(config.footer?.copyright).toContain('{year}');
  });

  it('derives SCM links from the repo when none are provided', () => {
    expect(config.scm?.length).toBeGreaterThan(0);
    expect(config.scm?.[0]?.href).toBe('https://github.com/KolektivComputer/keel');
  });

  it('derives a single Source link from repo.url', () => {
    const cfg = defineDocsChrome({
      name: 'X',
      description: 'd',
      siteUrl: 'https://x.example',
      defaultTheme: 'dark',
      nav: [],
      repo: { url: 'https://github.com/KolektivComputer/keel' },
    });
    expect(cfg.scm).toEqual([
      { label: 'Source', href: 'https://github.com/KolektivComputer/keel' },
    ]);
  });

  it('derives scm from repo.remotes, deduped and ordered', () => {
    const cfg = defineDocsChrome({
      name: 'X',
      description: 'd',
      siteUrl: 'https://x.example',
      defaultTheme: 'dark',
      nav: [],
      repo: {
        url: 'https://github.com/KolektivComputer/keel',
        remotes: [
          { label: 'GitHub', href: 'https://github.com/KolektivComputer/keel' },
          { label: 'yuri.capital', href: 'https://yuri.capital/keel' },
          { label: 'Duplicate', href: 'https://github.com/KolektivComputer/keel' },
        ],
      },
    });
    expect(cfg.scm).toEqual([
      { label: 'GitHub', href: 'https://github.com/KolektivComputer/keel' },
      { label: 'yuri.capital', href: 'https://yuri.capital/keel' },
    ]);
  });

  it('lets an explicit scm win over the repo derivation', () => {
    const scm = [{ label: 'Mirror', href: 'https://mirror.example/keel' }];
    const cfg = defineDocsChrome({
      name: 'X',
      description: 'd',
      siteUrl: 'https://x.example',
      defaultTheme: 'dark',
      nav: [],
      scm,
      repo: {
        url: 'https://github.com/KolektivComputer/keel',
        remotes: [{ label: 'GitHub', href: 'https://github.com/KolektivComputer/keel' }],
      },
    });
    expect(cfg.scm).toBe(scm);
  });

  it('does not mutate the input', () => {
    const input = {
      name: 'X',
      description: 'd',
      siteUrl: 'https://x.example',
      defaultTheme: 'dark',
      nav: [],
    };
    const next = defineDocsChrome(input);
    expect('title' in input).toBe(false);
    expect(next.title).toBe('X');
  });
});

describe('navigation helpers', () => {
  it('finds items with a non-root base', () => {
    expect(findNavItem(config, '/docs/install')?.label).toBe('Install');
    expect(findNavItem(config, '/docs/')?.label).toBe('Overview');
    expect(findNavItem(config, '/docs/missing')).toBeUndefined();
  });

  it('falls back to the product title', () => {
    expect(pageLabelFor(config, '/docs/install')).toBe('Install');
    expect(pageLabelFor(config, '/docs/nope')).toBe('Keel');
  });
});

describe('resolveSwitchers', () => {
  it('derives the implicit lang switcher from langs', () => {
    const [lang] = resolveSwitchers(config);
    expect(lang).toEqual({
      id: 'lang',
      label: 'Language',
      options: config.langs,
      default: undefined,
    });
  });

  it('appends custom switchers after the implicit lang switcher', () => {
    const switchers = resolveSwitchers(scriptConfig);
    expect(switchers.map((switcher) => switcher.id)).toEqual(['lang', 'gradle']);
    expect(switchers[1]?.default).toBe('kts');
  });

  it('omits the implicit lang switcher when no langs are configured', () => {
    const noLangs = defineDocsChrome({
      name: 'X',
      description: 'd',
      siteUrl: 'https://x.example',
      defaultTheme: 'dark',
      nav: [],
    });
    expect(resolveSwitchers(noLangs)).toEqual([]);
  });

  it('ignores reserved ids so built-in controls stay authoritative', () => {
    const reserved = defineDocsChrome({
      name: 'X',
      description: 'd',
      siteUrl: 'https://x.example',
      defaultTheme: 'dark',
      nav: [],
      switchers: [
        { id: 'lang', options: [{ id: 'a', label: 'A' }] },
        { id: 'framework', options: [{ id: 'b', label: 'B' }] },
        { id: 'theme', options: [{ id: 'c', label: 'C' }] },
        { id: 'codeTheme', options: [{ id: 'd', label: 'D' }] },
        { id: 'gradle', options: [{ id: 'kts', label: 'Kotlin' }] },
      ],
    });
    expect(resolveSwitchers(reserved).map((switcher) => switcher.id)).toEqual(['gradle']);
  });

  it('skips switchers with no options', () => {
    const empty = defineDocsChrome({
      name: 'X',
      description: 'd',
      siteUrl: 'https://x.example',
      defaultTheme: 'dark',
      nav: [],
      switchers: [{ id: 'gradle', options: [] }],
    });
    expect(resolveSwitchers(empty)).toEqual([]);
  });
});

describe('resolveNavbar', () => {
  it('defaults every flag to true with no links', () => {
    expect(DEFAULT_NAVBAR).toEqual({
      showBrand: true,
      showLabel: true,
      showLang: true,
      showSwitchers: true,
      showFramework: true,
      showScm: true,
      showTheme: true,
    });
    expect(resolveNavbar(config)).toEqual({ ...DEFAULT_NAVBAR, links: [] });
  });

  it('merges the site config over the defaults', () => {
    const withNavbar = defineDocsChrome({
      name: 'X',
      description: 'd',
      siteUrl: 'https://x.example',
      defaultTheme: 'dark',
      nav: [],
      navbar: { showTheme: false, showScm: false },
    });
    expect(resolveNavbar(withNavbar)).toMatchObject({
      showBrand: true,
      showTheme: false,
      showScm: false,
    });
  });

  it('lets a per-page override beat the site config', () => {
    const withNavbar = defineDocsChrome({
      name: 'X',
      description: 'd',
      siteUrl: 'https://x.example',
      defaultTheme: 'dark',
      nav: [],
      navbar: { showTheme: false, showLang: false },
    });
    expect(
      resolveNavbar(withNavbar, { showTheme: true, showLabel: false }),
    ).toMatchObject({ showTheme: true, showLang: false, showLabel: false });
  });

  it('keeps the last supplied links array', () => {
    const siteLinks = [{ label: 'Site', href: '/site' }];
    const pageLinks = [{ label: 'Page', href: '/page' }];
    const withNavbar = defineDocsChrome({
      name: 'X',
      description: 'd',
      siteUrl: 'https://x.example',
      defaultTheme: 'dark',
      nav: [],
      navbar: { links: siteLinks },
    });
    expect(resolveNavbar(withNavbar).links).toEqual(siteLinks);
    expect(resolveNavbar(withNavbar, { links: pageLinks }).links).toEqual(pageLinks);
  });

  it('honours explicit false and ignores undefined flags', () => {
    const withNavbar = defineDocsChrome({
      name: 'X',
      description: 'd',
      siteUrl: 'https://x.example',
      defaultTheme: 'dark',
      nav: [],
      navbar: { showBrand: false, showLabel: undefined },
    });
    const resolved = resolveNavbar(withNavbar, { showScm: undefined });
    expect(resolved.showBrand).toBe(false);
    expect(resolved.showLabel).toBe(true);
    expect(resolved.showScm).toBe(true);
  });
});

describe('visibilityCss', () => {
  it('emits panel rules for langs and frameworks', () => {
    const css = visibilityCss(config);
    expect(css).toContain('[data-lang-panel],[data-framework-panel]{display:none}');
    expect(css).toContain('html[data-lang="ts"] [data-lang-panel="ts"]');
    expect(css).toContain('html[data-framework="svelte"] [data-framework-panel="svelte"]');
  });

  it('emits base and reveal rules for a custom switcher', () => {
    const css = visibilityCss(scriptConfig);
    expect(css).toContain('[data-lang-panel],[data-gradle-panel],[data-framework-panel]{display:none}');
    expect(css).toContain('html[data-lang="ts"] [data-lang-panel="all"]');
    expect(css).toContain('html[data-gradle="kts"] [data-gradle-panel="all"]');
    expect(css).toContain('html[data-gradle="kts"] [data-gradle-panel="kts"]{display:block}');
    expect(css).toContain('html[data-gradle="groovy"] [data-gradle-panel="groovy"]{display:block}');
  });

  it('keeps the exact legacy lang selectors when a custom switcher is present', () => {
    const css = visibilityCss(scriptConfig);
    expect(css).toContain(
      'html[data-lang="ts"] [data-lang-panel="all"],html[data-lang="ts"] [data-lang-panel="ts"]{display:block}',
    );
  });
});
