# @welldot/vue

## 0.2.2

### Patch Changes

- Updated dependencies [d80fdbd]
  - @welldot/core@0.7.0
  - @welldot/render@0.4.3
  - @welldot/utils@0.5.2

## 0.2.1

### Patch Changes

- 1d90ffd: Grid unit editor: opening a cell by typing a number now starts from that number in display units, instead of converting it as if it were the stored SI value (typing 6 on an inches column no longer shows 0.2362).

## 0.2.0

### Minor Changes

- 6ee5122: The color palettes now live in plain CSS: `@welldot/vue/tokens.css` declares every `--w-*` variable (light in `:root`, dark in `.dark-mode`), and `WelldotPreset` and the Tailwind theme both read it. New exports `@welldot/vue/tokens.css` and `@welldot/vue/theme.css` work without PrimeVue. Rebrand by redeclaring `--w-*` variables after the import.

  `WelldotPreset` no longer carries color values: apps must load `@welldot/vue/tailwind.css` or `@welldot/vue/tokens.css`, or PrimeVue components render without colors. It also uses PrimeVue's default prefix `p` instead of `w`. If your app overrides colors through `defineWelldotTheme`, redeclare the `--w-*` variables instead. If it reads PrimeVue component variables as `--w-*`, switch them to `--p-*`.

### Patch Changes

- 0332665: The repository moved to the `welldothq` GitHub organization. The package `repository`, `homepage` and `bugs` URLs now point at `https://github.com/welldothq/welldot`.
- Updated dependencies [0c76546]
- Updated dependencies [0332665]
- Updated dependencies [147708f]
  - @welldot/core@0.6.0
  - @welldot/utils@0.5.1
  - @welldot/render@0.4.2

## 0.1.1

### Patch Changes

- 7ed7d59: Adds an optional `maxHeight` prop to `WellDataGrid`: the grid stops growing at that height and scrolls inside it, so long tables render only their visible rows.
- Updated dependencies [a74ddd6]
- Updated dependencies [a74ddd6]
- Updated dependencies [a74ddd6]
  - @welldot/core@0.5.0
  - @welldot/render@0.4.1
  - @welldot/utils@0.5.0

## 0.1.0

### Minor Changes

- Initial release.
