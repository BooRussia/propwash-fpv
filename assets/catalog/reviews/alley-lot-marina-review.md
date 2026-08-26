# alley-lot-marina review

Walked catalog section `alley-lot-marina` against `alley-lot-marina-model.md`, `js/world/miami/props/alley-lot-marina.js`, Poly Haven 1k glTF AABBs + diff maps, colliders, and `catalog.skins`. No rng/rng2/rng3/rng4 draws. kenneyDressing not restacked except hash01 scatter of newly approved slugs `wooden_crate_02`, `Barrel_01`, `dock_cleat`, `dock_pile`, `pallet_wood`, `cardboard_stack`. Existing `covered_car` loop left in place.

Skins used: `industrial`, `miami-day` (both in `catalog.skins`). wrap.kind is `vertex-color` | `pbr`. None of this section lists `miami-night`; night emissive is off.

## Approved

### crate (`wooden_crate_02`) — approved

Poly Haven 1k glTF, crate + lid meshes. Six sides: crate walls ±X ±Z, wood lid +Y, underside −Y. Lid is plank boards on the 1k unwrap, not a window atlas. Box `0.53×0.46×1.17` filled from scan AABB 0.529×0.464×1.166 (origin at ground). Skin: `industrial`.

- **UV origin:** glTF `TEXCOORD_0` (0,0) lower-left of 1k unwrap
- **Atlas:** `textures/wooden_crate_02_diff_1k.jpg` (plank walls, lid boards, WELC stencil); ARM `wooden_crate_02_arm_1k.jpg`; `nor_gl`
- **Night emissive:** none (`industrial.emissive` 0)
- **Scatter:** hash01 alley (z 84–124), salts 1403/1409/1417/1423; yaw 0 or π

### barrel-1 (`Barrel_01`) — approved

Poly Haven 1k glTF, single upright drum. Six sides: hoop wall N/S/E/W, bung lid +Y, base −Y. +Y is a circular red-metal island, not a window atlas. Cyl `r=0.28 h=0.88` filled from AABB r=0.282 / y −0.007…0.873. Skin: `industrial`.

- **UV origin:** glTF `TEXCOORD_0` (0,0) lower-left of 1k unwrap
- **Atlas:** `textures/Barrel_01_explosive_diff_1k.jpg` (left wrap + warning triangles; right lid/base + bung); ARM + nor_gl
- **Night emissive:** none (`industrial.emissive` 0)
- **Scatter:** hash01 marina fingers at dock top y=0.8, salts 1471/1477/1481/1483

### cleat (`dock_cleat`) — approved

Authored `props/alley-lot-marina.js#buildDockCleatGeo`. Six sides: ±X horn tips, ±Z base plate + horn barrel, +Y horns, −Y underside. Box `0.35×0.16×0.18` matches envelope ~0.35×0.14×0.16. +Y is galvanized horns, not a window atlas. Skin: `industrial`.

- **UV origin:** deck y=0; Box/Cylinder UV unused
- **Vertex palette:** iron `#4a5158`, galv `#8a9298`, galv2 `#6d747c`, bolt `#3a3e42`
- **Night emissive:** none (`industrial.emissive` 0)
- **Scatter:** hash01 dock edges, salts 1487/1493; yaw π/2 (horns along finger)

### pile-cap (`dock_pile`) — approved

Authored `buildDockPileGeo`. Six sides: tapered timber N/S/E/W, rope wrap, +Y pyramidal cap, −Y butt. Cyl `r=0.22 h=2.4` matches max r=0.20 / finial 2.38. Cap is `#d8d4c8`, not a window atlas. Skin: `industrial`.

- **UV origin:** ground y=0; Cylinder UV unused
- **Vertex palette:** wood `#6a5344`, wood2 `#4e3d32`, rope `#8a7048`, rope2 `#7a6240`, ring `#6d747c`, cap `#d8d4c8`
- **Night emissive:** none
- **Scatter:** hash01 beside marina fingers, salts 1501/1511/1523

### pallet (`pallet_wood`) — approved

Authored `buildPalletWoodGeo`. Six sides: +Y deck boards, −Y underside boards, ±X/±Z stringer ends + slat edges. Box `1.2×0.14×1.0` matches 1.20×0.134×1.00. Deck lid is wood, not a window atlas. Skin: `industrial`.

- **UV origin:** ground y=0; BoxGeometry UV unused
- **Vertex palette:** deck `#b08a58` / `#9a7548`, stringer `#6a4e32`, under `#5a4030`
- **Night emissive:** none
- **Scatter:** hash01 alley (z 84–124), salts 1429/1433/1439/1447; yaw 0 or π

### cardboard (`cardboard_stack`) — approved

Authored `buildCardboardStackGeo`. Six sides: kraft faces ±X ±Z + tape seams, +Y closed/open flaps, −Y bottom carton. Box `0.80×0.82×0.43` filled from envelope x −0.32…0.40 / y 0…0.814 / z ±0.212. Flap lid is kraft, not a window atlas. Skin: `industrial`.

- **UV origin:** ground y=0; BoxGeometry UV unused
- **Vertex palette:** kraft `#c4a06a` / `#b08a52` / `#d4b07a`, tape `#d8c48a`, flap `#ae8c58`, seam `#8a6a40`, stencil `#3a5a7a`
- **Night emissive:** none
- **Scatter:** hash01 alley (z 84–124), salts 1451/1453/1459/1461; yaw 0 or π

## Rejected

### barrel-wood (`wooden_barrels_01`)
exploded kit (2 barrels + 17 pieces, AABB ~4.5×0.92×3.3) does not match one cyl

### tyre (`old_tyre`)
collider cyl does not match AABB 0.60×0.60×0.17 (axis +Z, origin at centre)

### covered-car (`covered_car`)
collider box 4.4×1.5×1.9 does not match scan AABB 1.79×1.41×4.38

### buoy (`ocean_buoy`)
collider cyl from origin up does not match AABB y −0.81…1.85 (chain below waterline)

## Notes
- MODEL_KEYS already listed every download slug.
- Authored builders use `cBox`/`cCyl` + vertex colour; no rng streams.
- Existing kenneyDressing `covered_car` placements were not restacked.
