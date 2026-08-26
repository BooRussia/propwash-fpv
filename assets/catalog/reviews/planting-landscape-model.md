# planting-landscape modeler

Walked all 11 items. Status set to `needs-wrap`.

## Built

- `tree-grate` — `js/world/miami/props/planting-landscape.js#buildTreeGrateGeo`
  Authored 6-sided vertex-colour cast-iron grate (cBox/cCyl, origin at ground).
  Top: concentric rings + radials + open trunk hole. Sides: square frame + lip.
  Bottom: bar undersides + corner pads. Palette `#3a3d40` / `#2c2f33` / `#4c5156` / `#6a7178`.

## Verified, geometry left

- `palm-hero` — `js/world/vegetation.js` (trunk, crown)
- `kenney-palm` — `assets/models/kenney_palm/kenney_palm.glb` (Nature Kit vertex colour, no atlas)
- `kenney-palm-tall` — `assets/models/kenney_palm_tall/kenney_palm_tall.glb`
- `tree-large` — `assets/models/kenney_tree_large/` + `Textures/colormap.png`
- `tree-small` — `assets/models/kenney_tree_small/` + `Textures/colormap.png`
- `shrub-04` — `assets/models/shrub_04/` (Poly Haven 1k glTF)
- `potted-02` — `assets/models/potted_plant_02/` (Poly Haven 1k glTF)
- `potted-04` — `assets/models/potted_plant_04/` (Poly Haven 1k glTF)
- `bush` — `assets/models/kenney_bush/kenney_bush.glb` (Nature Kit vertex colour)
- `hedge-box` — `js/world/miami/dressing.js` (rounded box + foliage sheet, not a window atlas)

All download slugs already in `MODEL_KEYS`. Nature Kit palms/bush have no colormap (vertex wrap). No rng streams used.
