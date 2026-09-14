import { beforeEach, describe, expect, it } from 'vitest';

import {
  applyPrefs,
  initChrome,
  noFlashScript,
  readPrefs,
  syncControls,
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

describe('noFlashScript', () => {
  it('reads every preference key', () => {
    for (const key of ['kdc:theme', 'kdc:code-theme', 'kdc:lang', 'kdc:framework']) {
      expect(noFlashScript).toContain(key);
    }
    expect(noFlashScript.startsWith('(function()')).toBe(true);
  });
});
