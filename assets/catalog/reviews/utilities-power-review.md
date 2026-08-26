# utilities-power review

Walked `assets/catalog/miami-props.json`, `assets/catalog/reviews/utilities-power-model.md`, `js/world/miami/props/utilities-power.js`, `js/world/miami/road.js` storm-drain block, Kenney `electricity_pole` GLB + colormap, Poly Haven `utility_box_01` / `security_camera_01` glTF + 1k maps. No rng streams. Kenney dressing restack limited to hash01 scatter of newly approved slug `security_camera_01`.

Skins used: `industrial`, `rain`, `miami-day` (all in `catalog.skins`). None of this section lists `miami-night`; night emissive is off unless noted.

## Approved

### pole-authored (`utility_pole_wood`)
- sixSides: shaft, crossarm, insulators, base (solid 3D; +Y is steel cap, not a window atlas)
- collider: cyl r=0.2 h=9.5 matches shaft (r 0.12–0.20, y 0.18–9.50); plinth is a short Ø0.56 pad
- wrap.kind: vertex-color; skins: industrial
- **wrap notes:** UV origin ground y=0; Three.js default per-primitive UVs unused. Palette: shaft `#6a5344`, crossarm `#4e3d32`, base `#9a9488`, steel `#6d747c` / `#4a5158`, porcelain `#d4cbb8`. Night emissive: none (`industrial.emissive` 0).

### power-span (`power_span`)
- sixSides: three sagging wire tubes (28 m default, r=0.02)
- collider: none (matches tubes)
- wrap.kind: vertex-color; skins: industrial
- **wrap notes:** UV origin first-pole ground, run +X; tube UVs from CylinderGeometry. Palette: `#2c3238`. Night emissive: none.

### transformer (`pole_transformer`)
- sixSides: can, bushings, bracket
- collider: cyl r=0.28 h=0.7 matches can Ø0.48–0.50 + fins; origin at bracket underside
- wrap.kind: vertex-color; skins: industrial
- **wrap notes:** UV origin mount y=0. Palette: can `#8a9298`, fins `#5c656c`, bracket `#4a5158`, porcelain `#d4cbb8`, nameplate `#3a4046`. Night emissive: none.

### traffic-cabinet (`traffic_cabinet`)
- sixSides: door, vents, sides, pad (front door / back body / L-R louvers / lid / pad)
- collider: box 0.7×1.35×0.5 matches body 0.68×1.20×0.46 and lid to y=1.33
- wrap.kind: vertex-color; skins: industrial
- **wrap notes:** UV origin ground y=0. Palette: pad `#9a9488`, body `#5c656c`, door `#8a9298`, lid/handle `#4a5158`, lock `#c9a227`, badge `#3a4046`. Night emissive: none.

### manhole (`manhole_cover`)
- sixSides: lid top + rim; +Y is iron rings, no window atlas
- collider: none (flush in travel)
- wrap.kind: vertex-color; skins: miami-day
- **wrap notes:** UV origin street plane. Palette: lid `#3a3e42`, rim/ribs `#2a2e32`, pick hole `#1a1c1e`. Night emissive: none (`miami-day.emissive` 0).

### storm-drain (`storm_drain`)
- sixSides: grate top — in-engine 0.85×0.02×0.42 box, all six faces present; +Y is a dark lid
- collider: none (flush on both shoulders)
- wrap.kind: vertex-color (uniform MeshStandardMaterial, not a colormap/pbr atlas); skins: miami-day
- **wrap notes:** UV origin Three.js BoxGeometry 0–1 per face. Palette: `#14181c` (roughness 0.9, metalness 0.25). Night emissive: none.

### fire-dept-siamese (`standpipe_siamese`)
- sixSides: ports, body, wall plate
- collider: box 0.45×0.7×0.25 matches plate/body; ports on −Z
- wrap.kind: vertex-color; skins: industrial
- **wrap notes:** UV origin ground, plate on +Z. Palette: plate `#4a5158`, body/ports `#d63426`, brass caps `#b08a4a`, badge `#c9a227`. Night emissive: none.

### security-cam (`security_camera_01`)
- sixSides: scan (body + glass island); +Y is housing, not a window atlas
- collider: none matches 0.17×0.29×0.55 m corner cam
- wrap.kind: pbr; skins: industrial
- **wrap notes:** UV origin glTF `TEXCOORD_0` (0,0) lower-left of 1k unwrap. Atlas: `textures/security_camera_01_diff_1k.jpg` (housing / bracket islands; lens in dark inset); ARM `security_camera_01_arm_1k.jpg`; glass uses same diff + BLEND. Night emissive: none (`industrial.emissive` 0). Scattered on storefront fascia with hash01 only.

## Rejected

### elec-pole (`electricity_pole`)
Kenney GLB is 0.58×0.53×0.21 m; collider cyl r=0.22 h=9 does not match.

### utility-box (`utility_box_01`)
Collider w=0.7 vs scan width 0.52 m (h=1.12 d=0.43).
