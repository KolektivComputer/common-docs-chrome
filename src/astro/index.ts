import type { DocsChromeConfig } from '@kolektiv/common-docs-chrome';

export type { DocsChromeConfig };

/**
 * Import paths for every shipped Astro component. Consumers normally import the
 * `.astro` files directly; this manifest exists for programmatic use (e.g.
 * generating an MDX component map).
 */
export const ASTRO_COMPONENTS = {
  BaseHead: '@kolektiv/common-docs-chrome/astro/BaseHead.astro',
  BaseLayout: '@kolektiv/common-docs-chrome/astro/BaseLayout.astro',
  DocsLayout: '@kolektiv/common-docs-chrome/astro/DocsLayout.astro',
  Navbar: '@kolektiv/common-docs-chrome/astro/Navbar.astro',
  Sidebar: '@kolektiv/common-docs-chrome/astro/Sidebar.astro',
  Footer: '@kolektiv/common-docs-chrome/astro/Footer.astro',
  ThemePicker: '@kolektiv/common-docs-chrome/astro/ThemePicker.astro',
  LangToggle: '@kolektiv/common-docs-chrome/astro/LangToggle.astro',
  Switcher: '@kolektiv/common-docs-chrome/astro/Switcher.astro',
  FrameworkPicker: '@kolektiv/common-docs-chrome/astro/FrameworkPicker.astro',
  ScmMenu: '@kolektiv/common-docs-chrome/astro/ScmMenu.astro',
  Mark: '@kolektiv/common-docs-chrome/astro/Mark.astro',
  BuiltByMark: '@kolektiv/common-docs-chrome/astro/BuiltByMark.astro',
  SearchDialog: '@kolektiv/common-docs-chrome/astro/SearchDialog.astro',
} as const;

export type AstroComponentName = keyof typeof ASTRO_COMPONENTS;
