# State

Central episode state: stamina, trust, money, network favor, purist hype,
footage, relationships, genre choices, AP, MP, hazards, audience pressure,
and current narrative framing (GDD §8).

Target shape for Milestone 1 (Decision Engine):

- `episodeState.js` — the shared state object + explicit transition functions
  (no hidden mutation; every change should be traceable to a player action).
- `rngSeed.js` — deterministic seeding so encounters are reproducible in tests.

Keep transitions explicit and side-effect-free where possible so the tactical
grid (Milestone 2) and the full weekly loop (Milestone 3) can consume the same
state shape without rewrites.
