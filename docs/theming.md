# Theming

## Tokens

`packages/theme/src/tokens.ts` owns design tokens that are **theme-invariant**:

- `spacing` — 2 / 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64
- `radii` — none / sm / md / lg / xl / pill
- `fontSizes` — xs / sm / md / lg / xl / 2xl / 3xl / display
- `fontWeights` — regular → heavy
- `tierColors` — bronze / silver / gold / diamond (never change across themes)

## Palettes

`packages/theme/src/themes.ts` exports three:

| Theme         | Mode  | Primary  | Notes                                          |
| ------------- | ----- | -------- | ---------------------------------------------- |
| `livehappy`   | light | `#ED8B00`| Bright orange on white — matches livehappy.com |
| `minga-green` | light | `#2D7D32`| Outdoorsy forest alt                           |
| `midnight`    | dark  | `#ED8B00`| Dark background, same primary                  |

Each palette supplies: `background`, `surface`, `surfaceAlt`, `border`, `text`, `textMuted`, `textInverse`, `primary`, `primaryHover`, `primaryMuted`, `onPrimary`, `accent`, `success`, `warning`, `danger`, `overlay`, `categoryChipBg`, `categoryChipText`.

## ThemeProvider

`ThemeProvider` wraps each app's root and exposes `useTheme()`. It accepts a `persist` adapter:

```tsx
<ThemeProvider persist={{
  get: (key) => AsyncStorage.getItem(key),
  set: (key, val) => AsyncStorage.setItem(key, val),
}}>
```

The default adapter uses `localStorage` on web and a no-op elsewhere. The Expo app injects AsyncStorage so theme selection survives app restarts.

## Switching themes at runtime

The Settings screen (`packages/ui/src/screens/SettingsScreen.tsx` and `apps/web/src/pages/SettingsPage.tsx`) renders every available theme as a tile; tapping one calls `setTheme(name)` and re-renders immediately.

On the desktop website, `apps/web/src/App.tsx` mirrors the active palette into CSS custom properties so plain CSS (body background, scrollbars) picks it up too.

## Adding a new theme

1. Add the `ThemeName` union member in `packages/types/src/domain.ts`.
2. Add a palette entry in `packages/theme/src/themes.ts` with every required color.
3. Add a swatch/subtitle in both settings screens (`THEME_LABELS` / `META`).

No other code changes needed — the settings screens iterate over `Object.keys(themes)` and render whatever's registered.
