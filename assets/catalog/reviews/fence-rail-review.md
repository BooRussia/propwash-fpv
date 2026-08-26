# fence-rail review

Walked catalog section `fence-rail` against `fence-rail-model.md`, authored geos, Kenney GLBs + colormaps, and colliders. Skins checked against `catalog.skins`. No rng/rng2/rng3/rng4 draws. kenneyDressing not restacked — no newly approved download slugs.

## Approved

### dune-fence (`dune_fence`) — approved

In-engine `street.js#buildBoardwalkEdge`. Box posts + tube rails, vertex colour, no map. Run collider `box h=1.06 d=0.14` matches the 1.15 m posts / 0.075 m depth (one box per run). Skins: `miami-day`.

- **UV origin:** ground; boardwalk seaward edge z=22.4; posts along +X, 2.9 m spacing
- **Vertex palette:** post `#a9977a`, rail `#bfae8d`
- **Night emissive:** none (`miami-day` emissive 0)

### pipe-rail (`pipe_railing`) — approved

`props/fence-rail.js#buildPipeRailingGeo`. Six sides: +Z/−Z posts+rails, +X/−X post barrels, +Y top rail, −Y flange plates. Default bay span 1.6 m, postH 1.02 m; collider `box h=1.05 d=0.08` matches. Skins: `rain`, `industrial`.

- **UV origin:** ground; bay along +X, origin at run centre
- **Vertex palette:** flange/cap `#6d747c`, post `#9ba3ab`, rail `#8d959d`
- **Night emissive:** none (both skins emissive 0)

### chain-link (`chain_link_run`) — approved

`props/fence-rail.js#buildChainLinkRunGeo`. Six sides: +Z/−Z mesh panel, +X/−X terminal posts, +Y top rail, −Y tension wire + post feet. Default span 2.44 m, h=1.7 m; collider `box h=1.7 d=0.08` matches. Skins: `industrial`.

- **UV origin:** ground; bay along +X, origin at run centre
- **Vertex palette:** post `#8d959d`, rail/flange `#6d747c`, mesh `#7a8078`
- **Night emissive:** none (`industrial` emissive 0)

### gate-swing (`swing_gate`) — approved

`props/fence-rail.js#buildSwingGateGeo`. Six sides: +Z/−Z frame+mesh, −X hinge barrels, +X latch, +Y header, −Y bottom rail. Default 1.4 × 1.2 m; collider `box w=1.4 h=1.2 d=0.08` matches. Skins: `industrial`.

- **UV origin:** ground; leaf in XZ, hinges on −X
- **Vertex palette:** frame `#9ba3ab`, rail `#8d959d`, mid `#6d747c`, mesh `#7a8078`, hinge `#6a4034`, latch `#3c4249`
- **Night emissive:** none (`industrial` emissive 0)

## Rejected

### fence-low (`fence_low`)
collider h=0.9 d=0.12 does not match Kenney AABB 1.275×0.170×0.838

### fence-tall (`fence`)
collider h=1.8 d=0.12 does not match Kenney AABB 0.475×0.270×0.075

### construction-fence (`construction_fence`)
collider h=1.8 d=0.08 does not match Kenney AABB 0.075×0.179×0.375

### deco-rail (`deco_railing`)
collider none does not match 3.15×1.12×1.20 slab+glass balcony
