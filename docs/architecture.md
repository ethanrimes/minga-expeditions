# Architecture

Minga is an **npm workspaces** monorepo. One Supabase project is shared by three client apps, each of which sits on top of five shared TypeScript packages.

```
                ┌──────────────────┐
                │     Supabase     │   Postgres + Auth + Storage
                └────────┬─────────┘
                         │
          ┌──────────────┴──────────────────────────────┐
          │                                              │
  ┌───────▼───────┐   ┌──────────────┐   ┌──────────────▼───────┐
  │   apps/web    │   │apps/mobile-  │   │   apps/mobile         │
  │ (Vite/React)  │   │web (RN-Web)  │   │   (Expo React Native) │
  └──────┬────────┘   └──────┬───────┘   └──────────┬────────────┘
         │                   │                       │
         └─────────┬─────────┴──────────┬────────────┘
                   ▼                    ▼
            ┌────────────┐       ┌──────────────┐
            │ @minga/ui  │◀──────│ @minga/theme │
            │  screens,  │       │ tokens,      │
            │  hooks,    │       │ ThemeProvider│
            │  primitives│       └──────┬───────┘
            └────┬───────┘              │
                 │            ┌─────────┴──────────┐
                 ▼            ▼                    ▼
         ┌────────────┐  ┌───────────────┐  ┌──────────────┐
         │@minga/logic│  │@minga/supabase│  │ @minga/types │
         │tier, geo,  │  │client factory │  │db rows,      │
         │formatters  │  │+ queries      │  │domain types  │
         └────────────┘  └───────────────┘  └──────────────┘
```

## Shared packages

| Package          | Responsibility                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| `@minga/types`   | Plain TypeScript row + domain types. No runtime code — safe to import anywhere.                           |
| `@minga/supabase`| Supabase client factory that accepts a `storage` adapter (browser vs AsyncStorage) + every query helper.  |
| `@minga/theme`   | Design tokens (spacing, radii, font sizes), 3 palettes, `ThemeProvider` with persistence adapter.         |
| `@minga/logic`   | Pure business logic: tier math, distance/elevation/pace formatters, haversine, track summarization.       |
| `@minga/ui`      | Cross-platform primitives (Button, Card, etc.), reusable components (ExpeditionCard, CommentThread), and full screens (Feed, Detail, Profile, Track, Settings, Auth, Explore). Implemented with React Native primitives so it runs on RN and RN-Web. |

## Which apps use which packages

|                          | `types` | `supabase` | `theme` | `logic` | `ui` |
| ------------------------ | :-----: | :--------: | :-----: | :-----: | :--: |
| `apps/web`               |    ✓    |     ✓      |    ✓    |    ✓    | ⚠¹  |
| `apps/mobile-web`        |    ✓    |     ✓      |    ✓    |    ✓    |  ✓   |
| `apps/mobile`            |    ✓    |     ✓      |    ✓    |    ✓    |  ✓   |

¹ `apps/web` uses only tokens + formatters, not the RN-based screen components — the desktop layout is idiomatic HTML/CSS.

## Why a monorepo (vs. separate repos)?

- **Type safety end-to-end.** The `ExpeditionWithAuthor` shape flows from the Postgres schema into a shared type and through to every client without a publish step.
- **One change ships to all three clients.** When the DB schema or a query changes, every app picks it up on the next `npm run dev`.
- **Iteration speed.** `apps/mobile-web` exists specifically because the Android emulator was slow for Giovanni — the same screen components that run in Expo run in a browser mobile frame with `react-native-web`, so we can iterate on the phone UI on a desktop.

## Inter-package resolution

`tsconfig.base.json` sets the `paths` mapping. Each app's bundler handles the runtime alias:

- **Vite apps** (`web`, `mobile-web`) — `vite.config.ts` rewrites `@minga/*` imports to `packages/*/src/index.ts` and routes `react-native` → `react-native-web` for `mobile-web`.
- **Expo app** (`mobile`) — `metro.config.js` adds the monorepo root to `watchFolders` and disables hierarchical node_modules lookup so Metro resolves the linked workspaces correctly.

## State management

Kept deliberately minimal for the PoC:

- Each hook (`useFeed`, `useExpedition`, `useMyActivities`, `useAuth`, `useTracker`) owns its own state.
- Writes invalidate by calling their hook's `reload()`.
- No global store (Redux / Zustand / React Query) — add one when the surface area demands it.
