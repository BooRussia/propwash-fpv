# utilities-power model report

Section walked. All 10 catalog items set to `needs-wrap`.

## Built (author, missing → needs-wrap)

Vertex-colour builders in `js/world/miami/props/utilities-power.js`. Origin at ground. `cBox`/`cCyl`/`cTube`/`cTorus`/`cSph` from `geo.js`, `mergeGeometries`. No rng streams.

- **pole-authored** — `js/world/miami/props/utilities-power.js#buildUtilityPoleWoodGeo` — shaft, crossarm, pin/spool insulators, concrete base
- **power-span** — `js/world/miami/props/utilities-power.js#buildPowerSpanGeo` — sagging three-wire tubes, default 28 m along +X
- **transformer** — `js/world/miami/props/utilities-power.js#buildPoleTransformerGeo` — can, HV/LV bushings, pole bracket
- **traffic-cabinet** — `js/world/miami/props/utilities-power.js#buildTrafficCabinetGeo` — door, side vents, pad
- **manhole** — `js/world/miami/props/utilities-power.js#buildManholeCoverGeo` — lid top + rim (no atlas on +Y)
- **fire-dept-siamese** — `js/world/miami/props/utilities-power.js#buildStandpipeSiameseGeo` — ports, body, wall plate

## Walked, geometry left

- **elec-pole** — `assets/models/electricity_pole/` (Kenney GLB + `Textures/colormap.png`, MODEL_KEYS)
- **utility-box** — `assets/models/utility_box_01/` (Poly Haven 1k glTF, MODEL_KEYS)
- **security-cam** — `assets/models/security_camera_01/` (Poly Haven 1k glTF, MODEL_KEYS)
- **storm-drain** — `js/world/miami/road.js` (in-engine flush box; sixSides "grate top" matches visible lid)
