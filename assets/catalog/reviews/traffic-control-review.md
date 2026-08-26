# traffic-control review

Read `assets/catalog/miami-props.json`, `assets/catalog/reviews/traffic-control-model.md`, `js/world/miami/props/traffic-control.js`, `js/world/miami/road.js` (authored signal), Kenney GLB accessors + `Textures/colormap.png`, and Poly Haven `concrete_road_barrier` AABB + albedo. Did not draw rng/rng2/rng3/rng4. Did not restack existing kenneyDressing loops; hash01-scattered the three newly approved authored slugs only.

Gates: six sides described, no window atlas on +Y lids, collider matches the visual, wrap.kind in {vertex-color, colormap, pbr}, skins exist in catalog.skins.

## Approved

### bollard (`bollard_steel`)

- six sides: +X/+Z/−X/−Z galvanized shaft #3a424a + yellow band #e8c43a; +Y domed cap #4a525a; −Y flange #2a3036. Lid is vertex steel, not a window atlas.
- collider: cyl r=0.12 h=1.05 matches built height 1.05 m (flange r=0.15 / shaft r=0.095).
- wrap.kind: vertex-color. skins: miami-day, rain (both in catalog.skins).
- wrap notes: UV origin at ground y=0; vertex colour (no atlas); default Cylinder UV 0–1 unused. Palette `#3a424a` `#e8c43a` `#4a525a` `#2a3036`. Night emissive: none (skins emissive 0).
- scattered: CROSS_X flanks, city sidewalk z≈52.55, hash01, addCyl r=0.12 h=1.05.

### bollard-flex (`bollard_flex`)

- six sides: +X/+Z/−X/−Z orange post #e85a18 + white reflectors #eee6d8; +Y rounded cap #d44e14; −Y rubber base #1e2226.
- collider: cyl r=0.08 h=0.85 matches built height 0.85 m (base r=0.11 / post r=0.04).
- wrap.kind: vertex-color. skins: miami-day.
- wrap notes: UV origin at ground y=0; vertex colour (no atlas); default Cylinder UV unused. Palette `#e85a18` `#eee6d8` `#1e2226` `#d44e14`. Night emissive: none.
- scattered: shoulder-beach z≈38.45 hash ribbon, skip GAP_X / pier / blocked, addCyl r=0.08 h=0.85.

### ped-signal (`ped_signal`)

- six sides: −Z orange hand #cc4a1a + white walk #d8dce0 under visors #101214; +Z access door #2a2e34; ±X housing #1a1d22; +Y lid #1a1d22; −Y mount collar #3a4148. +Y is a coloured lid.
- collider: box 0.35×0.70×0.20 matches housing ~0.38×0.70×0.27 (visors thin).
- wrap.kind: vertex-color. skins: miami-night.
- wrap notes: UV origin at housing foot y=0; vertex colour (no atlas); default Box/Cylinder UV unused. Palette `#1a1d22` `#101214` `#2a2e34` `#cc4a1a` `#d8dce0` `#3a4148`. Night emissive: miami-night `#ffd27a` @ 1.15 (regDN 0 → 1.15).
- scattered: CROSS_X city-walk corners, yaw toward the crossing, addOBB 0.35×0.7×0.2.

## Rejected

- **signal-authored** — collider cyl r=0.12 h=5.5 misses the 0.42×1.22 head (visual to 6.19 m)
- **signal-kenney** — traffic-light-object-vertical is a 0.14 m centered head, not a 4.6 m pole
- **signal-horiz** — head-only mesh 0.10×0.06×0.14 m vs collider box 1.4×0.4×0.3
- **stop-sign** — road-sign-object-stop is a centered octagon without a pole; collider is cyl r=0.12 h=2.5
- **street-sign** — road-sign-object-street is a centered blade without a pole; collider is cyl r=0.08 h=2.8
- **warning-sign** — road-sign-object-warning is a centered diamond without a pole; collider is cyl r=0.08 h=2.4
- **highway-sign** — sign-highway AABB 0.13×0.71×1.00 m vs collider box 4×2×0.4
- **cone** — construction-cone AABB 0.075×0.094×0.075 m vs collider cyl r=0.16 h=0.72
- **jersey** — collider box 2.2×0.85×0.55 does not match scan AABB 1.545×0.831×0.639
- **construction-barrier** — construction-barrier AABB 0.135×0.130×0.225 m vs collider box 1.8×1.0×0.4
- **speed-limit** — collider cyl r=0.07 misses the 0.68×0.84 sign face

Kenney `Textures/colormap.png` is a 5×5 colour grid (not a window photo). Jersey albedo is concrete + stripe islands (not a window atlas). Those items still fail collider-vs-visual.

Existing kenneyDressing `stop_sign` / `traffic_cone` / `traffic_light` placements were left as-is.
