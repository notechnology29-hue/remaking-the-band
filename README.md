# Remaking the Band

A gritty, satirical reality-TV band-management sim. This is the **web-first
scaffold** described in the GDD §8 — a plain React + Vite project with no
game logic wired up yet. It exists so the folder structure, build tooling,
and data-driven direction are settled before Milestone 1 work starts.

See `docs/ROADMAP.md` for the full Solo MVP Roadmap this scaffold sets up for.

## Getting started

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Then open the printed local URL. You should see a dark "Daily Call Sheet"
placeholder screen confirming the scaffold is wired correctly — that screen
gets replaced by real gameplay starting in Milestone 1.

Other scripts:

```bash
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

## Folder structure

```
src/
  main.jsx, App.jsx, App.css, index.css   — entry point + placeholder screen
  state/          — central episode state (stamina, trust, money, AP/MP, ...)
  content/        — data-driven JSON: musicians, baggage, genres, gear,
                    bands, bosses, upgrades, episodes
  components/
    ui-eras/      — SidekickCellphone (early), PCMonitor (mid),
                    FlatScreenTV (end) — diegetic UI per GDD §5
    dashboard/, characterSheet/, spinRoom/, tacticalHUD/,
    compound/, studio/, weekendStage/
  audio/          — Howler.js four-stem mixer logic (wired in Milestone 4)
  utils/          — shared helpers (dice, stamina thresholds, formatting)
public/
  assets/images/  — logos, portraits, boss art (not needed until polish pass)
  assets/audio/   — the four Howler.js stems + SFX
docs/
  ROADMAP.md      — the Solo MVP Roadmap (GDD §9)
```

Each folder under `src/content/` and `src/components/` has its own
`README.md` explaining what belongs there and which GDD section it maps to.

## Design direction (from the GDD)

- **Data-driven**: archetypes, baggage, bands, gear, bosses, upgrades,
  episodes should be editable data, not hard-coded into screens.
- **Explicit state**: one shared episode state object with deterministic
  test seeds and visible transitions — no hidden mutation.
- **Packaging later**: Capacitor (mobile) and Electron (Steam) wrap the same
  web build once the loop is proven. Don't optimize for them yet.

## What's intentionally not here yet

No game logic, no content data, no Howler.js, no Capacitor/Electron config.
Per the GDD's "Solo production rule" (§9): prove rules, state transitions,
readability, and fun before investing in finished visuals or packaging.
