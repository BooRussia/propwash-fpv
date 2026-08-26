# fence-rail model pass

Walked every item in catalog section `fence-rail`. Geometry left in place unless `sixSides` was a lie. Missing author units built as vertex-colour `cBox`/`cCyl` merges. Origin at ground. No `rng`/`rng2`/`rng3`/`rng4`.

## Built

- `pipe-rail` — `js/world/miami/props/fence-rail.js#buildPipeRailingGeo` (posts, top rail, mid rail)
- `chain-link` — `js/world/miami/props/fence-rail.js#buildChainLinkRunGeo` (posts, top rail, mesh panel)
- `gate-swing` — `js/world/miami/props/fence-rail.js#buildSwingGateGeo` (frame, mesh, hinges)

## Left (on-disk / in-engine)

- `dune-fence` — `js/world/miami/street.js#buildBoardwalkEdge` (posts, rails)
- `fence-low` — `assets/models/fence_low/` (Kenney GLB + colormap.png; `MODEL_KEYS` already lists `fence_low`)
- `fence-tall` — `assets/models/fence/` (Kenney GLB + colormap.png; `MODEL_KEYS` already lists `fence`)
- `construction-fence` — `assets/models/construction_fence/` (Kenney GLB + colormap.png; `MODEL_KEYS` already lists `construction_fence`)
- `deco-rail` — `js/world/miami/buildings.js#buildBalconyGeo` (slab, glass, posts)

All eight items set to `needs-wrap`.
