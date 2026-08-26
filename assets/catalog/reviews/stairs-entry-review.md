# stairs-entry review

Walked `assets/catalog/reviews/stairs-entry-model.md`, `js/world/miami/props/stairs-entry.js`, `geo.js#buildStairFlightGeo` / `buildPilotisColumnGeo`, `buildings.js` stoop + hotel canopy, Kenney `awning` / `awning_wide` / `overhang` GLBs + `Textures/colormap.png`, and `MODEL_KEYS`. hash01 only. Did not restack existing kenneyDressing loops.

All 9 items approved. No rejects.

## Approved

### stair-flight (`stair_flight`)
- Six sides in geo comments and catalog. Vertex colour, no window atlas.
- Collider box 3.2 × 2.18 × 2.56 matches default flight + rail envelope.
- Skins `miami-day`, `art-deco` exist.
- **Wrap:** UV origin bottom-tread front (+Z run, +Y rise). Palette stone `#6a655c`, rail `#2b3138`. Night emissive 0.
- Already instanced on hotel entries in `buildings.js` — not re-scattered.

### stoop (`entry_stoop`)
- Three treads + side posts; all six sides present (posts, not cheek walls).
- Collider box 3.6 × 0.85 × 1.15 matches the step/post envelope.
- Skin `art-deco` exists.
- **Wrap:** UV origin ground under lowest tread. Palette step `#6a655c`, posts `#3a4148`. Night emissive 0.
- Already in shop bays — not re-scattered.

### ramp (`curb_ramp`)
- Authored `buildCurbRampGeo`: landing, truncated-dome warning, cheek curbs, slope, soffit.
- Collider box 1.68 × 0.22 × 2.24 matches the slab + cheeks (was `none`; solid 0.15 m curb-height pad).
- Skin `miami-day` exists.
- **Wrap:** UV origin street-edge; +Z upslope. Palette conc `#7a756c` / `#5c5852`, warn `#d4a017`, cheek `#6a655c`. Night emissive 0.
- **Scatter:** new — GAP_X city-walk corners, hash01 / `clear` only.

### handrail (`stair_handrail`)
- Authored `buildStairHandrailGeo`: wall plates, barrel, returns, rail, brackets.
- Collider box 0.14 × 1.9 × 2.15 matches the thin rail envelope.
- Skin `rain` exists.
- **Wrap:** UV origin ground under bottom return; wall +X. Palette steel `#9aa3ab`, dark `#6d747c`, plate `#5c646c`. Night emissive 0.
- **Scatter:** new — storefront hash01 slots (salts 1103/1109/1117).

### awning (`awning`)
- Kenney GLB has all six sides. Colormap is an 8×8 palette, not a window photo. +Y samples slate col0, not windows.
- Collider box 0.40 × 0.40 × 0.15 matches unit mesh (existing scatter scales it).
- Skin `art-deco` exists.
- **Wrap:** UV origin BL `Textures/colormap.png` (512²). Atlas u=0.09375 col0; canvas v=0.53–0.73 `#4fba82`; frame/soffit v=0.28–0.48 `#787d95`. Night emissive 0.
- Already scattered in kenneyDressing — not restacked.

### awning-wide (`awning_wide`)
- Same six-side mesh / colormap family as `awning` (0.8 m wide).
- Collider box 0.80 × 0.40 × 0.15 matches unit mesh.
- Skin `art-deco` exists.
- **Wrap:** same col0 teal canvas / slate frame. +Y lid is a slate cell, not a window photo. Night emissive 0.
- **Scatter:** new — storefront hash01 (salts 1123–1141).

### overhang (`overhang`)
- Six sides present. Colormap palette; +Y row 4 terracotta/orange, not windows.
- Collider box 0.50 × 0.40 × 0.20 matches unit mesh.
- Skin `industrial` exists.
- **Wrap:** UV origin BL colormap. Atlas u=0.22–0.47 cols 1–3 orange `#ffa139` to red `#dd5b4a`; v=0.53–0.73 rows 4–5. Night emissive 0.
- **Scatter:** new — storefront hash01 (salts 1147–1163).

### canopy-posts (`hotel_canopy`)
- Posts, plinths, fascia (vertex colour) + untextured glass lid `#cfe4ec` (no map — not a window atlas).
- Collider cyl r=0.11 h=3.85 matches posts; engine also collides a thin lid slab (never a bay-filling box).
- Skin `art-deco` exists.
- **Wrap:** UV origin ground at post feet. Palette post `#3a4148`, base `#8c9298`, lid `#cfe4ec`. Night emissive 0.
- Already on hotel entries — not re-scattered.

### pilotis (`pilotis_column`)
- Plinth, tapered shaft, capital; six sides in geo comments.
- Collider cyl r=0.38 h=9.5 matches the shaft (plinth r=0.49).
- Skin `industrial` exists.
- **Wrap:** UV origin ground +Y. Palette `#8a8680`. Night emissive 0.
- Already on fly-under towers — not re-scattered.

## Rejected

(none)
