import { describe, expect, it } from 'vitest';

import { defineDocsChrome } from '../src/core/config.js';
import {
  allChromeThemes,
  groupChromeThemes,
  isBuiltinPalette,
  resolveTheme,
  shikiThemeForChrome,
  siteThemes,
  themeCssFor,
  themesByFamily,
} from '../src/core/themes.js';

const SITE_CONFIG = defineDocsChrome({
  name: 'Kalendee',
  description: 'Self-hosted CalDAV.',
  siteUrl: 'https://docs.kalendee.example',
  defaultTheme: 'kolektiv-dark',
  themeFamilies: ['kolektiv', 'catppuccin'],
  themeFamily: 'kalendee',
  themes: [
    {
      id: 'kalendee-dark',
      label: 'Kalendee Dark',
      scheme: 'dark',
      shiki: 'catppuccin-mocha',
      colors: {
        'base-100': '#0b1020',
        'base-content': '#e6e9f5',
        primary: '#6f8cff',
      },
    },
  ],
  nav: [
    {
      label: 'Guides',
      items: [
        { label: 'Overview', href: '/' },
        { label: 'Install', href: '/docs/install' },
      ],
    },
  ],
});

describe('allChromeThemes', () => {
  it('includes every Kolektiv palette and the daisyUI built-ins', () => {
    const ids = allChromeThemes().map((theme) => theme.id);
    for (const id of [
      'nord',
      'catppuccin-latte',
      'catppuccin-frappe',
      'catppuccin-macchiato',
      'catppuccin-mocha',
      'kolektiv-light',
      'kolektiv-dark',
      'light',
      'dark',
    ]) {
      expect(ids).toContain(id);
    }
  });

  it('assigns families and colour swatches', () => {
    const themes = allChromeThemes();
    expect(resolveTheme('nord', themes)?.family).toBe('nord');
    expect(resolveTheme('catppuccin-mocha', themes)?.family).toBe('catppuccin');
    expect(resolveTheme('kolektiv-dark', themes)?.family).toBe('kolektiv');
    expect(resolveTheme('light', themes)?.family).toBe('daisyui');
    expect(resolveTheme('catppuccin-mocha', themes)?.colors?.['base-100']).toBeTruthy();
  });
});

describe('themesByFamily / groupChromeThemes', () => {
  it('groups themes by family', () => {
    const grouped = themesByFamily();
    expect(grouped.catppuccin).toHaveLength(4);
    expect(grouped.kolektiv).toHaveLength(2);
    expect(grouped.nord).toHaveLength(1);
    expect(grouped.daisyui).toHaveLength(2);
  });

  it('honours a custom family order', () => {
    const groups = groupChromeThemes(allChromeThemes(), ['catppuccin', 'daisyui']);
    expect(groups[0]?.family).toBe('catppuccin');
    expect(groups[1]?.family).toBe('daisyui');
    expect(groups[0]?.label).toBe('Catppuccin');
  });
});

describe('resolveTheme', () => {
  it('resolves ids and aliases', () => {
    expect(resolveTheme('kolektiv-dark')?.label).toBe('Kolektiv Dark');
    expect(resolveTheme('kolektivcomputer-dark')?.id).toBe('kolektiv-dark');
    expect(resolveTheme('does-not-exist')).toBeUndefined();
  });
});

describe('siteThemes', () => {
  it('restricts built-ins to the configured families', () => {
    const ids = siteThemes(SITE_CONFIG).map((theme) => theme.id);
    expect(ids).toContain('kolektiv-dark');
    expect(ids).toContain('catppuccin-mocha');
    expect(ids).not.toContain('nord');
    expect(ids).not.toContain('light');
  });

  it('merges site themes and assigns the site family', () => {
    const kalendee = resolveTheme('kalendee-dark', siteThemes(SITE_CONFIG));
    expect(kalendee?.family).toBe('kalendee');
    expect(kalendee?.colors?.['primary']).toBe('#6f8cff');
  });

  it('lets a site theme override a built-in with the same id', () => {
    const themes = siteThemes({
      ...SITE_CONFIG,
      themeFamilies: ['kolektiv'],
      themes: [
        {
          id: 'kolektiv-dark',
          label: 'Kolektiv Dark (site)',
          scheme: 'dark',
          family: 'kolektiv',
          shiki: 'kolektiv-dark',
        },
      ],
    });
    expect(resolveTheme('kolektiv-dark', themes)?.label).toBe('Kolektiv Dark (site)');
    expect(themes.filter((theme) => theme.id === 'kolektiv-dark')).toHaveLength(1);
  });
});

describe('shikiThemeForChrome', () => {
  it('returns registrations for the Kolektiv palettes', () => {
    const dark = shikiThemeForChrome('kolektiv-dark');
    expect(typeof dark).toBe('object');
    expect((dark as { name: string }).name).toBe('kolektiv-dark');
  });

  it('returns preset names for the other palettes', () => {
    expect(shikiThemeForChrome('catppuccin-mocha')).toBe('catppuccin-mocha');
    expect(shikiThemeForChrome('nord')).toBe('nord');
    expect(shikiThemeForChrome('light')).toBe('github-light');
    expect(shikiThemeForChrome('dark')).toBe('github-dark');
  });
});

describe('themeCssFor', () => {
  it('emits daisyUI variables for site themes', () => {
    const css = themeCssFor([resolveTheme('kalendee-dark', siteThemes(SITE_CONFIG))!]);
    expect(css).toContain("html[data-theme='kalendee-dark']");
    expect(css).toContain('--color-base-100: #0b1020;');
    expect(css).toContain('color-scheme: dark;');
  });

  it('reuses palette CSS for built-in palettes', () => {
    const theme = resolveTheme('kolektiv-dark')!;
    expect(isBuiltinPalette(theme.id)).toBe(true);
    expect(themeCssFor([theme])).toContain("html[data-theme='kolektiv-dark']");
  });
});
