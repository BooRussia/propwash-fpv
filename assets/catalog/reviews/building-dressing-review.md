# building-dressing review

Walked catalog section `building-dressing` against `building-dressing-model.md`, authored geos (`building-dressing.js`, `geo.js#buildRoofAcUnitGeo`, `buildings.js` rooftop kits), Kenney GLBs + colormaps, Poly Haven aircon glTF, and colliders. Skins checked against `catalog.skins`. No rng/rng2/rng3/rng4 draws. kenneyDressing not restacked — no newly approved download slugs.

## Approved

### flag-pole (`flagpole`) — approved

`props/building-dressing.js#buildFlagpoleGeo`. Six sides: ±X/±Z tapered cream pole + stone plinth drum, +Y gold ball, −Y stone base. Visual ~7.04 m; steel collar r=0.085; collider `cyl r=0.08 h=7` matches the shaft envelope. Skins: `art-deco`. +Y is vertex-colour gold, never a window atlas.

- **UV origin:** ground; grows +Y, origin at pole centre
- **Vertex palette:** plinth `#9a9488`, cap `#7a756c`, collar `#6d747c`, pole `#e8e0d0`, finial `#4a5158`, ball `#d4b45a`
- **Night emissive:** none (`art-deco` emissive 0)

## Rejected

### dumpster (`dumpster`)
collider cyl r=0.9 h=1.5 does not match Kenney AABB 0.275×0.209×0.370 (×1.15 → 0.316×0.241×0.426)

### ac-unit (`roof_ac_unit`)
collider none does not match 1.70×1.01×1.33 AC pack

### ac-scan (`exterior_aircon_unit`)
collider box (no size) does not match 0.80×0.93×0.37 unit (scene is two units, AABB 1.80×0.93×0.37)

### roof-kit (`rooftop_kit`)
collider none does not match 5.8×2.8×4.7 AC+tank+pergola kit

### roof-dish (`rooftop_dish`)
collider none does not match dish farm + AC (~5.5×2.2×3.0)

### roof-tank (`rooftop_tank`)
collider none does not match twin tanks + ladder (~4.2×2.3×2.3)

### helipad-pad (`rooftop_helipad`)
collider none does not match 8.3 m tarmac disc

### far-sky-a (`kenney_skyscraper_a`)
collider 26.6×60.8×26.6 does not match Kenney AABB 1.36×2.88×1.36 (×3.8 → 5.17×10.94×5.17)

### house-a (`kenney_house_a`)
collider 12.6×16.2×12.6 does not match Kenney AABB 1.30×0.83×1.03 (×1.8 → 2.34×1.50×1.85)

### window-ac-row (`window_ac_row`)
collider none does not match 2.56×0.46×0.67 through-wall AC row
