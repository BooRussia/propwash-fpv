# building-dressing model

Walked every item in catalog section `building-dressing`. Geometry left in place unless `sixSides` was a lie. Missing author units built as vertex-colour `cBox`/`cCyl` merges. Origin at ground. No `rng`/`rng2`/`rng3`/`rng4`. Never a window atlas on +Y.

## Built

- `window-ac-row` — `js/world/miami/props/building-dressing.js#buildWindowAcRowGeo` (chassis, grille, drip)
- `flag-pole` — `js/world/miami/props/building-dressing.js#buildFlagpoleGeo` (pole, ball, base)

## Left (on-disk / in-engine)

- `dumpster` — `assets/models/dumpster/` (Kenney GLB + colormap.png; `MODEL_KEYS` already lists `dumpster`)
- `ac-unit` — `js/world/miami/geo.js#buildRoofAcUnitGeo` (grille, fan, sleepers)
- `ac-scan` — `assets/models/exterior_aircon_unit/` (Poly Haven 1k glTF; `MODEL_KEYS` already lists `exterior_aircon_unit`)
- `roof-kit` — `js/world/miami/buildings.js#buildRooftopKitGeo` (kits)
- `roof-dish` — `js/world/miami/buildings.js#buildRooftopDishGeo` (dish, pole)
- `roof-tank` — `js/world/miami/buildings.js#buildRooftopTankGeo` (tank, cone, ladder)
- `helipad-pad` — `js/world/miami/buildings.js#buildRooftopPadGeo` (tarmac, paint)
- `far-sky-a` — `assets/models/kenney_skyscraper_a/` (Kenney GLB + colormap.png; `MODEL_KEYS` already lists `kenney_skyscraper_a`)
- `house-a` — `assets/models/kenney_house_a/` (Kenney GLB + colormap.png; `MODEL_KEYS` already lists `kenney_house_a`)

All eleven items set to `needs-wrap`.
