import { describe, expect, it } from 'vitest';

import {
  defineDocsChrome,
  findNavItem,
  pageLabelFor,
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

describe('visibilityCss', () => {
  it('emits panel rules for langs and frameworks', () => {
    const css = visibilityCss(config);
    expect(css).toContain('[data-lang-panel],[data-framework-panel]{display:none}');
    expect(css).toContain('html[data-lang="ts"] [data-lang-panel="ts"]');
    expect(css).toContain('html[data-framework="svelte"] [data-framework-panel="svelte"]');
  });
});
