# planting-landscape review

Inspected `assets/catalog/miami-props.json`, `assets/catalog/reviews/planting-landscape-model.md`, `js/world/miami/props/planting-landscape.js`, `js/world/vegetation.js`, `js/world/miami/dressing.js`, Kenney/Poly Haven files on disk, and `js/core/assets.js` MODEL_KEYS. No rng/rng2/rng3/rng4 draws. Existing kenneyDressing placements left in place; newly approved slugs `kenney_palm_tall`, `kenney_tree_small`, `kenney_bush` scattered with hash01.

All 11 items **approved**. Skins used (`miami-day`, `art-deco`) exist in `catalog.skins`. wrap.kind is `vertex-color` | `colormap` | `pbr`. No window atlas on any lid/+Y.

## Approved

### palm-hero (`palm_field`) — approved
- **Six sides:** base flare, trunk girth, fiber collar, live fronds, hanging dead fronds, spear/coconuts (`js/world/vegetation.js`).
- **Collider:** cyl r=0.3 h=6.2 matches dressing.js trunk probe (crown is pass-through). Filled missing r/h from in-engine `addCyl`.
- **Wrap:** kind `pbr`. Trunk `bark_palm` albedo/normal/rough/ao; UV origin (0,0) at trunk-base seam, u around girth, v up the spine, material repeat [2, 5], tint `#ccb29b` (fallback `#8a7055`). Crown vertex palette `#2f6b2a` `#1e4519` `#93b23c` `#8f9a4a` `#9a7d4e` `#b59a63` `#6b4f2e` `#a8b854`. LOD2 bake is a side+top atlas of that crown, not a window photo.
- **Night emissive:** none (`miami-day` emissive 0).

### kenney-palm (`kenney_palm`) — approved
- **Six sides:** trunk bark N/S/E/W, frond top, frond underside. Nature Kit GLB, no colormap.
- **Collider:** cyl r=0.2 h=2.6 matches existing kenneyDressing trunk cylinder (instance scale 2.4–4.0).
- **Wrap:** kind `vertex-color`. Untextured material factors woodBark `#e28357`, leafsGreen `#29c9ab` (no COLOR attribute; UVs unused).
- **Night emissive:** none.

### kenney-palm-tall (`kenney_palm_tall`) — approved
- **Six sides:** tall trunk bark N/S/E/W, frond top, frond underside. Unit visual ~1.42 m.
- **Collider:** cyl r=0.18 h=3.4 (trunk; scatter scale 2.6–4.0). Was missing r/h.
- **Wrap:** same Nature Kit palette `#e28357` / `#29c9ab`.
- **Night emissive:** none.
- **Scatter:** hash01 promenade-city (z 56–61.5), salts 501/503/509/521.

### tree-large (`kenney_tree_large`) — approved
- **Six sides:** trunk N/S/E/W, canopy top, canopy underside. Kenney City Kit mesh + `Textures/colormap.png`.
- **Collider:** cyl r=0.28 h=3.2 matches existing kenneyDressing scatter.
- **Wrap:** kind `colormap`. UV origin bottom-left of atlas; tree region u 0.219–0.594 × v 0.525–0.975 (green canopy + brown trunk swatches). Black unused strip and window-coloured cells are outside this region; +Y canopy is foliage, not a facade.
- **Night emissive:** none.

### tree-small (`kenney_tree_small`) — approved
- **Six sides:** trunk N/S/E/W, canopy top, canopy underside. Same colormap as tree-large.
- **Collider:** cyl r=0.22 h=1.8 (unit height 0.57 m, scatter scale 2.4–3.6). Was missing r/h.
- **Wrap:** colormap.png region u 0.219–0.594 × v 0.525–0.975.
- **Night emissive:** none.
- **Scatter:** hash01 tree-lawn-city (z 51.5), salts 523/529/541/547.

### shrub-04 (`shrub_04`) — approved
- **Six sides:** leaf cards N/S/E/W, stem, ground skirt. Poly Haven 1k scan.
- **Collider:** none (pass-through foliage; already scattered without a solid).
- **Wrap:** kind `pbr`. UV origin (0,0) on `shrub_04_diff_1k.jpg` (leaf islands + stem strip); ARM + nor_gl; alpha MASK 0.5. No lid/window.
- **Night emissive:** none.

### potted-02 (`potted_plant_02`) — approved
- **Six sides:** pot wall, pot bottom, rim/dirt, foliage. Scan meshes pot + leaves + dirt.
- **Collider:** cyl r=0.28 h=0.9 matches pot (~0.24 r, ~0.84 m plant) and existing kenneyDressing `addCyl`.
- **Wrap:** kind `pbr`. Pot UV origin (0,0) `potted_plant_02_pot_diff_1k.jpg` (terracotta wrap; dirt/pebble islands on +U). Leaves on `potted_plant_02_leaves_diff_1k.jpg`. Pot top is dirt, not a window.
- **Night emissive:** none (`art-deco` tint only).

### potted-04 (`potted_plant_04`) — approved
- **Six sides:** pot wall, pot bottom, dirt rim, succulent.
- **Collider:** cyl r=0.22 h=0.55 matches existing kenneyDressing (generous vs unit 0.27 m; type/pot shape hold).
- **Wrap:** kind `pbr`. Single atlas `potted_plant_04_diff_1k.jpg`, UV origin (0,0): cream pot along −V, gravel dirt +U−V, succulent +U+V. Rim/dirt is soil, not a window.
- **Night emissive:** none.

### bush (`kenney_bush`) — approved
- **Six sides:** foliage N/S/E/W, top, underside. Nature Kit `plant_bushDetailed`.
- **Collider:** none (ankle-high foliage).
- **Wrap:** kind `vertex-color`. Grass factor `#2cd8b8`, no atlas.
- **Night emissive:** none.
- **Scatter:** hash01 alley (z 84–124), salts 557/563/569/571.

### tree-grate (`tree_grate`) — approved
- **Six sides:** grate top (rings + radials + open trunk hole), square frame N/S/E/W, raised lip, bottom corner pads. Authored `buildTreeGrateGeo` (cBox/cCyl, origin at ground, 1.36 m square).
- **Collider:** none (flush, like a manhole).
- **Wrap:** kind `vertex-color`. Palette IRON `#3a3d40`, IRON_DK `#2c2f33`, IRON_LT `#4c5156`, BOLT `#6a7178`. Per-face BoxGeometry UV origin (0,0); colors drive the wrap. No +Y atlas.
- **Night emissive:** none.
- dressing.js still instances a legacy RingGeometry on `grateSpots` (rng4 layout). Catalog source is the 6-sided builder; did not restack that rng loop.

### hedge-box (`hedge_clipped`) — approved
- **Six sides:** clipped +Y, base −Y, ±X, ±Z. `RoundedBoxGeometry(1.8, 0.8, 0.75)` in dressing.js.
- **Collider:** box w=1.8 h=0.8 d=0.75 (unit geo; instances scale in place). Filled missing sizes.
- **Wrap:** kind `pbr`. `foliageTexture()` 128² canvas, UV origin (0,0), RepeatWrapping repeat [2.5, 1.6], base `#5f7d4a` mottles. Same sheet on all six faces including +Y — not a window atlas. Instance tints `#5f7a4a` `#6a8450` `#546e42` `#718a55` `#4d6b3f`.
- **Night emissive:** none.

## Rejected

None.

## Notes
- MODEL_KEYS already listed every download slug.
- Kenney Nature Kit palms/bush ship untextured `baseColorFactor` (catalog kind `vertex-color`, no colormap on disk).
- Kenney tree colormaps are the City Kit swatch atlas, not a facade photo.
