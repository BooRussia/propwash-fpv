# beach-boardwalk review

Walked catalog section `beach-boardwalk` against `beach-boardwalk-model.md`, `js/world/miami/props/beach-boardwalk.js`, `street.js#buildBoardwalkEdge`, `landmarks/beachProps.js#buildLoungerGeo`, Kenney `parasol_a` / `parasol_b` GLBs + colormaps, and Poly Haven 1k glTF AABBs. Skins checked against `catalog.skins`. No rng/rng2/rng3/rng4 draws. Existing kenneyDressing loops left in place; newly approved slugs `parasol_b`, `wooden_picnic_table`, `CoffeeCart_01`, `life_ring` scattered with hash01 (salts 1601+).

## Approved

### chair (`plastic_monobloc_chair_01`) — approved

Poly Haven 1k scan. Six sides: +Y seat slats, −Y underside, backrest, ±X legs, ±Z seat lip. Cyl `r=0.32 h=0.85` matches AABB 0.642×0.880×0.628 (already scattered at scale 1.0). Seat is plastic, not a window atlas. Skin: `miami-day`.

- **UV origin:** glTF TEXCOORD_0 (0,0) lower-left of 1k unwrap
- **Atlas:** `textures/plastic_monobloc_chair_01_diff_1k.jpg` seat/back/leg islands; ARM `plastic_monobloc_chair_01_arm_1k.jpg`; nor_gl 1k
- **Night emissive:** none (`miami-day` emissive 0)

### parasol-b (`parasol_b`) — approved

Kenney Commercial Kit `detail-parasol-b` + `Textures/colormap.png`. Six sides: ±X/±Z canopy scallops, +Y finial/canopy top, −Y base. Filled missing cyl to `r=0.2 h=0.45` matching AABB 0.346×0.450×0.400. Canopy lid is slate/yellow cells, not windows. Skin: `miami-day`.

- **UV origin:** BL on Textures/colormap.png (512, 8×8 cells)
- **Atlas:** u 0.094–0.469 × v 0.275–0.725; canopy col0 row2–3 `#626880`/`#787d95` + col1 row5 `#ffc255`; pole col0 row4–5 `#2a9370`/`#4fba82`
- **Night emissive:** none
- **Scatter:** hash01 beach-sand (z 6.2–16.2), salts 1601/1607/1609

### shell (`lambis_shell`) — approved

Poly Haven 1k scan. Six sides: dorsal spiral, aperture lip, spines, ventral −Y. Collider none matches 0.140×0.047×0.075 m ankle-high scan (already scattered, no solid). +Y is shell, not a window. Skin: `miami-day`.

- **UV origin:** glTF TEXCOORD_0 (0,0) lower-left of 1k unwrap
- **Atlas:** `textures/lambis_shell_diff_1k.jpg` spiral/aperture/spine islands; ARM `lambis_shell_arm_1k.jpg`; nor_gl 1k
- **Night emissive:** none

### lounger (`beach_lounger`) — approved

In-engine `beachProps.js#buildLoungerGeo`. Six sides: +Z foot rail, −Z reclined head, ±X tube rails, +Y webbing, −Y feet. Filled missing box to `0.62×0.75×2.05` matching merged AABB. Lid is webbing, not a window atlas. Skin: `miami-day`.

- **UV origin:** ground; foot rail +Z, reclined head −Z
- **Vertex palette:** rail `#b7bec4` / wood `#c4a574`, web `#e0826e` / cream `#f0e6bb`
- **Night emissive:** none

### shower (`beach_shower`) — approved

In-engine `street.js#buildBoardwalkEdge`. Six sides: drain pad +Y/−Y, riser barrel, arm −X, head, extra pipe. Filled missing cyl to `r=0.1 h=2.78` matching the pole (drain pad is a 9 cm visual, like a manhole). Head is steel, not a window atlas. Skin: `miami-day`.

- **UV origin:** ground; riser +Y, arm toward −X
- **Vertex palette:** drain `#9aa0a4`, riser `#3c444b`, head `#8f979c`, pipe `#cfd3d6`
- **Night emissive:** none

### bollard-lamp (`boardwalk_bollard`) — approved

In-engine `street.js#buildBoardwalkEdge`. Six sides: post barrel, lens ring, +Y cap, −Y foot. Cyl `r=0.15 h=1.08` matches cap r=0.15 / top 1.08 (lens r=0.155). Cap lid is dark steel, not a window atlas. Skin: `miami-night`.

- **UV origin:** deck top; post +Y
- **Vertex palette:** post `#2c3339`, shroud `#22282e`, cap `#363e45`, lens `#ffc37a`
- **Night emissive:** lens only, `#ffc37a` @ 2.4 (`regDN` 0.05 / 2.9)

### life-ring (`life_ring`) — approved

Authored `props/beach-boardwalk.js#buildLifeRingGeo`. Six sides: +Z plaque, −Z orange ring, ±X post+ring, +Y cap, −Y flange. Cyl `r=0.12 h=1.4` matches flange r=0.11 / post top 1.38 (ring is a fly-through torus). Cap is steel, not a window atlas. Skin: `miami-day`.

- **UV origin:** ground; post +Y, ring in XY at z=−0.18, plaque on +Z
- **Vertex palette:** post `#6d747c`, flange `#4a5158`, ring `#ff6a2a`, band `#f4f1ea`, brass `#b08a4a`, cream `#f0e6bb`, letter `#2b3036`
- **Night emissive:** none
- **Scatter:** hash01 pier deck edges, salts 1667/1669/1693

### picnic (`wooden_picnic_table`) — approved

Poly Haven 1k scan. Six sides: +Y table planks, −Y stringers, ±X bench ends, ±Z table/bench edges. Filled missing box to `2.24×0.75×3.02` matching AABB 2.241×0.746×3.022. Lid is wood planks, not a window photo. Skin: `miami-day`.

- **UV origin:** glTF TEXCOORD_0 (0,0) lower-left of 1k unwrap
- **Atlas:** `textures/wooden_picnic_table_top_diff_1k.jpg` plank lid; `wooden_picnic_table_bottom_diff_1k.jpg` benches/legs; ARM + nor_gl per set
- **Night emissive:** none
- **Scatter:** hash01 boardwalk (z ~24.8), yaw π/2 so the long axis runs +X, salts 1613/1619/1621

### coffee-cart (`CoffeeCart_01`) — approved

Poly Haven 1k scan (cart + props + mugs). Six sides: cart body ±X/±Z, +Y machine/props lid, −Y undercarriage/wheels. Filled missing box to `2.17×1.72×1.07` matching union AABB 2.168×1.718×1.073. Lid is machine housing, not a window photo. Skin: `miami-day`.

- **UV origin:** glTF TEXCOORD_0 (0,0) lower-left of 1k unwrap
- **Atlas:** `textures/CoffeeCart_01_cart_diff_1k.jpg` body/wheels; `CoffeeCart_01_props_diff_1k.jpg` machine/labels; mugs untextured factor; ARM + nor_gl per set
- **Night emissive:** none
- **Scatter:** hash01 boardwalk, count 2, salts 1627/1637/1657/1663

## Rejected

### parasol-a (`parasol_a`)
collider cyl r=0.08 h=2.1 does not match Kenney AABB 0.346×0.450×0.400

## Notes
- MODEL_KEYS already listed every download slug.
- Kenney parasol colormaps are the City Kit swatch atlas (same sheet as awning); +Y canopy is slate/yellow cells, not a facade.
- Chair / shell / parasol_a placements already in kenneyDressing were not restacked.
- Lounger / shower / bollard-lamp stay on their in-engine builders (`beachProps.js`, `street.js`).
