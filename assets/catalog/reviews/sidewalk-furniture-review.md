# sidewalk-furniture review

Walked catalog section `sidewalk-furniture` against `sidewalk-furniture-model.md`, `js/world/miami/props/sidewalk-furniture.js`, `street.js` builders, Kenney GLBs + colormaps, Poly Haven 1k glTF AABBs, and colliders. Skins checked against `catalog.skins`. No rng/rng2/rng3/rng4 draws. kenneyDressing not restacked — no newly approved download slugs.

## Approved

### bench-slat (`bench_slat`) — approved

In-engine `street.js#buildBenchGeo`. Six sides: ±X frame legs, −Z seat face, +Z back rest, +Y slats, −Y underside. OBB `1.78×0.99×0.66` matches 1.72 m slats / 0.99 m rest / 0.58 m depth. Lid is wood slats, not a window atlas. Skins: `miami-day`, `art-deco`.

- **UV origin:** ground; seat facing −Z, back rest at +Z
- **Vertex palette:** wood `#a5714a`, frame `#2b3036`
- **Night emissive:** none (both skins emissive 0)

### bin-drum (`bin_drum`) — approved

In-engine `street.js#buildBinGeo`. Six sides: barrel wall around +Y, +Y lid + hopper, −Y base. Cyl `r=0.28 h=0.7` matches max r=0.27 / top 0.70. Skins: `miami-day`, `industrial`.

- **UV origin:** ground; cylinder axis +Y
- **Vertex palette:** barrel `#35594a`, lid/base `#22282e`, hopper `#0c0f12`
- **Night emissive:** none (both skins emissive 0)

### trash-can-enamel (`trash_can`) — approved

In-engine `street.js#buildTrashCanGeo`. Six sides: −Z hopper, +Z/−X/+X enamel, +Y lid + handle, −Y base. Box `0.50×0.92×0.44` matches body 0.48×0.78×0.42 + lid. Skins: `miami-day`, `industrial`.

- **UV origin:** ground; hopper on −Z
- **Vertex palette:** enamel `#35594a`, hopper `#2a4538`, lid `#2a2f36`, handle `#8d949a`, base `#1e252c`
- **Night emissive:** none (both skins emissive 0)

### hydrant (`hydrant`) — approved

In-engine `street.js#buildHydrantGeo`. Six sides: barrel wall, +Y cap, ports in XZ, −Y plinth. Cyl `r=0.2 h=0.72` matches barrel r=0.17 / cap 0.72. Skins: `miami-day`, `miami-night`.

- **UV origin:** ground; barrel +Y, ports in XZ
- **Vertex palette:** barrel `#d63426`, cap `#f2ead8`, plinth `#8f8a80`
- **Night emissive:** none on barrel (do not apply `miami-night` emissive `#ffd27a` @ 1.15 to the whole mesh)

### meter (`parking_meter`) — approved

In-engine `street.js#buildMeterGeo`. Six sides: pole around +Y, head box, ±Z display, −Y foot. Cyl `r=0.11 h=1.42` matches head half-width 0.085 / top 1.425. Skins: `miami-day`, `miami-night`.

- **UV origin:** ground; display on ±Z
- **Vertex palette:** pole `#5a636b`, head `#37525c`, display `#d8d3c8`
- **Night emissive:** display only, `#ffd27a` @ 1.15 (`miami-night`)

### newsbox (`newsbox`) — approved

In-engine `street.js#buildNewsboxGeo`. Six sides: −Z glass door + plate, +Z enamel, −X coin slot, +X enamel, +Y lid + handle, −Y base. Box `0.46×0.9×0.4` matches. Lid is enamel, not a window atlas. Skins: `art-deco`, `miami-day`.

- **UV origin:** ground; glass door on −Z
- **Vertex palette:** body `#2f6f7a`, back/lid `#245860`, glass `#1a2830`, cream `#f0e6bb`, chrome `#b8c0c6`, base `#1e252c`
- **Night emissive:** none (both skins emissive 0)

### bike-rack (`bike_rack`) — approved

In-engine `street.js#buildBikeRackGeo`. Six sides: three YZ hoops + posts, open ±X. Box `1.16×0.89×0.72` matches hoop span 1.06 / height 0.91 / depth 0.72. Skins: `miami-day`, `rain`.

- **UV origin:** ground; hoops in YZ, spaced along X
- **Vertex palette:** steel `#9aa6b0`
- **Night emissive:** none (both skins emissive 0)

### deco-lamp (`deco_lamp`) — approved

In-engine `street.js#buildDecoLampGeo`. Six sides: ±X/±Z plinth + pole + cage, +Y cream finial (not a window atlas), −Y limestone plinth. Cyl `r=0.14 h=3.45` matches pole/globe (globe r=0.13, finial 3.48). Skins: `art-deco`, `miami-night`.

- **UV origin:** ground; pole +Y, finial lid not a window atlas
- **Vertex palette:** stone `#9a9488`, bronze `#4a4540`, globe `#ddd6c4`, cream `#f0e6bb`
- **Night emissive:** globe only, `#ffd27a` @ 1.15 (`miami-night`)

### gooseneck-lamp (`gooseneck_lamp`) — approved

In-engine `street.js#buildStreet`. Six sides: pole around +Y, arm tubes, fixture can, −Y foot. Catalog cyl `r=0.12 h=5.7` matches the 0.11 m pole; in-engine also boxes the 1.7 m arm. Untextured standard mats (same family as vertex colour), no window atlas. Skin: `miami-night`.

- **UV origin:** ground; pole +Y, arm toward carriageway in +Z
- **Vertex palette:** pole `#39424c`, head `#fff2cc`
- **Night emissive:** head only, `#ffd27a` @ 2.4 (`regDN` 0.15 / 2.4)

### mail-box (`mailbox_us`) — approved

Authored `props/sidewalk-furniture.js#buildMailboxGeo`. Six sides: −Z door + pull + slot, +Z enamel, −X schedule plate, +X enamel, +Y lid, −Y four legs. Box `0.55×1.3×0.5` matches 0.52×1.31×0.46. Lid is enamel, not a window atlas. Skin: `miami-day`.

- **UV origin:** ground; door on −Z, lid +Y not a window atlas
- **Vertex palette:** body `#1e4d8c`, door/lid `#163a6b`, chrome `#b8c0c6`, leg `#2b3036`, plate `#f0e6bb`, slot `#0c0f12`
- **Night emissive:** none (`miami-day` emissive 0)

### newspaper-stack (`paper_stack`) — approved

Authored `props/sidewalk-furniture.js#buildPaperStackGeo`. Six sides: ±Z paper edges + ink band, ±X sheet ends, +Y masthead, −Y underside. Box `0.4×0.25×0.3` matches 0.40×0.25×0.30 sheets. Skin: `industrial`.

- **UV origin:** ground; stack in XZ, masthead on +Y
- **Vertex palette:** sheets `#e8e4d8` / `#ddd6c4` / `#f2eee6` / `#d4cfc2` / `#e6e0d2`, ink `#2b3036`, twine `#8a7048`
- **Night emissive:** none (`industrial` emissive 0)

### dog-bag (`dog_bag_dispenser`) — approved

Authored `props/sidewalk-furniture.js#buildDogBagDispenserGeo`. Six sides: −Z dispenser door + roll, +Z post, ±X box, +Y lid, −Y flange. Cyl `r=0.08 h=1.1` matches flange r=0.08 / post top 1.10. Lid is green, not a window atlas. Skin: `miami-day`.

- **UV origin:** ground; post +Y, box on −Z, lid +Y
- **Vertex palette:** flange `#2b3036`, post `#3a4038`, box `#4a7a3c`, door `#2a4538`, lid `#2f4e28`, roll `#c4c8b0`, sign `#f0e6bb`
- **Night emissive:** none (`miami-day` emissive 0)

### water-fountain (`street_fountain`) — approved

Authored `props/sidewalk-furniture.js#buildStreetFountainGeo`. Six sides: −Z spout + button, ±X/+Z stem, +Y bowl + basin, −Y stone base. Cyl `r=0.28 h=0.95` matches base r=0.28 / spout 0.95. Bowl lid is steel, not a window atlas. Skins: `miami-day`, `rain`.

- **UV origin:** ground; stem +Y, spout on −Z, bowl lid not a window atlas
- **Vertex palette:** stone `#9a9488`, steel `#9aa6b0`, basin `#4a5858`, chrome `#b8c0c6`, drain `#1e252c`, button `#37525c`
- **Night emissive:** none (both skins emissive 0)

### payphone (`payphone_kiosk`) — approved

Authored `props/sidewalk-furniture.js#buildPayphoneKioskGeo`. Six sides: −Z hood + phone + keypad, +Z enamel, ±X wings, +Y cream roof, −Y pad. Box `0.8×2.2×0.5` matches 0.80×2.20×0.50. Roof is cream, not a window atlas. Skins: `art-deco`, `miami-night`.

- **UV origin:** ground; hood on −Z, roof +Y cream lid not a window atlas
- **Vertex palette:** pad `#2a2f36`, teal `#2f6f7a`, cream `#f0e6bb`, chrome `#b8c0c6`, phone `#1e252c`, keypad `#3a4038`
- **Night emissive:** chrome only, `#ffd27a` @ 1.15 (`miami-night`)

## Rejected

### metal-trash-can (`metal_trash_can`)
gltf packs clean+rust variants (AABB 1.85×0.91×0.56); collider is one cyl r=0.32 h=1.0

### hydrant-scan (`fire_hydrant`)
gltf packs clean+aged variants (AABB 0.88×0.80×0.32); collider is one cyl r=0.22 h=0.8

### street-light (`street_light`)
collider h=6.4 does not match Kenney AABB 0.05×0.675×0.225

### street-light-square (`street_light_square`)
collider h=6.2 does not match Kenney AABB 0.05×0.600×0.238

### street-light-double (`street_light_double`)
collider h=7 does not match Kenney AABB 0.05×0.675×0.400

### modular-seating (`modular_street_seating`)
exploded kit AABB 4.34×0.95×0.77 does not match box 1.8×0.9×0.7

### planter-kenney (`planter`)
collider cyl r=0.55 h=0.9 does not match Kenney AABB 0.40×0.177×0.30

### planter-box (`planter_box_01`)
collider 1.2×0.7×0.6 oversizes scan AABB 0.91×0.425×0.414
