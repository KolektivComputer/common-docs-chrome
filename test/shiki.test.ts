import { describe, expect, it } from 'vitest';

import {
  createShikiConfig,
  defaultShikiThemes,
  hasShikiTheme,
  shikiThemeCss,
} from '../src/core/shiki.js';
import { allChromeThemes, siteThemes } from '../src/core/themes.js';

describe('defaultShikiThemes', () => {
  it('registers a Shiki theme for every built-in chrome theme', () => {
    for (const theme of allChromeThemes()) {
      expect(defaultShikiThemes[theme.id], `missing shiki for ${theme.id}`).toBeTruthy();
    }
  });

  it('uses the generated Kolektiv registrations', () => {
    expect(typeof defaultShikiThemes['kolektiv-dark']).toBe('object');
    expect(defaultShikiThemes['catppuccin-mocha']).toBe('catppuccin-mocha');
    expect(defaultShikiThemes.light).toBe('github-light');
  });
});

describe('createShikiConfig', () => {
  it('returns an Astro-compatible config with defaultColor disabled', () => {
    const config = createShikiConfig();
    expect(config.defaultColor).toBe(false);
    expect(Object.keys(config.themes)).toContain('kolektiv-dark');
  });

  it('registers site-specific themes', () => {
    const themes = siteThemes({
      themeFamily: 'kalendee',
      themes: [
        {
          id: 'kalendee-dark',
          label: 'Kalendee Dark',
          scheme: 'dark',
          shiki: 'catppuccin-mocha',
        },
      ],
    });
    const config = createShikiConfig(themes);
    expect(config.themes['kalendee-dark']).toBe('catppuccin-mocha');
    expect(hasShikiTheme('kalendee-dark', themes)).toBe(true);
  });
});

describe('shikiThemeCss', () => {
  it('emits follow and explicit rules for each theme', () => {
    const css = shikiThemeCss(allChromeThemes());
    expect(css).toContain('html[data-code-theme="kolektiv-dark"] .astro-code');
    expect(css).toContain(
      'html[data-code-theme="follow"][data-theme="catppuccin-latte"] .astro-code',
    );
    expect(css).toContain('--shiki-kolektiv-dark-bg');
  });
});
