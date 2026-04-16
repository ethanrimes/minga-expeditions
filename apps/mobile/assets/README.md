# Expo assets

Drop icon / splash / adaptive-icon PNGs here before first build:

- `icon.png` — 1024×1024
- `splash.png` — 1242×2436 (or any portrait)
- `adaptive-icon.png` — 1024×1024 foreground for Android

`expo prebuild` will generate native folders that reference these paths from
`app.json`. The PoC starts fine without them because Expo ships default fallbacks.
