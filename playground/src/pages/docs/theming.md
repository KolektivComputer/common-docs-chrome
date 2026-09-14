---
layout: ../../layouts/Docs.astro
title: Theming
description: Site themes, code themes and the theme picker.
---

# Theming

Kalendee ships a site theme (`kalendee-dark`) plus every Kolektiv palette. Use the
theme picker in the navbar to switch.

## Code blocks

Shiki renders every registered theme. The active code theme is selected with the
`data-code-theme` attribute, so code stays consistent with the picker.

```ts
import { siteThemes, createShikiConfig } from '@kolektiv/common-docs-chrome';

const themes = siteThemes({ themeFamilies: ['kolektiv', 'catppuccin'] });
const shiki = createShikiConfig(themes);
console.log(shiki.defaultColor); // false
```

## Adding a site theme

Provide a full daisyUI colour set so all tokens resolve, then register it via
`themes` in the config.
