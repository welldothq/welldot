---
'@welldot/vue': minor
---

The color palettes now live in plain CSS: `@welldot/vue/tokens.css` declares every `--w-*` variable (light in `:root`, dark in `.dark-mode`), and `WelldotPreset` and the Tailwind theme both read it. New exports `@welldot/vue/tokens.css` and `@welldot/vue/theme.css` work without PrimeVue. Rebrand by redeclaring `--w-*` variables after the import.

`WelldotPreset` no longer carries color values: apps must load `@welldot/vue/tailwind.css` or `@welldot/vue/tokens.css`, or PrimeVue components render without colors. It also uses PrimeVue's default prefix `p` instead of `w`. If your app overrides colors through `defineWelldotTheme`, redeclare the `--w-*` variables instead. If it reads PrimeVue component variables as `--w-*`, switch them to `--p-*`.
