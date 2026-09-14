// Preference engine shared by the layouts and pickers. Reads are SSR-safe and
// writes are guarded so the module can be imported in the browser bundle.

import { DEFAULT_CODE_THEME } from './config.js';

export interface ChromePrefs {
  theme: string;
  codeTheme: string;
  lang: string;
  framework: string;
  /** Values for the generic (non-built-in) switchers, keyed by switcher id. */
  switchers: Record<string, string>;
}

export interface PrefKeys {
  theme: string;
  codeTheme: string;
  lang: string;
  framework: string;
}

export const PREF_KEYS: PrefKeys = {
  theme: 'kdc:theme',
  codeTheme: 'kdc:code-theme',
  lang: 'kdc:lang',
  framework: 'kdc:framework',
};

/**
 * localStorage key for a generic switcher. `lang` / `framework` intentionally
 * keep `kdc:lang` / `kdc:framework`, which this helper also returns.
 */
export function switcherStorageKey(id: string): string {
  return `kdc:${id}`;
}

export interface PrefOptions {
  defaultTheme: string;
  defaultCodeTheme?: string;
  defaultLang?: string;
  defaultFramework?: string;
  /** Valid theme ids. When supplied, unknown stored values fall back. */
  themes?: string[];
  langs?: string[];
  frameworks?: string[];
  /** Valid option ids per generic switcher id; unknown stored values fall back. */
  switcherAllowed?: Record<string, string[]>;
  /** Default option id per generic switcher id. */
  defaultSwitchers?: Record<string, string>;
  keys?: Partial<PrefKeys>;
}

interface ResolvedOptions {
  defaults: ChromePrefs;
  themes?: string[];
  langs?: string[];
  frameworks?: string[];
  switcherAllowed?: Record<string, string[]>;
  keys: PrefKeys;
}

/** The ids a generic switcher can take, derived from the option maps. */
function switcherIds(options: PrefOptions): string[] {
  return Array.from(
    new Set([
      ...Object.keys(options.switcherAllowed ?? {}),
      ...Object.keys(options.defaultSwitchers ?? {}),
    ]),
  );
}

function resolveOptions(options: PrefOptions): ResolvedOptions {
  const langs = options.langs;
  const frameworks = options.frameworks;
  return {
    defaults: {
      theme: options.defaultTheme,
      codeTheme: options.defaultCodeTheme ?? DEFAULT_CODE_THEME,
      lang: options.defaultLang ?? langs?.[0] ?? '',
      framework: options.defaultFramework ?? frameworks?.[0] ?? '',
      switchers: { ...(options.defaultSwitchers ?? {}) },
    },
    themes: options.themes,
    langs,
    frameworks,
    switcherAllowed: options.switcherAllowed,
    keys: { ...PREF_KEYS, ...(options.keys ?? {}) },
  };
}

function pick(value: string | null, allowed: string[] | undefined, fallback: string): string {
  if (value == null) return fallback;
  if (allowed && !allowed.includes(value)) return fallback;
  return value;
}

function storage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

/** Read the stored preferences, falling back to the configured defaults. */
export function readPrefs(options: PrefOptions): ChromePrefs {
  const { defaults, themes, langs, frameworks, switcherAllowed, keys } =
    resolveOptions(options);
  const store = storage();
  if (!store) return { ...defaults, switchers: { ...defaults.switchers } };
  const switchers: Record<string, string> = { ...defaults.switchers };
  for (const id of switcherIds(options)) {
    const fallback = defaults.switchers[id] ?? '';
    switchers[id] = pick(
      store.getItem(switcherStorageKey(id)),
      switcherAllowed?.[id],
      fallback,
    );
  }
  return {
    theme: pick(store.getItem(keys.theme), themes, defaults.theme),
    codeTheme: pick(store.getItem(keys.codeTheme), undefined, defaults.codeTheme),
    lang: pick(store.getItem(keys.lang), langs, defaults.lang),
    framework: pick(store.getItem(keys.framework), frameworks, defaults.framework),
    switchers,
  };
}

/**
 * Persist and apply preferences to `<html>` (data attributes) and local
 * storage. Safe to call without a DOM.
 */
export function applyPrefs(
  prefs: Partial<ChromePrefs>,
  options: PrefOptions,
): ChromePrefs {
  const { keys } = resolveOptions(options);
  const current = readPrefs(options);
  const next: ChromePrefs = {
    ...current,
    ...prefs,
    switchers: { ...current.switchers, ...(prefs.switchers ?? {}) },
  };
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.setAttribute('data-theme', next.theme);
    root.setAttribute('data-code-theme', next.codeTheme);
    if (next.lang) root.setAttribute('data-lang', next.lang);
    if (next.framework) root.setAttribute('data-framework', next.framework);
    for (const [id, value] of Object.entries(next.switchers)) {
      if (value) root.setAttribute(`data-${id}`, value);
    }
  }
  const store = storage();
  if (store) {
    store.setItem(keys.theme, next.theme);
    store.setItem(keys.codeTheme, next.codeTheme);
    if (next.lang) store.setItem(keys.lang, next.lang);
    if (next.framework) store.setItem(keys.framework, next.framework);
    for (const [id, value] of Object.entries(next.switchers)) {
      if (value) store.setItem(switcherStorageKey(id), value);
    }
  }
  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent('kdc:prefs', { detail: next }));
  }
  return next;
}

function escapeAttr(value: string): string {
  return value.replace(/["\\]/g, '\\$&');
}

function labelFor(root: ParentNode, pref: string, value: string): string | undefined {
  const el = root.querySelector<HTMLElement>(
    `[data-pref="${escapeAttr(pref)}"][value="${escapeAttr(value)}"]`,
  );
  return el?.dataset.label ?? el?.textContent?.trim() ?? undefined;
}

function isSelect(el: unknown): el is HTMLSelectElement {
  return typeof HTMLSelectElement !== 'undefined' && el instanceof HTMLSelectElement;
}

function isInput(el: unknown): el is HTMLInputElement {
  return typeof HTMLInputElement !== 'undefined' && el instanceof HTMLInputElement;
}

const BUILTIN_PREF_KEYS = ['theme', 'codeTheme', 'lang', 'framework'] as const;

type BuiltinPrefKey = (typeof BUILTIN_PREF_KEYS)[number];

function isBuiltinPrefKey(value: string): value is BuiltinPrefKey {
  return (BUILTIN_PREF_KEYS as readonly string[]).includes(value);
}

/** `data-pref` value for a generic switcher control. */
export function switcherPrefValue(id: string): string {
  return `sw:${id}`;
}

function setControlValue(
  el: HTMLInputElement | HTMLSelectElement,
  value: string,
): void {
  if (isSelect(el)) {
    el.value = value;
  } else {
    el.checked = el.value === value;
  }
}

/**
 * Reflect the stored preferences onto any `[data-pref]` controls and
 * `[data-*-current]` / `[data-switcher-current]` label slots inside `root`.
 */
export function syncControls(root: ParentNode = document, options: PrefOptions): void {
  const prefs = readPrefs(options);
  root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-pref]').forEach((el) => {
    const pref = el.dataset.pref;
    if (!pref) return;
    if (pref.startsWith('sw:')) {
      const id = pref.slice(3);
      if (!id) return;
      setControlValue(el, prefs.switchers[id] ?? '');
      return;
    }
    if (!isBuiltinPrefKey(pref)) return;
    setControlValue(el, prefs[pref]);
  });
  const slots: [BuiltinPrefKey, string][] = [
    ['theme', '[data-theme-current]'],
    ['codeTheme', '[data-code-theme-current]'],
    ['lang', '[data-lang-current]'],
    ['framework', '[data-framework-current]'],
  ];
  for (const [key, selector] of slots) {
    const value = prefs[key];
    if (!value) continue;
    const label = labelFor(root, key, value) ?? value;
    root.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      el.textContent = label;
    });
  }
  for (const [id, value] of Object.entries(prefs.switchers)) {
    if (!value) continue;
    const label = labelFor(root, switcherPrefValue(id), value) ?? value;
    root
      .querySelectorAll<HTMLElement>(`[data-switcher-current="${escapeAttr(id)}"]`)
      .forEach((el) => {
        el.textContent = label;
      });
  }
}

let wired = false;

/**
 * Read, apply and sync preferences, then wire delegated `change` handling for
 * `[data-pref]` controls. Idempotent.
 */
export function initChrome(options: PrefOptions): ChromePrefs {
  const prefs = applyPrefs({}, options);
  if (typeof document !== 'undefined') {
    syncControls(document, options);
    if (!wired) {
      wired = true;
      document.addEventListener('change', (event) => {
        const el = event.target as HTMLElement | null;
        const pref = el?.dataset?.pref;
        if (!pref || !(isInput(el) || isSelect(el))) {
          return;
        }
        if (pref.startsWith('sw:')) {
          const id = pref.slice(3);
          if (!id) return;
          applyPrefs({ switchers: { [id]: el.value } }, options);
        } else if (isBuiltinPrefKey(pref)) {
          applyPrefs({ [pref]: el.value }, options);
        } else {
          return;
        }
        syncControls(document, options);
      });
    }
  }
  return prefs;
}

/** Attribute that marks a control as relevant only when a matching panel exists. */
export const TOGGLE_RELEVANCE_ATTR = 'data-kdc-toggle';

/**
 * Hide any `[data-kdc-toggle="<kind>"]` control on pages that contain no
 * matching `[data-<kind>-panel]` block. Relevance mirrors the visibility rules
 * in `visibilityCss` for every switcher kind (`lang`, `framework`, and any
 * generic switcher). Idempotent and safe to call without a DOM.
 */
export function initToggleRelevance(
  root: ParentNode | undefined = typeof document !== 'undefined' ? document : undefined,
): void {
  if (!root) return;
  root.querySelectorAll<HTMLElement>(`[${TOGGLE_RELEVANCE_ATTR}]`).forEach((el) => {
    const kind = el.getAttribute(TOGGLE_RELEVANCE_ATTR);
    if (!kind) return;
    const relevant = root.querySelector(`[data-${escapeAttr(kind)}-panel]`) !== null;
    el.style.display = relevant ? '' : 'none';
  });
}

/**
 * Inline snippet form of {@link initToggleRelevance}, placed at the end of the
 * body so relevance is resolved before first paint (no flash of a toggle that
 * is about to be hidden). Kept dependency-free so it can be inlined verbatim.
 */
export const toggleRelevanceScript =
  '(function(){try{var d=document,e=d.querySelectorAll("[data-kdc-toggle]");' +
  'for(var i=0;i<e.length;i++){var t=e[i],k=t.getAttribute("data-kdc-toggle");' +
  'if(!k)continue;' +
  't.style.display=d.querySelector("[data-"+k+"-panel]")?"":"none";}' +
  '}catch(e){}})();';

/**
 * Inline `<head>` snippet that applies stored preferences before first paint so
 * returning visitors never see a flash of the default theme.
 */
export const noFlashScript =
  '(function(){try{var d=document.documentElement;' +
  'var k={theme:"kdc:theme",codeTheme:"kdc:code-theme",lang:"kdc:lang",framework:"kdc:framework"};' +
  'var t=localStorage.getItem(k.theme);if(t)d.setAttribute("data-theme",t);' +
  'var c=localStorage.getItem(k.codeTheme);if(c)d.setAttribute("data-code-theme",c);' +
  'var l=localStorage.getItem(k.lang);if(l)d.setAttribute("data-lang",l);' +
  'var f=localStorage.getItem(k.framework);if(f)d.setAttribute("data-framework",f);}catch(e){}})();';

const PREF_ATTRS: Record<string, string> = {
  theme: 'data-theme',
  codeTheme: 'data-code-theme',
  lang: 'data-lang',
  framework: 'data-framework',
};

/**
 * Build a no-flash snippet for custom preference keys and generic switchers.
 * Each switcher id restores `kdc:<id>` onto `data-<id>`, so extra switchers
 * never flash their default. The `keys`-only overload keeps working.
 */
export function buildNoFlashScript(
  keys?: Partial<PrefKeys>,
  switchers?: string[],
): string {
  const resolved = { ...PREF_KEYS, ...(keys ?? {}) };
  const pairs = Object.entries(resolved).map(
    ([key, storageKey]) =>
      `["${key}","${storageKey}","${PREF_ATTRS[key] ?? `data-${key}`}"]`,
  );
  for (const id of switchers ?? []) {
    pairs.push(`["${id}","${switcherStorageKey(id)}","data-${id}"]`);
  }
  return (
    '(function(){try{var d=document.documentElement;' +
    `var p=[${pairs.join(',')}];` +
    'for(var i=0;i<p.length;i++){var v=localStorage.getItem(p[i][1]);if(v)d.setAttribute(p[i][2],v);}' +
    '}catch(e){}})();'
  );
}
