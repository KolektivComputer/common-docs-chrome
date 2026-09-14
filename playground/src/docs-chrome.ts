import { defineDocsChrome, type ChromeTheme } from '@kolektiv/common-docs-chrome';
import { getTheme } from '@kolektiv/themes';

const mocha = getTheme('catppuccin-mocha')?.colors ?? {};
const latte = getTheme('catppuccin-latte')?.colors ?? {};

const kalendeeDark: ChromeTheme = {
  id: 'kalendee-dark',
  label: 'Kalendee Dark',
  scheme: 'dark',
  family: 'kalendee',
  shiki: 'catppuccin-mocha',
  colors: {
    ...mocha,
    primary: 'oklch(0.72 0.16 250)',
    'primary-content': 'oklch(0.16 0.05 250)',
  },
};

const kalendeeLight: ChromeTheme = {
  id: 'kalendee-light',
  label: 'Kalendee Light',
  scheme: 'light',
  family: 'kalendee',
  shiki: 'catppuccin-latte',
  colors: {
    ...latte,
    primary: 'oklch(0.55 0.18 255)',
    'primary-content': 'oklch(0.98 0.02 255)',
  },
};

export const docs = defineDocsChrome({
  name: 'Kalendee',
  title: 'Kalendee Docs',
  description:
    'Self-hosted CalDAV server with first-party clients. Calendar linking plus scheduling proposals.',
  siteUrl: 'https://docs.kalendee.example',
  base: '/',
  defaultTheme: 'kalendee-dark',
  defaultCodeTheme: 'follow',
  themeFamilies: ['kalendee', 'kolektiv', 'catppuccin', 'nord', 'daisyui'],
  themeFamily: 'kalendee',
  themes: [kalendeeDark, kalendeeLight],
  nav: [
    {
      label: 'Getting started',
      icon: 'M5 19V6.2c0-.3.2-.6.5-.7L12 3l6.5 2.5c.3.1.5.4.5.7V19l-7-2.5L5 19z',
      items: [
        { label: 'Overview', href: '/', description: 'What Kalendee is' },
        {
          label: 'Install',
          href: '/docs/install',
          description: 'Run the server locally',
          icon: 'M12 3v12m0 0 4-4m-4 4-4-4M5 21h14',
        },
        { label: 'Theming', href: '/docs/theming', description: 'Themes and code blocks' },
      ],
    },
    {
      label: 'Project',
      icon: 'M4 7h16M4 12h10M4 17h7',
      items: [
        {
          label: 'GitHub',
          href: 'https://github.com/KolektivComputer/kalendee',
          external: true,
          description: 'Source repository',
        },
      ],
    },
  ],
  repo: {
    url: 'https://github.com/KolektivComputer/kalendee',
    branch: 'main',
  },
  langs: [
    { id: 'kts', label: 'Kotlin' },
    { id: 'bash', label: 'Shell' },
  ],
  frameworks: [
    { id: 'compose', label: 'Compose' },
    { id: 'web', label: 'Web' },
  ],
  defaultLang: 'kts',
  defaultFramework: 'compose',
  footer: {
    tagline: 'A Kolektiv Computing project.',
    links: [
      { label: 'GitHub', href: 'https://github.com/KolektivComputer/kalendee' },
      { label: 'Kolektiv', href: 'https://kolektiv.computer' },
    ],
  },
  builtBy: { href: 'https://kolektiv.computer' },
});
