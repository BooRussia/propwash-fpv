# beach-boardwalk model

Walked every item in catalog section `beach-boardwalk`. Geometry left in place for on-disk / in-engine (`sixSides` honest). Kenney GLBs already have `Textures/colormap.png`; Poly Haven 1k glTF on disk; `MODEL_KEYS` already lists those slugs. No rng streams used.

## Built (author, was missing)

- `life-ring` — `js/world/miami/props/beach-boardwalk.js#buildLifeRingGeo`

## Verified, geometry unchanged

- `chair` — `assets/models/plastic_monobloc_chair_01/`
- `parasol-a` — `assets/models/parasol_a/`
- `parasol-b` — `assets/models/parasol_b/`
- `shell` — `assets/models/lambis_shell/`
- `lounger` — `js/world/miami/landmarks/beachProps.js#buildLoungerGeo`
- `shower` — `js/world/miami/street.js#buildBoardwalkEdge`
- `bollard-lamp` — `js/world/miami/street.js#buildBoardwalkEdge`
- `picnic` — `assets/models/wooden_picnic_table/`
- `coffee-cart` — `assets/models/CoffeeCart_01/`

All ten items set to `needs-wrap`.
