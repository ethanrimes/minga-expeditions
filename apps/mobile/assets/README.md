# Expo assets

These fields are **intentionally not set** in `app.json` so the PoC runs on
Expo Go without any asset files, using Expo's built-in defaults.

Before producing a production build, drop these PNGs here and re-add the
matching fields to `app.json`:

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ED8B00"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ED8B00"
      }
    }
  }
}
```

- `icon.png` — 1024×1024
- `splash.png` — 1242×2436 (or any portrait)
- `adaptive-icon.png` — 1024×1024 foreground for Android

When you're ready to publish under an EAS project, run `eas init` inside
`apps/mobile` — it will write `extra.eas.projectId` for you. Do **not**
paste a placeholder project ID here manually; Expo CLI will try to validate
it with the EAS API and block the dev server until you log in.
