import { beforeEach, describe, expect, it } from 'vitest';

import {
  applyPrefs,
  buildNoFlashScript,
  initChrome,
  initToggleRelevance,
  noFlashScript,
  readPrefs,
  switcherStorageKey,
  syncControls,
  toggleRelevanceScript,
  TOGGLE_RELEVANCE_ATTR,
  type ChromePrefs,
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

const SWITCHER_OPTIONS: PrefOptions = {
  ...OPTIONS,
  switcherAllowed: { gradle: ['kts', 'groovy'] },
  defaultSwitchers: { gradle: 'kts' },
};

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  const root = document.documentElement;
  for (const attr of [
    'data-theme',
    'data-code-theme',
    'data-lang',
    'data-framework',
    'data-gradle',
  ]) {
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
      switchers: {},
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
      switchers: {},
    });
  });
});

describe('generic switcher prefs', () => {
  it('reads and validates an extra switcher, falling back to its default', () => {
    expect(readPrefs(SWITCHER_OPTIONS).switchers).toEqual({ gradle: 'kts' });
    localStorage.setItem('kdc:gradle', 'groovy');
    expect(readPrefs(SWITCHER_OPTIONS).switchers.gradle).toBe('groovy');
    localStorage.setItem('kdc:gradle', 'maven');
    expect(readPrefs(SWITCHER_OPTIONS).switchers.gradle).toBe('kts');
  });

  it('derives its storage key from the switcher id', () => {
    expect(switcherStorageKey('gradle')).toBe('kdc:gradle');
    expect(switcherStorageKey('lang')).toBe('kdc:lang');
  });

  it('applyPrefs writes data-<id>, localStorage and dispatches kdc:prefs', () => {
    const events: ChromePrefs[] = [];
    document.addEventListener('kdc:prefs', (event) => {
      events.push((event as CustomEvent<ChromePrefs>).detail);
    });
    const next = applyPrefs({ switchers: { gradle: 'groovy' } }, SWITCHER_OPTIONS);
    expect(next.switchers.gradle).toBe('groovy');
    expect(document.documentElement.getAttribute('data-gradle')).toBe('groovy');
    expect(localStorage.getItem('kdc:gradle')).toBe('groovy');
    expect(events.at(-1)?.switchers.gradle).toBe('groovy');
  });

  it('syncControls drives sw:<id> controls and data-switcher-current slots', () => {
    document.body.innerHTML = `
      <input type="radio" name="gradle" data-pref="sw:gradle" data-label="Kotlin" value="kts" />
      <input type="radio" name="gradle" data-pref="sw:gradle" data-label="Groovy" value="groovy" />
      <span data-switcher-current="gradle"></span>
    `;
    localStorage.setItem('kdc:gradle', 'groovy');
    syncControls(document, SWITCHER_OPTIONS);
    const [kts, groovy] =
      document.querySelectorAll<HTMLInputElement>('[data-pref="sw:gradle"]');
    expect(kts?.checked).toBe(false);
    expect(groovy?.checked).toBe(true);
    expect(document.querySelector('[data-switcher-current="gradle"]')?.textContent).toBe(
      'Groovy',
    );
  });

  it('syncControls supports select controls', () => {
    document.body.innerHTML = `
      <select data-pref="sw:gradle">
        <option value="kts">Kotlin</option>
        <option value="groovy">Groovy</option>
      </select>
    `;
    syncControls(document, SWITCHER_OPTIONS);
    expect(document.querySelector<HTMLSelectElement>('select')?.value).toBe('kts');
  });

  it('initChrome routes sw:<id> changes into applyPrefs', () => {
    initChrome(SWITCHER_OPTIONS);
    const input = document.createElement('input');
    input.type = 'radio';
    input.dataset.pref = 'sw:gradle';
    input.value = 'groovy';
    input.checked = true;
    document.body.appendChild(input);
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(document.documentElement.getAttribute('data-gradle')).toBe('groovy');
    expect(localStorage.getItem('kdc:gradle')).toBe('groovy');
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

  it('generalizes to any switcher kind', () => {
    document.body.innerHTML = `
      <div data-kdc-toggle="gradle"></div>
      <div data-gradle-panel="all"></div>
    `;
    initToggleRelevance();
    expect(document.querySelector<HTMLElement>('[data-kdc-toggle="gradle"]')!.style.display).toBe(
      '',
    );

    document.body.innerHTML = '<div data-kdc-toggle="gradle"></div>';
    initToggleRelevance();
    expect(document.querySelector<HTMLElement>('[data-kdc-toggle="gradle"]')!.style.display).toBe(
      'none',
    );
  });

  it('hides any toggle whose kind has no matching panel', () => {
    document.body.innerHTML = '<div data-kdc-toggle="other"></div>';
    initToggleRelevance();
    expect(document.querySelector<HTMLElement>('[data-kdc-toggle="other"]')!.style.display).toBe(
      'none',
    );
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

describe('buildNoFlashScript', () => {
  it('keeps the keys-only overload working', () => {
    const script = buildNoFlashScript({ theme: 'acme:theme' });
    expect(script).toContain('acme:theme');
    expect(script).toContain('data-theme');
  });

  it('restores extra switchers from kdc:<id> onto data-<id>', () => {
    const script = buildNoFlashScript(undefined, ['gradle']);
    expect(script).toContain('kdc:gradle');
    expect(script).toContain('data-gradle');
    localStorage.setItem('kdc:gradle', 'groovy');
    const root = document.documentElement;
    root.removeAttribute('data-gradle');
    new Function(script)();
    expect(root.getAttribute('data-gradle')).toBe('groovy');
  });
});
