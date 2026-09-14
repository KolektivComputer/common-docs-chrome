import { beforeEach, describe, expect, it } from 'vitest';

import {
  applyPrefs,
  initChrome,
  initToggleRelevance,
  noFlashScript,
  readPrefs,
  syncControls,
  toggleRelevanceScript,
  TOGGLE_RELEVANCE_ATTR,
  type PrefOptions,
} from '../src/core/prefs.js';

const OPTIONS: PrefOptions = {
  defaultTheme: 'kolektiv-dark',
  defaultCodeTheme: 'follow',
  defaultLang: 'ts',
  defaultFramework: 'svelte',
  themes: ['kolektiv-dark', 'light'],
  langs: ['ts', 'js'],
  frameworks: ['svelte', 'react'],
};

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  const root = document.documentElement;
  for (const attr of ['data-theme', 'data-code-theme', 'data-lang', 'data-framework']) {
    root.removeAttribute(attr);
  }
});

describe('readPrefs', () => {
  it('returns the configured defaults when storage is empty', () => {
    expect(readPrefs(OPTIONS)).toEqual({
      theme: 'kolektiv-dark',
      codeTheme: 'follow',
      lang: 'ts',
      framework: 'svelte',
    });
  });

  it('rejects unknown stored values against the allowed lists', () => {
    localStorage.setItem('kdc:theme', 'not-a-theme');
    localStorage.setItem('kdc:lang', 'rust');
    const prefs = readPrefs(OPTIONS);
    expect(prefs.theme).toBe('kolektiv-dark');
    expect(prefs.lang).toBe('ts');
  });

  it('accepts valid stored values', () => {
    localStorage.setItem('kdc:theme', 'light');
    localStorage.setItem('kdc:code-theme', 'nord');
    localStorage.setItem('kdc:framework', 'react');
    expect(readPrefs(OPTIONS)).toEqual({
      theme: 'light',
      codeTheme: 'nord',
      lang: 'ts',
      framework: 'react',
    });
  });
});

describe('applyPrefs', () => {
  it('writes data attributes and storage', () => {
    applyPrefs({ theme: 'light', codeTheme: 'nord' }, OPTIONS);
    const root = document.documentElement;
    expect(root.getAttribute('data-theme')).toBe('light');
    expect(root.getAttribute('data-code-theme')).toBe('nord');
    expect(root.getAttribute('data-lang')).toBe('ts');
    expect(localStorage.getItem('kdc:theme')).toBe('light');
    expect(localStorage.getItem('kdc:code-theme')).toBe('nord');
  });

  it('merges partial updates over stored values', () => {
    applyPrefs({ theme: 'light' }, OPTIONS);
    applyPrefs({ codeTheme: 'nord' }, OPTIONS);
    expect(readPrefs(OPTIONS).theme).toBe('light');
    expect(readPrefs(OPTIONS).codeTheme).toBe('nord');
  });
});

describe('syncControls', () => {
  it('checks the matching control and updates label slots', () => {
    document.body.innerHTML = `
      <input type="radio" name="theme" data-pref="theme" data-label="Kolektiv Dark" value="kolektiv-dark" />
      <input type="radio" name="theme" data-pref="theme" data-label="Light" value="light" />
      <span data-theme-current></span>
    `;
    localStorage.setItem('kdc:theme', 'light');
    syncControls(document, OPTIONS);
    const [dark, light] = document.querySelectorAll<HTMLInputElement>('[data-pref="theme"]');
    expect(dark?.checked).toBe(false);
    expect(light?.checked).toBe(true);
    expect(document.querySelector('[data-theme-current]')?.textContent).toBe('Light');
  });
});

describe('initChrome', () => {
  it('applies defaults and reacts to pref changes', () => {
    initChrome(OPTIONS);
    expect(document.documentElement.getAttribute('data-theme')).toBe('kolektiv-dark');

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'theme';
    input.dataset.pref = 'theme';
    input.value = 'light';
    input.checked = true;
    document.body.appendChild(input);
    input.dispatchEvent(new Event('change', { bubbles: true }));

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('kdc:theme')).toBe('light');
  });
});

describe('initToggleRelevance', () => {
  function mount(panel: 'lang' | 'framework' | 'both' | 'none'): void {
    document.body.innerHTML = `
      <div class="nav">
        <div data-kdc-toggle="lang"><input type="radio" data-pref="lang" value="ts" /></div>
        <button data-kdc-toggle="framework"></button>
      </div>
      ${panel === 'lang' || panel === 'both' ? '<div data-lang-panel="all"></div>' : ''}
      ${panel === 'framework' || panel === 'both' ? '<div data-framework-panel="all"></div>' : ''}
    `;
  }

  function toggle(kind: 'lang' | 'framework'): HTMLElement {
    return document.querySelector<HTMLElement>(`[${TOGGLE_RELEVANCE_ATTR}="${kind}"]`)!;
  }

  it('hides both toggles when no panels are present', () => {
    mount('none');
    initToggleRelevance();
    expect(toggle('lang').style.display).toBe('none');
    expect(toggle('framework').style.display).toBe('none');
  });

  it('shows the lang toggle only when a language panel exists', () => {
    mount('lang');
    initToggleRelevance();
    expect(toggle('lang').style.display).toBe('');
    expect(toggle('framework').style.display).toBe('none');
  });

  it('shows the framework toggle only when a framework panel exists', () => {
    mount('framework');
    initToggleRelevance();
    expect(toggle('lang').style.display).toBe('none');
    expect(toggle('framework').style.display).toBe('');
  });

  it('is idempotent across repeated runs', () => {
    mount('both');
    initToggleRelevance();
    initToggleRelevance();
    expect(toggle('lang').style.display).toBe('');
    expect(toggle('framework').style.display).toBe('');
  });

  it('ignores unscoped toggle attributes', () => {
    document.body.innerHTML = '<div data-kdc-toggle="other"></div>';
    initToggleRelevance();
    expect(document.querySelector<HTMLElement>('[data-kdc-toggle="other"]')!.style.display).toBe('');
  });
});

describe('toggleRelevanceScript', () => {
  it('matches initToggleRelevance when executed in the page', () => {
    document.body.innerHTML = `
      <div data-kdc-toggle="lang"></div>
      <div data-kdc-toggle="framework"></div>
      <div data-lang-panel="all"></div>
    `;
    new Function(toggleRelevanceScript)();
    expect(
      document.querySelector<HTMLElement>('[data-kdc-toggle="lang"]')!.style.display,
    ).toBe('');
    expect(
      document.querySelector<HTMLElement>('[data-kdc-toggle="framework"]')!.style.display,
    ).toBe('none');
  });
});

describe('noFlashScript', () => {
  it('reads every preference key', () => {
    for (const key of ['kdc:theme', 'kdc:code-theme', 'kdc:lang', 'kdc:framework']) {
      expect(noFlashScript).toContain(key);
    }
    expect(noFlashScript.startsWith('(function()')).toBe(true);
  });
});
