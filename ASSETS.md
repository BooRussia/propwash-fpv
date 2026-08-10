# PropWash FPV — Free Asset Master Catalog

Researched by category with **verified URLs and licenses** (CC0 preferred, CC-BY noted).
Target: photorealistic browser rendering in three.js. Models: glTF/GLB preferred.
Textures: seamless PBR at 1K-2K in-app (downscaled from source).

## Terrain & Ground PBR Textures

- **[Aerial Beach 01 (dry beach sand, wind ripples)](https://polyhaven.com/a/aerial_beach_01)** — Poly Haven · **CC0** · texture
  - Format: PBR set (diffuse, normal GL/DX, rough, AO, displacement) — per-map JPG/PNG/EXR, 1K-8K
  - Quality: Photogrammetry, up to 8K, covers real 30x30m — wavy wind-sculpted ripples, photoreal
  - Use: Beach map: dry upper-beach base layer; large 30m physical scale means low visible tiling from altitude
- **[Coast Sand 01 (wet/damp beach sand with pebbles)](https://polyhaven.com/a/coast_sand_01)** — Poly Haven · **CC0** · texture
  - Format: PBR set, per-map JPG/PNG/EXR, 1K-8K
  - Quality: Photogrammetry, up to 8K, 15x15m coverage — damp sand with moisture sheen, gravel and pebbles
  - Use: Beach map: wet shoreline strip near waterline; blend into aerial_beach_01 via splat map, lower roughness for wet look
- **[Ground097 (dry wavy sand ripples)](https://ambientcg.com/view?id=Ground097)** — ambientCG · **CC0 1.0** · texture
  - Format: ZIP of JPG or PNG PBR maps (Color, NormalGL/DX, Rough, AO, Disp), 1K-8K (1K zip ~5MB)
  - Quality: Procedural-photoreal, up to 8K — dry eroded wavy sand, ideal dune-ripple pattern
  - Use: Desert map: rippled dune-field base layer; tile small (1-2m) so FPV camera sees crisp ripples
- **[Grass001 (lush lawn)](https://ambientcg.com/view?id=Grass001)** — ambientCG · **CC0 1.0** · texture
  - Format: ZIP of JPG/PNG PBR maps, 1K-8K (1K zip ~10MB)
  - Quality: Dense fresh short garden lawn, photoreal at 2K, seamless
  - Use: Park/backyard map: manicured lawn base; also Grass004/005 on same site for variation
- **[Sparse Grass (wild grass tufts over soil)](https://polyhaven.com/a/sparse_grass)** — Poly Haven · **CC0** · texture
  - Format: PBR set, per-map JPG/PNG/EXR, 1K-8K
  - Quality: Up to 8K, 2x2m coverage — thin green tufts, visible roots, damp soil, strong height detail
  - Use: Wild-field / bando map: unkempt grass layer and transition zone between lawn and dirt
- **[Asphalt031 (clean light-grey asphalt)](https://ambientcg.com/view?id=Asphalt031)** — ambientCG · **CC0 1.0** · texture
  - Format: ZIP of JPG/PNG PBR maps, 1K-8K (1K zip ~9MB)
  - Quality: Photoreal granular street asphalt, seamless, up to 8K
  - Use: City/track map: fresh road and race-track surface base
- **[Road013A (cracked worn asphalt)](https://ambientcg.com/view?id=Road013A)** — ambientCG · **CC0 1.0** · texture
  - Format: ZIP of JPG/PNG PBR maps, 1K-8K (1K zip ~8MB)
  - Quality: Photogrammetry, heavily cracked dark worn asphalt, up to 8K
  - Use: Abandoned lot / bando map roads; blend patches over Asphalt031 for wear variation (Road012B, Road008B are sibling variants)
- **[RoadLines019-022 decal series (painted road markings)](https://ambientcg.com/view?id=RoadLines019A)** — ambientCG · **CC0 1.0** · texture
  - Format: Decal ZIPs with Color + Opacity + Normal + Rough + AO, 1K-8K; 13+ variants (019A-C, 020A-C, 021A-B, 022A-C)
  - Quality: Photo-based worn painted lines (yellow/white) with alpha mask, up to 8K
  - Use: Overlay decal quads on asphalt for lane lines, crossings, parking marks; opacity map = alphaMap in three.js
- **[PavingStones128 (concrete sidewalk pavers)](https://ambientcg.com/view?id=PavingStones128)** — ambientCG · **CC0 1.0** · texture
  - Format: ZIP of JPG/PNG PBR maps, 1K-8K (1K zip ~8MB)
  - Quality: Photogrammetry varied stone-block paving, seamless, up to 8K
  - Use: City map sidewalks and plaza; ~12 more PavingStones variants on same site (127, 131, 136...) for mixing
- **[Rock Face (cliff wall)](https://polyhaven.com/a/rock_face)** — Poly Haven · **CC0** · texture
  - Format: PBR set, per-map JPG/PNG/EXR, 1K-16K
  - Quality: Photogrammetry up to 16K — weathered reddish-brown cliff stone with cracks and crevices; rock_face_03 is a variant
  - Use: Mountain/canyon map: triplanar-mapped onto steep cliff geometry and large boulders
- **[Snow 02 (clean powder snow)](https://polyhaven.com/a/snow_02)** — Poly Haven · **CC0** · texture
  - Format: PBR set, per-map JPG/PNG/EXR, 1K-8K
  - Quality: Up to 8K, 2x2m coverage — smooth powdery uneven snowfield, subtle sparkle in roughness
  - Use: Winter map: primary snow ground layer (snow_01 through snow_05 siblings give variation)
- **[Snow Field Aerial (patchy snow over mud)](https://polyhaven.com/a/snow_field_aerial)** — Poly Haven · **CC0** · texture
  - Format: PBR set, per-map JPG/PNG/EXR, 1K-8K
  - Quality: 8K aerial capture, very large physical coverage — patchy white snow over dark muddy soil
  - Use: Winter map: distant terrain and thaw-zone blending so the snowfield isn't uniformly white
- **[Forest Leaves 03 (leaf-litter forest floor)](https://polyhaven.com/a/forest_leaves_03)** — Poly Haven · **CC0** · texture
  - Format: PBR set, per-map JPG/PNG/EXR, 1K-8K
  - Quality: Photogrammetry up to 8K, ~2.3x2.3m — dense dry autumn leaf litter, excellent parallax with displacement
  - Use: Forest map: floor under tree canopy; siblings forest_leaves_02/04 and forest_floor for variety
- **[Ground037 (mossy overgrown forest ground)](https://ambientcg.com/view?id=Ground037)** — ambientCG · **CC0 1.0** · texture
  - Format: ZIP of JPG/PNG PBR maps, 1K-8K (1K zip ~10MB)
  - Quality: Photogrammetry — damp moss and grass over earth, reprocessed for clean tiling
  - Use: Forest map: mossy clearings and green-shade blend layer between grass and leaf litter
- **[Gravel Road (compacted dirt + gravel path)](https://polyhaven.com/a/gravel_road)** — Poly Haven · **CC0** · texture
  - Format: PBR set, per-map JPG/PNG/EXR, 1K-16K
  - Quality: Up to 16K, 2x2m — worn compacted dirt with scattered stones, gritty photoreal
  - Use: All rural maps: paths, driveways, track shoulders; ambientCG Gravel022 (grey pebbles) as coarser variant
- **[Brown Mud Leaves 01 (wet mud)](https://polyhaven.com/a/brown_mud_leaves_01)** — Poly Haven · **CC0** · texture
  - Format: PBR set, per-map JPG/PNG/EXR, 1K-8K
  - Quality: Up to 8K, 1.3x1.3m — damp brown mud, scattered leaves, moss, fine organic detail
  - Use: Puddle zones, field edges, under-bridge bando floors; brown_mud_02 and mud_cracked_dry_03 (same site, same license) for wet/dry variants
- **[Ground079S + Asphalt023S (small-area scans for FPV macro detail normals)](https://ambientcg.com/view?id=Ground079S)** — ambientCG · **CC0 1.0** · texture
  - Format: ZIP of JPG/PNG PBR maps, 1K-8K (1K zip ~9MB each)
  - Quality: Photogrammetry height-field scans of tiny physical areas (Asphalt023S = 125x125cm) — extreme texel density up close
  - Use: Detail-normal layer: tile the 1K normal map 10-20x over any base terrain in a custom shader so ground still shows grain when the drone skims 10cm off the deck

### Not found free: we will author these ourselves
- **Dry golden/tall meadow grass (late-summer yellow field)** — Verified CC0 options are green lawns (ambientCG Grass00x) or sparse green tufts (Poly Haven sparse_grass). No confirmed photoreal dry-yellow meadow set found; can be approximated by hue-shifting Grass001 albedo toward yellow in a build step.
- **Clean vector-style road-marking atlas (alpha-only paint, no baked asphalt)** — ambientCG RoadLines decals are photo-based with worn paint and baked-in asphalt background plus opacity mask — great for grunge, but a crisp fresh-paint marking atlas (arrows, letters, gate markers) should be authored ourselves as an SVG-to-PNG alpha atlas.
- **Wet-to-dry shoreline transition band** — No single texture covers the surf gradient; implement as shader blend between coast_sand_01 (wet) and aerial_beach_01 (dry) driven by distance-to-water mask.
- **Snow with FPV-scale sastrugi / footprints / prop-wash scatter detail** — Poly Haven snow sets are smooth field-scale. Close-up crunchy snow micro-normal not found at CC0; reuse a fine gravel normal at low intensity as the snow detail layer, or sculpt one.
- **Tire-track / skid-mark decals** — No verified CC0 skid/tire decals found in this pass; easy to paint as greyscale alpha decals ourselves.

### Integration notes
Download 2K JPG sets and transcode to KTX2 (Basis UASTC for normals, ETC1S for albedo/rough/AO) with toktx or gltf-transform — a full PBR set drops to ~2-4MB and stays GPU-compressed in WebGL; keep albedo as sRGB (texture.colorSpace = SRGBColorSpace) and everything else linear, and use the NormalGL (Y+) variant both sites provide, not DirectX. Blend 3-4 layers per map (e.g. grass/dirt/gravel/rock) with a single RGBA splat map in one custom ShaderMaterial rather than separate meshes, and reuse the same layers across maps — total terrain texture budget can stay under 40MB. Because FPV flies centimeters off the ground, add a second UV frequency: tile a 1K detail normal (the ambientCG "S" small-area scans) 10-20x on top of the base layers and fade it out beyond ~15m camera distance; also set anisotropy = 8-16 on all ground textures since the camera grazes surfaces at extreme angles. Match texture.repeat to real physical scan sizes (Poly Haven states meters per tile, e.g. aerial_beach_01 = 30m, sparse_grass = 2m) so grain reads at true scale, and apply RoadLines decals as polygonOffset quads 1-2cm above the asphalt with their opacity map as alphaMap.

## Buildings & Architecture

- **[Modular Urban Apartments Facade (Poly Haven)](https://polyhaven.com/a/modular_urban_apartments_facade)** — Poly Haven · **CC0** · model
  - Format: GLB/FBX/Blend + 8K PBR textures (downscalable)
  - Quality: Photoreal modular kit, 118,215 tris total across modules (doors, windows, trim, corner pieces); 8K maps
  - Use: Primary kit for assembling realistic apartment blocks in the city map; snap modules onto box massing
- **[Modular Factory Facade (Poly Haven)](https://polyhaven.com/a/modular_factory_facade)** — Poly Haven · **CC0** · model
  - Format: GLB/FBX/Blend + 8K PBR textures
  - Quality: Photoreal brick industrial facade tiles: varied windows, doors, loading bays; 175,014 tris across modules
  - Use: Warehouse/factory exteriors for the industrial district and bando freestyle spots
- **[Poly Haven industrial interior prop set (shelves, shutters, ducts, pipes, barrels, lights)](https://polyhaven.com/models/industrial)** — Poly Haven · **CC0** · model
  - Format: GLB/FBX/Blend, 1K-4K PBR
  - Quality: Photoreal scans/models; game-friendly counts: steel_frame_shelves_01/02 ~4.3k, rollershutter_door 1.1k, modular_industrial_pipes 12.3k, air ducts 45k, barrels ~1.5-2.7k, caged_hanging_light 22.9k
  - Use: Dress warehouse interiors: racking rows, roller doors, ceiling ducts and hanging lights for indoor FPV lines
- **[[FREE] Atlanta, Corporate Office Building](https://sketchfab.com/3d-models/free-atlanta-corperate-office-building-d96380fb001345cca9a9be121f3e43d5)** — Sketchfab (99.Miles) · **CC-BY 4.0 (credit 99.Miles)** · model
  - Format: glTF (Sketchfab auto-convert) + original
  - Quality: 37,290 faces, 26 textures @2048, baked parallax window interiors + emissive maps — best free realistic glass office tower found
  - Use: Hero downtown skyscraper; emissive maps give free night-mode lit windows
- **[Downtown Buildings Set - Low Poly](https://sketchfab.com/3d-models/downtown-buildings-set-low-poly-model-7378e7fb9c914c39880d9913a6f4e1d6)** — Sketchfab (Daniel Zhabotinsky) · **CC-BY 4.0 (credit Daniel Zhabotinsky)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 45,584 faces for a whole set of US-style towers based on real NY/Chicago prototypes, 60 textures @2048; stylized-realistic
  - Use: Mid-ground city block variety around the hero towers; ~5-10k tris per building
- **[New York City. Manhattan (city massing)](https://sketchfab.com/3d-models/new-york-city-manhattan-372bc495b3a941308f4a3198bc45e17b)** — Sketchfab (truekit) · **CC-BY 4.0 (credit truekit)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 336,600 faces for all of Manhattan on a single 4K atlas (one draw call per chunk); low detail per building but reads well at distance
  - Use: Distant skyline backdrop beyond the playable city area; cull/crop to the visible wedge
- **[Low Poly Night City Building Skyline](https://sketchfab.com/3d-models/low-poly-night-city-building-skyline-b0035b8713b048bb8ddf311ee67c28c8)** — Sketchfab (99.Miles) · **CC-BY 4.0 (credit 99.Miles)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 6,078 faces, 5 emissive textures @2048 — lit-window night skyline, cheap
  - Use: Instanced ring of glowing background towers for the night city map
- **[Miami style condominium](https://sketchfab.com/3d-models/miami-style-condominium-b3e16399830045a7b67ec8e02447fd27)** — Sketchfab (aitortilla01) · **CC-BY 4.0 (credit aitortilla01)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 7,682 faces, 3 textures; Cities: Skylines-grade pastel high-rise — mid realism, fine at drone flyby distance
  - Use: Beachfront/Miami-flavored blocks; tint-swap the albedo for pastel variety
- **[Chrysler Building](https://sketchfab.com/3d-models/chrysler-building-6345ce92f01b4e569d6d438f5038414f)** — Sketchfab (mohamedhussien) · **CC-BY 4.0 (credit mohamedhussien)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 246,187 faces — detailed art-deco landmark; needs decimation to ~50k for hero use (confidence medium: license verified via API, mesh quality judged from listing only)
  - Use: Iconic art-deco hero tower anchoring the downtown map
- **[Realistic Storefront by Jungle Jim](https://sketchfab.com/3d-models/realistic-storefront-by-jungle-jim-a6a237f6b4ef4b6b95b0403d4ffc6978)** — Sketchfab (Jungle Jim) · **CC-BY 4.0 (credit Jungle Jim)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 138,165 faces, 19 textures/30 materials — realistic clothing-shop street facade; decimate + merge materials before shipping
  - Use: Street-level storefront detail where the drone flies low through downtown
- **[Wooden Storage Hangar (barn)](https://sketchfab.com/3d-models/wooden-storage-hangar-e03a76f5f010465ca570c3e3dc2fb1d1)** — Sketchfab (Everex) · **CC-BY 4.0 (credit Everex)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 6,677 faces, PBR-optimized, weathered wood + corrugated roof — realistic and already game-ready
  - Use: Countryside map barn; big open doors make a natural FPV gap/gate
- **[Game Ready City Buildings](https://sketchfab.com/3d-models/game-ready-city-buildings-12ac98aa701548adbfa463157f05f6cf)** — Sketchfab (ModelMaker) · **CC-BY 4.0 (credit ModelMaker/mireubay1)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 9,726 faces, 3 textures, modular parts; NFS-inspired mid realism
  - Use: Cheap instanced filler blocks for outer city streets
- **[ambientCG Facade texture series (Facade001-016, incl. night)](https://ambientcg.com/view?id=Facade016)** — ambientCG · **CC0** · texture
  - Format: JPG/PNG PBR sets, 1K-8K (color/normal/roughness, emission on night variants)
  - Quality: Tileable procedural skyscraper curtain-wall facades; Facade016 verified: night windows w/ emission, 1K-8K; Facade011/015 daytime variants (browse https://ambientcg.com/list?q=facade)
  - Use: Texture procedural box-towers: day facade + swap to emissive night variant for the night map
- **[TextureCan facade/city CC0 textures (day+night emissive)](https://www.texturecan.com/tag/Facade/)** — TextureCan · **CC0** · texture
  - Format: JPG/PNG PBR maps (color/normal/rough, emissive on night sets)
  - Quality: ~7 office/warehouse/brick facade sets incl. 'Retro Office Building Facade Night Mode' with day+night emissive presets — exactly the lit/unlit window atlas need
  - Use: Window atlases for procedural mid-rise buildings; night-mode lit windows
- **[Poly Haven brick / plaster / concrete texture library](https://polyhaven.com/textures/brick)** — Poly Haven · **CC0** · texture
  - Format: PNG/EXR full PBR sets (diffuse/normal/rough/AO/displacement), 1K-8K, tileable
  - Quality: Photo-scanned, seam-checked, consistently the best free PBR surfaces; use 1K-2K exports
  - Use: Wall materials for apartments, storefront sides, warehouse brick, stucco for Miami buildings
- **[Kenney City Kits (Commercial / Suburban / Industrial) - FALLBACK ONLY](https://kenney.nl/assets/city-kit-commercial)** — Kenney · **CC0** · model
  - Format: GLB/FBX/OBJ
  - Quality: Clean modular buildings but flat-shaded stylized low-poly — below our realism bar
  - Use: Stopgap modular suburban houses/commercial blocks until we model realistic ones (see missing list)

### Not found free: we will author these ourselves
- **Realistic suburban/country house models** — Free options are low-poly-stylized (Kenney) or CC-BY-SA (AMINE's house — ShareAlike is risky for shipped assets). Model 2-3 house archetypes ourselves using Poly Haven brick/roof/siding textures.
- **Grain silo (game-ready)** — Only found a 1.66M-face unoptimized CC-BY scan and a CC-BY-SA model. A silo is a lathe primitive + corrugated metal texture — 30 minutes to model ourselves.
- **Art-deco / Miami Beach pastel low-rise district kit** — Only single sealed buildings exist free (one CC-BY condo, landmark scans). No modular pastel-deco facade kit anywhere at an acceptable license; build a small kit from stucco textures + curved parapet profiles.
- **Modular glass curtain-wall skyscraper geometry kit** — No free realistic modular skyscraper kit found (packs are Roblox-grade untextured). Plan: procedural box/setback massing textured with ambientCG/TextureCan facades — better for memory anyway.
- **Industrial pallet racking at warehouse scale** — Poly Haven shelves are small garage units. Tall multi-bay pallet racks need modeling (simple extrusions + Poly Haven metal textures) or kitbash from the shelves.
- **Residential night window atlas (matched day/night pairs)** — ambientCG/TextureCan night emissives are office-style. For apartments at night, author an emissive variant of the day atlas in an image editor (paint random lit windows).

### Integration notes
Build the city procedurally: box/setback tower massing with the ambientCG/TextureCan facade PBR sets (one material per facade style, reused across dozens of buildings) keeps draw calls and the 300MB budget tiny, and swapping the emissive map gives a free night mode; reserve the Sketchfab hero models (Atlanta tower, Chrysler, storefront) for a handful of landmark placements. Run everything through gltf-transform: meshopt/Draco compression, KTX2 (UASTC for normals, ETC1S for albedo), downscale all 4K/8K sources to 1-2K — the Poly Haven facade kits and heavy CC-BY meshes (Chrysler 246k, storefront 138k) should be decimated in Blender to <50k and material-merged first. Use THREE.InstancedMesh for background blocks (Zhabotinsky set, night skyline, filler buildings) and distance-swap to the Manhattan massing mesh or camera-facing imposters beyond ~400m — FPV speeds hide LOD pops well. Keep a CREDITS/attribution file shipped with the app listing every CC-BY author (99.Miles, Daniel Zhabotinsky, truekit, aitortilla01, mohamedhussien, Jungle Jim, Everex, ModelMaker); CC0 sources (Poly Haven, ambientCG, TextureCan, Kenney) need none but deserve a mention.

## Streets & Roadside Infrastructure

- **[Telephone Poles (weathered set)](https://sketchfab.com/3d-models/telephone-poles-a76b68b838424a89b7db8a38f4c3d546)** — Sketchfab (Caboose3d) · **CC-BY 4.0 (credit Caboose3d)** · model
  - Format: glTF/GLB (Sketchfab auto-convert) + original
  - Quality: 5,316 tris for a multi-pole set; weathered realistic wood, crossarms/insulators; wires not confirmed as separate geometry
  - Use: Instanced along residential and highway map roads; pair with procedural catenary wires
- **[McCain 8-Inch Leotek Traffic Signals](https://sketchfab.com/3d-models/mccain-8-inch-leotek-traffic-signals-f337235e23b74adf8dec003e883e84f6)** — Sketchfab (Signalrenders) · **CC-BY 4.0 (credit Signalrenders)** · model
  - Format: glTF/GLB (Sketchfab auto-convert)
  - Quality: 16,416 tris; authentic US manufacturer-accurate signal heads (author has a whole catalog of US signals incl. 1960s vintage California sets, most CC-BY)
  - Use: Hero intersections on the urban map; swap emissive maps to animate red/yellow/green
- **[NYC 80's Traffic Light](https://sketchfab.com/3d-models/nyc-80s-traffic-light-bad8aa4988474919be8f48920dde7e3d)** — Sketchfab (evgenymur) · **CC-BY 4.0 (credit evgenymur)** · model
  - Format: glTF/GLB (Sketchfab auto-convert)
  - Quality: 2,864 tris; realistic classic American signal on span pole, very instancing-friendly
  - Use: Background intersections where the 16k McCain model is too heavy
- **[Various Low-Poly Street Lights (multi-variant set)](https://sketchfab.com/3d-models/various-low-poly-street-lights-1173b0c4d9b0400bbeaafbee0e94ca59)** — Sketchfab (kmb_jr) · **CC-BY 4.0 (credit kmb_jr)** · model
  - Format: glTF/GLB (Sketchfab auto-convert)
  - Quality: 10,987 tris total across several modern streetlight variants; realistic low-poly (not cartoon)
  - Use: Primary instanced roadway lighting on all maps; attach emissive sprite + THREE.SpotLight on nearest N
- **[Victorian Street Lamp](https://sketchfab.com/3d-models/victorian-street-lamp-d4006d2762ab434cb262d46d69433f1f)** — Sketchfab (Blulike1969) · **CC-BY 4.0 (credit Blulike1969)** · model
  - Format: glTF/GLB (Sketchfab auto-convert)
  - Quality: 39,698 tris; ornate realistic classic park lamp — hero-prop budget
  - Use: Park map focal points and old-town street corners (few instances only)
- **[American Road Signs Pack](https://sketchfab.com/3d-models/american-road-signs-pack-1d9e706981d94beb82afd4c63dc986fc)** — Sketchfab (CGMeller) · **CC-BY 4.0 (credit CGMeller)** · model
  - Format: glTF/GLB (Sketchfab auto-convert)
  - Quality: 36,294 tris for the whole pack (cheap per sign); PBR with reflective sheeting layer, built for a UE4 game
  - Use: Stop/speed/warning signage along every road; split pack into individual GLBs and instance
- **[MUTCD road sign SVG diagrams (R1-1 stop sign + full PD MUTCD category)](https://commons.wikimedia.org/wiki/File:MUTCD_R1-1.svg)** — Wikimedia Commons · **Public domain (MUTCD sign designs are US federal public domain; see 'PD MUTCD' category)** · texture
  - Format: SVG (rasterize to PNG at any resolution)
  - Quality: Vector-perfect, spec-accurate US sign faces — unlimited resolution, every MUTCD sign exists as SVG
  - Use: Rasterize to a 2K sign-face atlas and apply to simple extruded quads for any US sign we lack as a mesh
- **[GuardRail and Terminal](https://sketchfab.com/3d-models/guardrail-and-terminal-693dee3dc6a1495f90ab0ba1f8237cb4)** — Sketchfab (xplanepilot) · **CC-BY 4.0 (credit xplanepilot)** · model
  - Format: glTF/GLB (Sketchfab auto-convert)
  - Quality: 2,936 tris; W-beam (Armco) highway guardrail segment with proper end terminal
  - Use: Tiled/instanced along highway map edges and curves
- **[Barrier & Traffic Cone Pack (12 models)](https://sketchfab.com/3d-models/barrier-traffic-cone-pack-23c4dfca76a24bf0b21894847867af2a)** — Sketchfab (sabriayes) · **CC-BY 4.0 (credit Sabri Ayes)** · model
  - Format: glTF/GLB (Sketchfab auto-convert)
  - Quality: 5,138 tris for 12 models, 2K PBR: concrete/crash/iron barriers, fenced barrier, big+standard cones, warning signs
  - Use: Construction zones and as FPV race-course gates/obstacles; Part 2 pack by same author adds more
- **[Standard Bus Stop (California modern)](https://sketchfab.com/3d-models/standard-bus-stop-32cc4c5f6aa147acabdb173e2d2373fa)** — Sketchfab (pukkafilms) · **CC-BY 4.0 (credit pukkafilms)** · model
  - Format: glTF/GLB (Sketchfab auto-convert)
  - Quality: 11,616 tris; realistic modern US shelter based on California designs
  - Use: Urban map sidewalks; glass panels make a fun FPV gap-flying target
- **[Home US Mailbox](https://sketchfab.com/3d-models/home-us-mailbox-132c790ac74c42a0bb1a5fc7e3d43d7e)** — Sketchfab (glowbox3d) · **CC-BY 4.0 (credit Glowbox 3D)** · model
  - Format: glTF/GLB (Sketchfab auto-convert)
  - Quality: 2,074 tris; authentic curbside US mailbox replica with realistic PBR metal
  - Use: Instanced at every driveway on the residential map
- **[Metal Trash Can](https://polyhaven.com/a/metal_trash_can)** — Poly Haven · **CC0** · model
  - Format: glTF/GLB, FBX, Blend; textures to 8K (use 1-2K)
  - Quality: Photoreal weathered/rusted can with removable lid; part of Poly Haven's urban 'hidden alley' collection (browse it for more CC0 alley props)
  - Use: Sidewalks, alleys, park corners; CC0 so safe to bake/atlas freely
- **[Fire Hydrant 3D Scan (retopo)](https://sketchfab.com/3d-models/fire-hydrant-3d-scan-f4251fdf83ad4fa49761d9c7cd083028)** — Sketchfab (grafi / zdenkoroman) · **CC-BY 4.0 (credit grafi)** · model
  - Format: glTF/GLB (Sketchfab auto-convert)
  - Quality: 30,000 tris photogrammetry, real-world paint wear; decimate to ~5k for instancing
  - Use: Street corners on urban/residential maps
- **[Wood Bench Old 3D Scan - Retopo](https://sketchfab.com/3d-models/wood-bench-old-3d-scan-retopo-d3abaaefbe434c0f9fe2c67ab3d5b710)** — Sketchfab (grafi / zdenkoroman) · **CC-BY 4.0 (credit grafi)** · model
  - Format: glTF/GLB (Sketchfab auto-convert)
  - Quality: 4,962 tris retopologized photogrammetry; naturally weathered wood, very realistic
  - Use: Parks, bus stops, sidewalks; same author also has iron bench and other street scans
- **[Dumpster (2K PBR)](https://sketchfab.com/3d-models/dumpster-989ea7f01b924859b3484ee27103e8d9)** — Sketchfab (YJ_) · **CC-BY 4.0 (credit YJ_)** · model
  - Format: glTF/GLB (Sketchfab auto-convert)
  - Quality: 11,193 tris, six 2048px texture maps, realistic grime
  - Use: Alleys and parking lots on the urban map — classic FPV gap target
- **[Chain-link / wire-mesh fence PBR materials (Fence001-008 series)](https://ambientcg.com/view?id=Fence007A)** — ambientCG · **CC0** · texture
  - Format: PNG/JPG PBR zips, 1K-8K: color, normal, roughness, metalness, displacement + opacity map
  - Quality: Photo-based seamless wire-mesh/chain-link with alpha; Fence001/002/003/006 are wire mesh, 007/008 metal grate
  - Use: Alpha-cutout double-sided planes between simple posts = whole chain-link fences for ~200 tris
- **[Manhole Cover 002 (+ series 001-005)](https://ambientcg.com/view?id=ManholeCover002)** — ambientCG · **CC0** · texture
  - Format: PNG/JPG PBR zips, 1K-8K, incl. AO
  - Quality: Photo-based metal manhole cover, crisp at 2K
  - Use: Circular decal meshes on road surfaces; normal map sells the relief under FPV camera
- **[Road surfaces + Road Markings decal collection](https://www.cgbookcase.com/textures?search=road)** — cgbookcase · **CC0 1.0** · texture
  - Format: PNG PBR sets, 1K-8K
  - Quality: Two/three/four-lane and highway asphalt with painted lines (clean/cracked/wet variants) plus marking decals: stop, yield line, arrows, bike/bus/wheelchair
  - Use: Tileable base road strips for all maps; marking decals layered with polygonOffset for intersections

### Not found free: we will author these ourselves
- **Crosswalk / zebra-crossing decal texture** — No dedicated CC0 crosswalk texture found on ambientCG or cgbookcase (their marking sets cover stop/yield/arrows only). Trivial to author: white stripe alpha decal with roughness variation and worn edges.
- **Sagging telephone/power wire meshes** — Poles are covered but no free asset ships good separate wire geometry. Generate procedurally: catenary (or parabola) curve between pole attachment points -> THREE.TubeGeometry or fat Line2, one shared dark material.
- **Photoreal wooden picket/ranch fence kit** — Best free find is a hand-painted CC-BY modular fence (apariciosilva3D on Sketchfab, 14.5k tris) — below our realism bar. Build simple plank geometry with CC0 wood-plank textures from cgbookcase/ambientCG instead.
- **Curb / gutter modular pieces** — No dedicated free curb-and-gutter set found. Extrude a 2D curb profile along road spline edges and texture with CC0 concrete; add drain-inlet decal from ambientCG metal textures.
- **USPS blue collection box** — Only found inside mixed 'city props' collections with unverified per-item licensing. Simple box+rounded-top shape; model ourselves with a decal for the eagle logo omitted (trademark).
- **Hero-quality modern cobra-head streetlight** — kmb_jr's CC-BY set is good mid-distance but not a close-flyby hero scan; no CC0 photoscan found. Model one hero cobra-head ourselves if close inspection matters.

### Integration notes
Nearly everything here is scatter geometry, so load each prop once and place via THREE.InstancedMesh (poles, signs, cones, hydrants, mailboxes, guardrail segments easily reach hundreds of instances at one draw call each); run all GLBs through gltfpack with meshopt + KTX2/BASIS and downscale textures to 1K (2K only for road surfaces and hero props) to keep the whole category under ~25MB. Generate wires procedurally with a catenary sag function between pole anchors (TubeGeometry, 6-8 radial segments, shared material) — this also lets wires react per-map without shipping meshes. Rasterize Wikimedia MUTCD SVGs into one 2K sign-face atlas so every US sign shares a single texture/material, and reuse ambientCG/cgbookcase PBR sets across props (same asphalt/concrete/metal maps) to maximize GPU texture reuse. Note: all Sketchfab entries were license-verified through the official api.sketchfab.com v3 API (license slug 'by', downloadable true) because Sketchfab's HTML pages are client-rendered and unscrapeable; CC-BY requires a visible credits page in the app listing each author + model link, while the CC0 entries (Poly Haven, ambientCG, cgbookcase, public-domain MUTCD) need no attribution.

## Vehicles

- **[Generic Passenger Car Pack (10 body styles x 6 colors)](https://sketchfab.com/3d-models/generic-passenger-car-pack-20f9af9b8a404d5cb022ac6fe87f21f5)** — Sketchfab (Comrade1280) · **CC-BY 4.0 (attribution: Comrade1280)** · model
  - Format: Sketchfab auto-converted glTF/GLB + source FBX/OBJ/DAE
  - Quality: Stylized-realistic; 6.0k-8.0k tris per car (69.3k total), PBR metallic/gloss textures with 6 color variants each; sedan, wagon, hatchback, compact, coupe, minivan, sport, pickup, SUV, offroad
  - Use: Backbone of all street/parking-lot traffic on every city map — instanced parked and moving cars with per-instance color variety
- **[Generic Civil Service Vehicles Pack (taxi, police, bus, trucks)](https://sketchfab.com/3d-models/generic-civil-service-vehicles-pack-8ff2a13f30914932a70c7950cfa58465)** — Sketchfab (Comrade1280) · **CC-BY 4.0 (attribution: Comrade1280)** · model
  - Format: Sketchfab auto-converted glTF/GLB + source FBX/OBJ/DAE/3ds
  - Quality: Stylized-realistic, deliberately un-branded to avoid trademark issues; ~9k tris each (92.7k total), PBR metallic/roughness with editable decals; taxi, police sedan, city bus, school bus, ambulance, fire truck, garbage truck, postal van, service truck, tow truck
  - Use: Taxi/police/bus/delivery coverage for downtown and suburb maps; postal van doubles as delivery truck
- **[Generic Town Bus](https://sketchfab.com/3d-models/generic-town-bus-14fe03d792914d51b6c6250b393c44fd)** — Sketchfab (own.guest) · **CC-BY 4.0 (attribution: own.guest)** · model
  - Format: Sketchfab auto-converted glTF/GLB + source OBJ
  - Quality: Mid-detail generic city bus, 55.5k tris — more detailed than the pack bus; moderate realism
  - Use: Hero bus parked at bus stops / bus-gate race elements where the camera flies close; use pack bus for distant traffic
- **[Free Delivery Truck (step van)](https://sketchfab.com/models/50cdb3c674c84224b6ebfe471ca404fe)** — Sketchfab (Miguel Vega / vmek3d) · **CC-BY 4.0 (attribution: Miguel Vega)** · model
  - Format: Sketchfab auto-converted glTF/GLB + source (Blender)
  - Quality: Clean low-poly step van, 14.2k tris, 1 texture + 11 materials; inspired by Chevrolet Step Van C30 1991 (shape only, no logos — low trademark risk, keep it unbranded)
  - Use: Delivery truck parked in alleys/loading docks; repaint the flat panels with our own fictional courier livery
- **[Yacht (Omega-type sailing yacht)](https://sketchfab.com/3d-models/yacht-ae42c1609c25412cbfe40baf9728d987)** — Sketchfab (MesXwi) · **CC-BY 4.0 (attribution: MesXwi)** · model
  - Format: Sketchfab auto-converted glTF/GLB
  - Quality: Realistic PBR sailing yacht with accurate class proportions; 117.7k faces — needs decimation to ~40k for hero use
  - Use: Hero sailboat docked in the Miami marina; decimate + LOD, one or two instances only
- **[Yacht (low-poly motor yacht)](https://sketchfab.com/models/0dd451f295d049cea20c17d3ffa87ee3)** — Sketchfab (Sergei / sergeif) · **CC-BY 4.0 (attribution: Sergei)** · model
  - Format: Sketchfab auto-converted glTF/GLB
  - Quality: Game-ready motor yacht, 8.5k tris, 5-texture metalness PBR; stylized-realistic (studio practice asset)
  - Use: Instanced background motor yachts filling marina berths — cheap enough for 10+ copies with hue-shifted hulls
- **[ZEFIRO day cruiser](https://sketchfab.com/models/5c29921a556346f09684eadfbc51a91d)** — Sketchfab (angelo raffaele catalano) · **CC-BY 4.0 (attribution: Angelo Raffaele Catalano)** · model
  - Format: Sketchfab auto-converted glTF/GLB
  - Quality: Modern motor yacht/day cruiser shape, 84.6k faces, 13 materials but NO textures — needs our own quick Substance/vertex-color pass; good hull geometry
  - Use: Second hero powerboat at the marina fuel dock after we texture it (white gelcoat + teak deck materials in three.js works fine)
- **[Docked Venetian boat (photogrammetry, tarp-covered)](https://sketchfab.com/models/53af885edaf044ac8d375b29305fe9ac)** — Sketchfab (Blue Scans) · **CC-BY 4.0 (attribution: Blue Scans)** · model
  - Format: Sketchfab auto-converted glTF/GLB
  - Quality: Photorealistic photogrammetry scan, game-ready retopo at 18.7k faces; 2x8K albedo + 2x8K normal + 2K AO (downscale to 2K, huge savings)
  - Use: High-realism dockside filler boat on trailer/stands in the marina boatyard — sells the photoreal look up close
- **[Fishing Boat (wooden)](https://sketchfab.com/models/f4b38ccf5ffb46018aa7931c0e106654)** — Sketchfab (Pabooklas) · **CC-BY 4.0 (attribution: Pabooklas)** · model
  - Format: Sketchfab auto-converted glTF/GLB
  - Quality: Moderate realism wooden fishing boat, 7.2k faces, single 4K material (downscale to 2K)
  - Use: Working-boat variety among the yachts; also good beached/anchored off the marina breakwater
- **[Kawasaki 310X Ultra Jet Ski](https://sketchfab.com/3d-models/kawasaki-310xultra-jet-ski-37a2348f02da472d98310fd5621307c6)** — Sketchfab (XOIAL) · **CC-BY 4.0 (attribution: XOIAL)** · model
  - Format: Sketchfab auto-converted glTF/GLB
  - Quality: Game-ready hi-to-low-poly bake, 8.2k faces, 6-texture metalness PBR; realistic
  - Use: Jetskis at the marina dock and beached on sand; TRADEMARK NOTE: modeled on Kawasaki 310X — paint out the Kawasaki logos in the albedo before shipping
- **[Airbus H135 / Eurocopter EC135 helicopter](https://sketchfab.com/models/ec30f802c6ac43a8843948fbadb674d2)** — Sketchfab (GRIP420) · **CC-BY 4.0 (attribution: GRIP420)** · model
  - Format: Sketchfab auto-converted glTF/GLB
  - Quality: Highly detailed civilian rescue helicopter, 105.9k faces, 36 textures at 2K — needs decimation to ~40k and texture atlasing for use
  - Use: Parked helicopter on rooftop helipad / hospital pad; NOTE: real Airbus airframe and rescue livery — retexture to a fictional livery and budget-decimate, or treat as stretch goal
- **[Classic Bicycle (game ready, baked)](https://sketchfab.com/models/da6507928c0c4a5c8776008cdb9f747e)** — Sketchfab (by__Rx) · **CC-BY 4.0 (attribution: by__Rx)** · model
  - Format: Sketchfab auto-converted glTF/GLB
  - Quality: High-poly-baked classic city bike, 19.8k tris, 4 PBR metalness textures; stylized-realistic
  - Use: Parked bikes at racks, leaned on fences, suburb porches — instance 5-10 with recolored frames
- **[Electric Scooter (kick-style, game ready)](https://sketchfab.com/models/e22bffc784b04a93acc83599fa7a81c0)** — Sketchfab (Delandi) · **CC-BY 4.0 (attribution: Delandi)** · model
  - Format: Sketchfab auto-converted glTF/GLB
  - Quality: Game-ready rental-style e-scooter, 16.5k faces, 4K PBR (downscale to 1K); Substance-textured, realistic
  - Use: Miami sidewalk rental scooters scattered near the beach/marina — instant modern-city set dressing, instanced
- **[Derbi DS-50 moped (photogrammetry)](https://sketchfab.com/models/5e3ba0954ffc4a8f853c86cb7fdaa91b)** — Sketchfab (Scanamatics) · **CC-BY 4.0 (attribution: Scanamatics)** · model
  - Format: Sketchfab auto-converted glTF/GLB
  - Quality: Photogrammetry scan of a real vintage moped, 11k faces — photoreal worn textures
  - Use: Parked seated scooter/moped street prop; NOTE: Derbi is a (defunct) brand — badge is small, blur it in the albedo if cautious

### Not found free: we will author these ourselves
- **Generic unbranded motorcycle (street/sport)** — Every quality free motorcycle is branded (Honda, Harley, JAWA) and the best one (Honda NR750 by Comrade1280, CC-BY, 52k tris) states it was 'created for the motorbike simulator Ride' — a commercial game — so provenance is questionable on top of the trademark. Recommend we model a simple generic naked bike ourselves (~15k tris) or skip motorcycles and rely on the moped + e-scooter.
- **Modern textured motor yacht, 30-100k tris** — Textured free motor yachts are all 200k-1M+ faces (agt14032013, gogiart); the right-sized ZEFIRO (85k) ships with no textures. Plan: decimate a heavy one or texture ZEFIRO ourselves with simple gelcoat/teak PBR materials.
- **CC0 modern car pack** — No CC0 modern cars exist at acceptable quality anywhere we checked (Poly Haven's vehicle category is literally empty; Sketchfab CC0 cars are museum pieces; the itch.io 'Car Kit GLB CC0' is just Kenney's flat-shaded kit). Everything usable is CC-BY — the game MUST ship an attribution/credits screen.
- **Fully generic parked helicopter** — All decent free helicopters are real airframes (Airbus EC135, Sikorsky S-92) or military. The EC135 listed works if we retexture + decimate; if trademark-averse, model a simple generic light helicopter (~20k tris) ourselves.
- **Modern marina sailboat with furled sails, <40k tris** — The Omega yacht is vintage-styled and 117k faces. A modern Beneteau-style cruiser with furled main and roller jib doesn't exist free at game polycounts — quick Blender model (~25k tris) if the marina needs it.

### Integration notes
Pipeline every Sketchfab download through gltf-transform: `gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress ktx2` and resize textures to 1-2K (the venetian boat's 8K maps alone drop from ~90MB to ~4MB) — expect the whole vehicle set to land under 25MB. Use THREE.InstancedMesh for all traffic and parked fleets: the Comrade1280 packs share one texture sheet per car with 6 pre-made color variants, so you get huge variety from a handful of draw calls; add per-instance hue-shift via instanceColor for boats and bikes. Decimate the three heavies (Omega yacht, ZEFIRO, EC135) in Blender to <40k with a baked normal pass and give hero vehicles 2-3 LODs (THREE.LOD) since FPV flight closes distance fast. Everything here is CC-BY 4.0 — ship a credits screen (author name + model URL + 'CC-BY 4.0') and strip real-world logos (Kawasaki, Derbi badge, EC135 livery) from albedo maps before deploying, since GitHub Pages serves the raw GLBs publicly.

## Vegetation

- **[Poly Haven - Nature/Trees model collection (fir, pine, island trees, jacaranda, quiver trees, dead trunks, stumps)](https://polyhaven.com/models/nature/trees)** — Poly Haven · **CC0** · model
  - Format: glTF/GLB, FBX, .blend, USD (per-asset download, 1K-8K textures)
  - Quality: Photoscanned photoreal; raw polycounts high (dead_quiver_trunk 33k, quiver_tree_02 154k, fir_tree_01 7.8M, pine_tree_01 17M) - decimate before shipping. Verified via api.polyhaven.com asset list.
  - Use: Hero pines/firs for alpine map, quiver trees for desert map, dead trunks + tree stumps (33k-62k tris, near game-ready) as crash obstacles and clutter everywhere
- **[Poly Haven - Plants & ground cover (fern_02, grass_medium_02, moss, dandelion, celandine, Namaqualand wildflowers, searsia shrubs, tropical shrubs)](https://polyhaven.com/models/plants)** — Poly Haven · **CC0** · model
  - Format: glTF/GLB, FBX, .blend, USD
  - Quality: Photoreal (mostly by Rico Cilliers); grass_medium_02 = 1.04M polys with 4K textures at ~7000 texel density - bake down or extract single tufts. fern_02 = 4 fern clump variants. Verified via Poly Haven API.
  - Use: Grass clumps, ferns for forest understory, flowers (dandelion/gazania/ursinia) for meadow map, desert succulents + wild rooibos bush for desert map, shrubs as bushes
- **[PlantCatalog free models collection (e-on software) - 500+ botanically accurate species](https://sketchfab.com/PlantCatalog/collections/plantcatalog-free-models-51dc1d2c505f47b49576f31905a721eb)** — Sketchfab · **CC-BY 4.0 (per-model, verified on multiple models via Sketchfab API)** · model
  - Format: glTF (Sketchfab auto-convert) + source; download requires free Sketchfab account
  - Quality: SpeedTree-class procedural realism from e-on's PlantFactory; meshes exported at ~40% max resolution; includes date/royal/fan palms, oaks, spruces, ferns, saguaro, fig, orange - many variants per species
  - Use: Primary tree/plant library for every biome; pick 2-3 maturity variants per species for natural-looking forests
- **[Realistic HD Royal palm (23/25) - PlantCatalog](https://sketchfab.com/3d-models/realistic-hd-royal-palm-2325-500efa843c3d405ab9cf8e2ad09d7104)** — Sketchfab · **CC-BY 4.0 (verified via Sketchfab API)** · model
  - Format: glTF (auto-converted) + source
  - Quality: 274k faces / 200k verts - photoreal botanically accurate royal palm; decimate to ~40-60k for hero use
  - Use: Hero royal palms lining the beach map's boulevard/gate course; sister models: Realistic HD Mexican fan palm (00bd2ea...) and Date palm series (78 variants)
- **[Realistic HD Northern red oak (37/138) - PlantCatalog](https://sketchfab.com/3d-models/realistic-hd-northern-red-oak-37138-b7ed18f291c3445a8b805da379e3de4f)** — Sketchfab · **CC-BY 4.0 (verified via Sketchfab API)** · model
  - Format: glTF (auto-converted) + source
  - Quality: 202k faces / 172k verts, 10.5 m tall, 20,685 individual leaves - photoreal deciduous oak; decimate for game LOD0
  - Use: Hero deciduous tree for the meadow/park map; PlantCatalog also has Norway spruce (facebfa...) and Black spruce for the alpine map
- **[Realistic HD Saguaro cactus (28/30) - PlantCatalog](https://sketchfab.com/3d-models/realistic-hd-saguaro-cactus-2830-386db8a965c443c390b91e2cc2528c7c)** — Sketchfab · **CC-BY 4.0 (verified via Sketchfab API)** · model
  - Format: glTF (auto-converted) + source
  - Quality: 47.6k faces / 44.6k verts - photoreal multi-arm saguaro, already near hero-prop budget
  - Use: Signature desert-map obstacle; 30 variants in the series so slalom courses can use several distinct silhouettes
- **[Coconut Palm by evolveduk (Tree It developer)](https://sketchfab.com/3d-models/coconut-palm-26e787f2ff2e4c0fb004c3b0210805a3)** — Sketchfab · **CC-BY 4.0 (verified via Sketchfab API)** · model
  - Format: glTF (auto-converted) + source
  - Quality: 7,432 faces / 4,058 verts - game-ready mid-poly coconut palm with card fronds, good stylized-realistic
  - Use: Instanced coconut palm groves on the beach map - light enough to scatter dozens without LODs
- **[Realistic Palm Tree 2 Free by NextSpring](https://sketchfab.com/3d-models/realistic-palm-tree-2-free-d05c8ffb6ec64a7184c4b673e21f7224)** — Sketchfab · **CC-BY 4.0 (verified via Sketchfab API)** · model
  - Format: glTF (auto-converted) + source
  - Quality: 60.7k faces / 25.6k verts - realistic textured palm, hero-prop tier
  - Use: Close-range hero palm near the beach map spawn/launch pad where the FPV camera passes within meters
- **[Opuntia (Prickly Pear) Cactus photogrammetry by cook4986](https://sketchfab.com/3d-models/opuntia-prickly-pear-cactus-bbc37de8363e45b5a33175942ffe7368)** — Sketchfab · **CC-BY 4.0 (verified via Sketchfab API)** · model
  - Format: glTF (auto-converted) + source
  - Quality: 765k faces raw photogrammetry (Sam Noble Museum specimen) - photoreal but must be decimated to ~10-20k with baked normal map
  - Use: Desert map mid-ground prickly pear clusters after decimation + normal bake
- **[Fishhook barrel cactus photogrammetry by GSXNet](https://sketchfab.com/3d-models/fishhook-barrel-cactus-f0f63dfa7be8409ca456946d2ad3a62a)** — Sketchfab · **CC-BY 4.0 (verified via Sketchfab API)** · model
  - Format: glTF (auto-converted) + source
  - Quality: 225k faces / 113k verts raw scan - photoreal; decimate to ~3-8k with normal bake for scattered instancing
  - Use: Small scattered desert-floor cacti (instanced) rounding out the saguaro + prickly pear set
- **[Realistic Trees Pack of 2 Free by Nicholas-3D](https://sketchfab.com/3d-models/realistic-trees-pack-of-2-free-08b4a9eac77a40419fd59402cc7b2deb)** — Sketchfab · **CC-BY 4.0 (verified via Sketchfab API)** · model
  - Format: glTF (auto-converted) + source, all textures included
  - Quality: 865k faces for 2 deciduous trees - photoreal but heavy; decimate to 30-50k each
  - Use: Additional deciduous silhouette variety for park/meadow maps alongside the PlantCatalog oak
- **[Billboard Tree Pack by EFX](https://sketchfab.com/3d-models/billboard-tree-pack-5636201ec3a241efbb33a67670a67340)** — Sketchfab · **CC-BY 4.0 (verified via Sketchfab API)** · model
  - Format: glTF - 6 quad billboards (16 faces total) with 1K-2K alpha textures
  - Quality: High-quality rendered tree billboards purpose-built for LOD/background use
  - Use: Distant forest ring and far background treelines on all maps - near-zero triangle cost
- **[cgbookcase Cutout Objects (whole-tree cutouts Trees 01-07, oak/maple/autumn leaf sets)](https://www.cgbookcase.com/textures/?category=Cutouts)** — cgbookcase.com · **CC0 1.0 (stated site-wide)** · texture
  - Format: PNG with alpha, up to 4K
  - Quality: Photo-based whole-tree and leaf cutouts, 31 autumn leaf variants + 12 green leaf variants - ideal billboard/impostor source
  - Use: Build our own cross-quad billboard trees and custom foliage-card atlases; leaf cutouts feed ground-litter decals
- **[ambientCG Grass001 (plus Grass002-005 series and Ground/Moss sets)](https://ambientcg.com/view?id=Grass001)** — ambientCG · **CC0 (verified on page)** · texture
  - Format: Seamless PBR set (color/normal/roughness/AO/height), 1K-8K JPG/PNG zips
  - Quality: Procedural seamless lawn grass, ~1.4m x 1.4m tile, 361k+ downloads - clean tiling for terrain
  - Use: Base tileable terrain grass under all scattered vegetation; blend 2-3 variants via splatmap to kill tiling repetition
- **[Tree It - free tree generator by EVOLVED Software](https://www.evolved-software.com/treeit/treeit)** — evolved-software.com · **Free incl. commercial use; exported trees are your own creations (per Terms)** · tool
  - Format: Windows app; exports FBX (ASCII), OBJ, .x with built-in polygon-reduction LODs and leaf-card rendering
  - Quality: Produces stylized-realistic low/mid-poly trees with LOD chains on demand
  - Use: Generate any missing species (birch, maple, willow, hedge shapes) at exact poly budgets, plus matched LOD sets for forests
- **[64 Billboard Grass Texture and Mesh](https://opengameart.org/content/64-billboard-grass-texture-and-mesh)** — OpenGameArt.org · **CC0 (per search listing - LOWER CONFIDENCE: opengameart.org returned HTTP 403 to automated fetch, verify manually in a browser)** · texture
  - Format: PNG alpha grass card textures + meshes
  - Quality: 64 grass billboard variants for card-based grass rendering
  - Use: Instanced crossed-quad grass cards across meadow and forest floors - verify license on page before shipping

### Not found free: we will author these ourselves
- **Photoreal birch and maple individual trees (verified license)** — PlantCatalog's 500-model free drop likely includes them but I could not verify specific birch/maple pages; most other free birch packs found were stylized/anime. Fallback: generate in Tree It with cgbookcase bark + leaf cutouts.
- **Trimmed hedge / boxwood hedge models** — No quality hedge at an acceptable license found. Easy DIY: box geometry + ambientCG hedge-like foliage PBR texture, or Tree It shrub preset.
- **Grass/foliage card ATLAS with full PBR maps (normal + roughness) at verified license** — OpenGameArt and 3dtexel.com both blocked automated verification (HTTP 403). Best path: render our own 2K atlas in Blender from Poly Haven's CC0 grass_medium_02 and fern_02 - zero license risk and perfectly art-directed.
- **Photoreal scan-quality coconut palm with fruit** — evolveduk's CC-BY model (7.4k tris) is good but mid-poly; PlantCatalog free set has date/royal/fan palms only. Could kitbash coconuts onto the royal palm trunk.
- **Pre-baked octahedral impostor atlases for trees** — Nothing free found. Generate at build time with three.js + @playcanvas/texture-tool style render-to-texture, or use the EFX billboard pack for the far ring.

### Integration notes
Ship every tree through a gltf-transform pipeline (draco or meshopt + KTX2/basis textures) after decimating in Blender - the Poly Haven and PlantCatalog sources are cinematic-density, so target ~40k tris LOD0 hero, ~8k LOD1, then swap to the EFX/DIY billboards at distance via THREE.LOD. Use InstancedMesh per species for forests/groves and a single shared foliage atlas material (alphaTest ~0.4 or alphaHash, side: DoubleSide, no alpha-blend sorting) so hundreds of trees cost a handful of draw calls. Add cheap vertex-shader wind (sway weighted by vertex height/UV2) via onBeforeCompile rather than looking for animated assets. For CC-BY assets (all Sketchfab entries) keep a CREDITS page listing author + model link + 'CC-BY 4.0' - that satisfies attribution for PlantCatalog, evolveduk, NextSpring, cook4986, GSXNet, Nicholas-3D and EFX; Poly Haven, cgbookcase and ambientCG are CC0 and need nothing.

## Natural Landscape Features

- **[Boulder 01 (photoscan)](https://polyhaven.com/a/boulder_01)** — Poly Haven · **CC0** · model
  - Format: glTF, FBX, USD, .blend
  - Quality: Photoreal 8K-scanned boulder, 124k tris (download 1K-2K textures and decimate/LOD for hero use), 1.8m wide, weathered rock with lichen detail
  - Use: Hero boulder near race gates and canyon floors; decimated copies as instanced scatter rocks
- **[Rock Face 02 (cliff chunk)](https://polyhaven.com/a/rock_face_02)** — Poly Haven · **CC0** · model
  - Format: glTF, FBX, USD, .blend
  - Quality: Photoreal weathered sandstone cliff, only 30k tris, 4.9m wide, 1K-8K PBR textures - already game-ready polycount
  - Use: Stack/rotate instances to build canyon walls and cliff lines the drone flies along
- **[Coast Rocks 05 (with LODs)](https://polyhaven.com/a/coast_rocks_05)** — Poly Haven · **CC0** · model
  - Format: glTF, FBX, USD, .blend (LOD versions included)
  - Quality: Photoreal coastal limestone boulder+ledge scan, source ~1M tris but ships with LOD meshes; use LOD1/LOD2 (<50k) with 2K textures
  - Use: Shoreline rock clusters on the beach/coast map; sibling assets coast_rocks_01-08 give variety
- **[Cliff Rock Boulder Field (Pyrenees photogrammetry)](https://sketchfab.com/3d-models/cliff-rock-boulder-field-d1f2ce6f71aa4c19adbdc541cc888194)** — Sketchfab (Pers Scans) · **CC-BY 4.0 (credit 'Pers Scans' in an in-game credits screen)** · model
  - Format: .blend, .obj, .fbx (convert to GLB)
  - Quality: Large photoscanned boulder field/cliff formation, 122.3k tris, 8K albedo/normal/roughness (downscale to 2K)
  - Use: Mountain-slope centerpiece obstacle; one mesh covers a whole talus section to fly through; browse Pers Scans' profile for more free CC-BY rock scans
- **[USGS 3DEP DEMs (The National Map Downloader)](https://apps.nationalmap.gov/downloader/)** — USGS · **Public domain (US Government work; free for commercial/game use)** · tool
  - Format: GeoTIFF DEM at ~30m, ~10m, and 1m resolutions (convert to 16-bit PNG heightmap)
  - Quality: Real-world elevation of the entire US - real mountains/canyons (e.g. Moab, Sierra ridgelines) at up to 1m resolution
  - Use: Source heightmaps for the mountain and canyon maps; displace a subdivided plane or generate a terrain mesh offline
- **[Tangram Heightmapper (heightmap PNG exporter)](https://tangrams.github.io/heightmapper/)** — tangrams.github.io · **Free web tool; underlying global terrain tiles are open (SRTM/3DEP-derived, public-domain sources) - keep a data-source credit line** · tool
  - Format: Grayscale PNG heightmap export from browser
  - Quality: Instant auto-exposed grayscale heightmap of any place on Earth; lower fidelity than raw USGS DEMs but zero GIS work
  - Use: Fast heightmap grabs for prototyping any real-world location before committing to a USGS DEM pipeline
- **[Caustic Textures (32-frame seamless set)](https://opengameart.org/content/caustic-textures)** — OpenGameArt · **CC0** · texture
  - Format: 32 seamless PNGs (caust00-31), ~770KB zip total
  - Quality: Seamless animated caustics sequence, lightweight; classic quality, reads well projected at speed
  - Use: Animated light projection on riverbeds/pool floors and under the water surface on the coast map
- **[Water - Batch of 15 Seamless Textures with normalmaps](https://opengameart.org/content/water-batch-of-15-seamless-textures-with-normalmaps)** — OpenGameArt · **CC-BY 3.0 (credit the author named on the page)** · texture
  - Format: PNG pairs: seamless diffuse (_S) + matching normal map (_N)
  - Quality: 15 varied water types incl. foam, sea waves, lake - mid resolution; normals are the valuable part
  - Use: Scrolling dual-normal-map water shader for lakes/rivers; foam tiles for shoreline edge blending
- **[Water 001 / Water 002 seamless PBR sets](https://3dtextures.me/category/water/)** — 3DTextures.me · **CC0 (site-wide)** · texture
  - Format: PNG: diffuse, normal, displacement, roughness, AO (1024x1024 free tier)
  - Quality: Seamless 1K water surface normals - ideal size for a scrolling water shader, no downscale needed
  - Use: Primary water normal maps: sample two copies at different scales/speeds for convincing ocean/lake surface
- **[Snow 006 (photogrammetry snow)](https://ambientcg.com/view?id=Snow006)** — ambientCG · **CC0** · texture
  - Format: JPG/PNG PBR set (color, normal, roughness, etc.), 1K-8K
  - Quality: Photogrammetry-captured seamless snow, 2.5m coverage, photoreal at 2K
  - Use: Snow-capped peak caps: blend onto terrain above a height threshold; ambientCG Snow001-010 give variants
- **[Snow 02 (with translucency map)](https://polyhaven.com/a/snow_02)** — Poly Haven · **CC0** · texture
  - Format: JPG/PNG/EXR: diffuse, normal, rough, displacement, AO, ARM, translucent; 1K-8K
  - Quality: Powdery drift snow with fine granularity; translucency map enables subtle subsurface look
  - Use: Alternate snow layer for drifts and shaded slopes on the alpine map
- **[Cliff Side (canyon wall texture)](https://polyhaven.com/a/cliff_side)** — Poly Haven · **CC0** · texture
  - Format: JPG/PNG/EXR PBR set incl. ARM combined; 1K-16K
  - Quality: Eroded orange layered sedimentary cliff face - Moab/canyon look, photoreal at 2K
  - Use: Triplanar-mapped onto steep canyon terrain slopes and onto Rock Face meshes for variety
- **[Aerial Rocks 02 (50m macro cliff texture)](https://polyhaven.com/a/aerial_rocks_02)** — Poly Haven · **CC0** · texture
  - Format: JPG/PNG/EXR PBR set incl. displacement; 1K-8K
  - Quality: Aerial-captured weathered cliff rock covering 50m - correct texel scale for terrain seen from a fast drone
  - Use: Base rock layer on mountain terrain (slope-based splat); displacement map doubles as detail heightmap
- **[Aerial Beach 01 (30m sand texture)](https://polyhaven.com/a/aerial_beach_01)** — Poly Haven · **CC0** · texture
  - Format: JPG/PNG/EXR PBR set; 1K-8K
  - Quality: Aerial beach sand with wind ripples, 30m coverage - reads correctly at FPV altitude
  - Use: Base sand layer for the coast map, blended toward Ground054 close-up detail near the waterline
- **[Ground 054 (beach photogrammetry ground)](https://ambientcg.com/view?id=Ground054)** — ambientCG · **CC0** · texture
  - Format: JPG/PNG PBR set, 1K-16K (use 2K)
  - Quality: Photogrammetry beach surface (sand/mud mix), 3.5m coverage, very high detail
  - Use: Close-range detail layer on the beach where the drone flies low; blend with Aerial Beach 01 by distance
- **[Smithsonian 3D Open Access (shells & natural specimens)](https://3d.si.edu/explore)** — Smithsonian 3D Digitization · **CC0 (per-object - only take items marked CC0)** · model
  - Format: GLB/glTF and OBJ downloads
  - Quality: Museum-grade scans of real shells, corals, bones; meshes are dense - decimate to <3k tris for scatter use
  - Use: Beach scatter props (shells, barnacle clusters) after decimation; verify the CC0 badge on each object page

### Not found free: we will author these ourselves
- **Game-ready low-poly seashell/beach-shell scatter pack (CC0, <3k tris each)** — Sketchfab has CC0 shell scans (e.g. the baxterbaxter 'shells' collection) but Sketchfab blocked page fetches so per-model licenses could not be verified; Smithsonian scans are CC0 but need heavy decimation/retopo. Plan to decimate Smithsonian scans or model 3-4 shells ourselves.
- **Driftwood and kelp/seaweed beach meshes (verified license)** — Candidates exist on Sketchfab (driftwood scans listed as CC-BY, 'Scan of Kelp and Seaweed on sand beach' by sterlingcrispin listed as CC0) but pages could not be fetched to confirm licenses. Manually verify these two in a browser before shipping, or sculpt simple driftwood ourselves.
- **Photoreal shoreline/ocean foam texture with clean CC0 license** — Only stylized CC-BY foam (OpenGameArt batch) and unclear-license AI sites found; Poliigon's sea foam is paid. Generate foam procedurally (noise-masked shoreline band) or photograph/author our own tileable foam mask.
- **Multi-kilometer photoscanned canyon/mountain hero mesh** — Sketchfab 'terrain cc0' collections exist but were unverifiable via fetch, and most large terrain scans lack textures or LODs. Better path: build terrain from USGS 3DEP heightmaps + aerial rock/snow textures, and dress with the verified rock meshes.
- **Rock-to-snow transition (snowline) blended texture** — No ready-made CC0 'snowy cliff' blend set found at quality. Implement as a shader: blend Aerial Rocks 02 with Snow006 using world-height + slope + normal-map-based masking.

### Integration notes
Use THREE.InstancedMesh for all scattered rocks/shells (one draw call per species) and build 2-3 LOD levels per rock in Blender, compressing every mesh with meshopt or Draco via gltf-transform; the Poly Haven rocks reuse the same ARM (AO/rough/metal) packed-map convention, so a single shared material setup covers them all. Keep textures at 1K-2K and convert to KTX2/BASIS with gltf-transform to cut GPU memory ~6x; the aerial 30-50m textures are the trick for FPV speed — use them as the far/base terrain layer with the 2-4m photogrammetry sets blended in by camera distance (or a detail-map octave) so the ground holds up both at altitude and in proximity flying. For terrain, convert USGS DEMs to 16-bit PNG heightmaps (8-bit causes visible stair-stepping) and displace a chunked-LOD plane; texture it with slope-based splatting (grass/sand on flat, aerial_rocks on steep, snow above a height threshold with slope cutoff). For water, scroll two copies of the CC0 1K water normal maps at different scales/speeds in a custom shader, add the 32-frame caustics as an animated projected texture in shallows, and fake shoreline foam with a depth-based band — that combination costs almost nothing and reads as high-end at 120mph.

## People & Characters

_Research pending (agent hit session limit); will be filled in on the next pass._

## Sky & Lighting (HDRIs)

- **[Spiaggia di Mondello (beach day HDRI)](https://polyhaven.com/a/spiaggia_di_mondello)** — Poly Haven · **CC0** · hdri
  - Format: EXR/HDR equirect (1K-20K) + 8K tonemapped JPG
  - Quality: Photoreal bright midday Sicilian beach, hard sun, deep blue sky, 25 EVs unclipped, up to 20K
  - Use: Tropical beach map: skybox + IBL for sunny daytime flying
- **[Kloofendal 48d Partly Cloudy (Pure Sky)](https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky)** — Poly Haven · **CC0** · hdri
  - Format: EXR/HDR equirect (4K/8K/16K) + 8K tonemapped JPG
  - Quality: Photoreal midday partly-cloudy pure sky, crisp clouds, 21 EVs unclipped sun for sharp shadows
  - Use: Default clear-day sky for park/field/mountain maps (sky-only, no ground baked in)
- **[Venice Sunset (golden hour HDRI)](https://polyhaven.com/a/venice_sunset)** — Poly Haven · **CC0** · hdri
  - Format: EXR/HDR equirect (1K-16K) + 8K tonemapped JPG
  - Quality: Photoreal golden-hour horizon, warm low sun, unclipped 19 EVs, 16K
  - Use: Golden hour variant on any map: warm skybox + low-angle sun IBL
- **[The Sky Is On Fire (dusk HDRI)](https://polyhaven.com/a/the_sky_is_on_fire)** — Poly Haven · **CC0** · hdri
  - Format: EXR equirect (4K/8K/16K) + 8K tonemapped JPG + backplates
  - Quality: Photoreal fiery twilight over ocean, orange-magenta gradient, 16K
  - Use: Dusk/twilight scenario, especially the beach and coastal maps
- **[Qwantani Night (Pure Sky) — clear night with stars](https://polyhaven.com/a/qwantani_night_puresky)** — Poly Haven · **CC0** · hdri
  - Format: EXR/HDR equirect (4K/8K/16K/24K) + 8K tonemapped JPG
  - Quality: Photoreal clear night pure sky with visible Milky Way and stars, low contrast, up to 24K
  - Use: Night-flying scenario base sky + dim ambient IBL (layer NASA star map + moon on top)
- **[Overcast Soil (Pure Sky)](https://polyhaven.com/a/overcast_soil_puresky)** — Poly Haven · **CC0** · hdri
  - Format: EXR/HDR equirect (1K-16K) + 8K tonemapped JPG
  - Quality: Photoreal soft flat overcast, diffuse shadowless light, warm horizon glow, 16K
  - Use: Overcast weather preset on all maps; flattest lighting, cheapest to match with fog
- **[Approaching Storm (stormy HDRI)](https://polyhaven.com/a/approaching_storm)** — Poly Haven · **CC0** · hdri
  - Format: EXR/HDR equirect (1K-16K) + 8K tonemapped JPG
  - Quality: Photoreal pre-storm mood, veiled sun, brooding low-contrast sky, 13 EVs, 16K
  - Use: Storm scenario base sky; darken via exposure + add lightning sprites and rain
- **[Clouds with Transparency (billboard cloud atlas)](https://opengameart.org/content/clouds-with-transparency)** — OpenGameArt · **CC0 (explicit public-domain statement by author)** · texture
  - Format: 10x 2048x2048 PNG with alpha (+ JPG variants), 28.5 MB zip
  - Quality: Semi-realistic Blender-rendered volumetric-look cloud puffs; good at distance as billboards
  - Use: Instanced billboard cloud layer between drone and skybox for parallax depth on all day maps
- **[Lens-Flares and Particles (flare element pack)](https://opengameart.org/content/lens-flares-and-particles)** — OpenGameArt · **Dual CC0 / CC-BY 3.0 — choose CC0** · texture
  - Format: Grayscale/alpha PNG elements in 3 zips (~1.2 MB total)
  - Quality: Clean greyscale coronas, iris ghosts, hexagons, streaks; tintable, resolution modest but flares are soft so it holds up
  - Use: Custom textures for three.js Lensflare addon on the sun in every daytime map
- **[Lens Dirt Texture Pack](https://opengameart.org/content/lens-dirt-texture-pack-1png)** — OpenGameArt · **CC0** · texture
  - Format: PNG, 3870x2177, 9 dirt patterns
  - Quality: High-res photographic-style lens dirt/bokeh smudge overlays for post-processing
  - Use: FPV camera lens-dirt overlay that lights up when facing the sun (very FPV-authentic)
- **[Lightning Sprite Texture (8-frame sheet)](https://opengameart.org/content/lightning-sprite-texture)** — OpenGameArt · **CC0** · texture
  - Format: PNG sprite sheet, 8x1 frames, 337 KB
  - Quality: Stylized procedural bolts — usable additively at distance, not photoreal close-up
  - Use: Distant animated lightning flashes behind clouds in the storm scenario
- **[Lightning in Dark Storm Sky (photo, Anton Kudryashov)](https://www.pexels.com/photo/lightning-in-dark-storm-sky-9837044/)** — Pexels · **Pexels License (free commercial use, modification allowed, no attribution required)** · texture
  - Format: Full-resolution JPG
  - Quality: Photoreal branched bolt against near-black sky — ideal for luminance-keyed extraction
  - Use: Extract bolt via luminance threshold into an additive billboard for hero lightning strikes
- **[NASA CGI Moon Kit](https://svs.gsfc.nasa.gov/4720)** — NASA SVS · **Public domain (NASA media guidelines; credit 'NASA's Scientific Visualization Studio' requested)** · texture
  - Format: Color: TIFF/JPG 2K-16K (+EXR); displacement: TIFF up to 23040x11520
  - Quality: LRO-derived, scientifically accurate photoreal lunar surface; 2K JPG is only 447 KB
  - Use: Textured moon billboard/sphere in the night scenario (2K color map is plenty at sky distance)
- **[Deep Star Maps 2020 (all-sky star map)](https://svs.gsfc.nasa.gov/4851)** — NASA SVS · **Public domain (NASA media guidelines; credit 'NASA/GSFC SVS; Gaia DR2: ESA/Gaia/DPAC')** · hdri
  - Format: Equirect (plate carree) EXR up to 65536x32768; smaller TIFF/JPG versions
  - Quality: 1.7 billion real stars from Gaia/Hipparcos catalogs; correct Milky Way; downscale to 4K-8K
  - Use: Additive celestial sphere for the night map so stars stay pin-sharp above the HDRI's ambient

### Not found free: we will author these ourselves
- **Truly violent dark thunderstorm HDRI (towering black cumulonimbus, rain shafts)** — Poly Haven's free storm options are 'approaching storm' mood only; nothing free/CC0 with genuinely menacing skies found. Workaround: darken Approaching Storm via exposure/tint + fog + lightning sprites, or bake our own sky in Blender (Nishita sky + volumetrics) and export as EXR.
- **Tropical beach sunny HDRIs (Blue Lagoon Sunny, Ingwe Beach Sunny, Secluded Beach)** — Exist on Poly Haven at 24K, CC0, but currently patron-vault-locked (early access). They unlock to free over time — recheck in a few months; Spiaggia di Mondello covers the slot meanwhile.
- **Photoreal high-res cloud billboard atlas / flipbook (raymarched or photo-scanned look)** — OGA pack is semi-realistic only. Free VDB clouds exist but are unusable in a lightweight three.js web build. Plan: render our own billboard atlas from Blender volumetrics (a one-evening bake) for CC0-clean photoreal clouds.
- **Complete ready-made sun lens-flare ghost-chain textures** — The official three.js examples/textures/lensflare set is CC-BY-NC-SA 3.0 (NonCommercial) — REJECTED, do not ship it. We must compose our own flare chain from the CC0 OGA greyscale elements (tint + arrange in the Lensflare addon).
- **Animated photoreal lightning flipbook (frame sequence of a strike)** — Only stylized CC0 sprite sheets found. Workaround: build 3-4 still bolt masks from Pexels lightning photos and flash/crossfade them in shader with a point-light pulse.

### Integration notes
Never ship 16K sources: use a 2K .hdr per scenario for IBL (run through PMREMGenerator once, share the resulting environment texture across all materials) and the 4K tonemapped JPG on a background sphere or scene.background — that keeps each sky under ~10 MB versus 100+ MB for raw EXRs. For night, layer three spheres: Qwantani puresky for ambient IBL, the NASA star map (downscaled to 4K, additive, slowly rotating) for crisp stars, and a moon billboard using the 2K CGI Moon Kit color map with an emissive material. Pack the 10 cloud PNGs into one 4K atlas and render clouds as instanced billboards (InstancedMesh + depthWrite:false, sorted back-to-front, camera-facing in vertex shader) so hundreds of clouds cost one draw call; fade them near the far plane to hide the skybox seam. Drive the sun flare with three.js's Lensflare addon fed the CC0 OGA elements (not the NC-licensed three.js example textures), gate it with an occlusion raycast, and modulate the CC0 lens-dirt overlay by dot(cameraForward, sunDir) for the classic FPV sun-smear; lightning is an additive bolt billboard plus a 2-frame PointLight intensity spike and a delayed thunder sample.

## Props & World Clutter

- **[Lifeguard Tower (exiS7-Gs)](https://sketchfab.com/3d-models/lifeguard-tower-8707a73922004d5f8b67088b91a7a393)** — Sketchfab · **CC-BY 4.0 (verified via Sketchfab API; credit exiS7-Gs)** · model
  - Format: glTF (Sketchfab auto-convert) + source
  - Quality: 22,286 faces, 4K PBR textures (downscale to 2K), realistic weathered wood
  - Use: Beach map hero landmark; natural FPV orbit/dive target on the sand line
- **[Deck Chair & Parasol Low Poly FREE (Lady Lion Studios)](https://sketchfab.com/models/b396d4de963e49f68692d53d236bfe57)** — Sketchfab · **CC-BY 4.0 (verified via Sketchfab search API)** · model
  - Format: FBX + glTF auto-convert
  - Quality: 4,290 faces, textured realistic wood lounger + parasol, ideal instancing budget
  - Use: Instanced rows of loungers+umbrellas along the beach map shoreline
- **[Patio Set - table, 2 chairs, umbrella (zhixson)](https://sketchfab.com/models/37c3f6ee451f495ba183427a38a804b4)** — Sketchfab · **CC-BY 4.0 (verified via Sketchfab API)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 9,620 faces, clean stylized-realistic outdoor furniture
  - Use: Boardwalk cafe seating clusters and rooftop patio clutter
- **[Game Ready | Free Surfboards (Saritasa)](https://sketchfab.com/models/e79d7347ea4e4d6fbb649200d4911592)** — Sketchfab · **CC-BY 4.0 (verified via Sketchfab API; credit Saritasa/Anna Denisova)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 3,220 tris, 2K PBR PNG set, game-ready realism
  - Use: Leaning against lifeguard tower, stuck in sand, marina rack clutter
- **[Cooler Box (Guy in a Poncho)](https://sketchfab.com/models/2d02192c6be8434f9bb74de4e8a67ca4)** — Sketchfab · **CC-BY 4.0 (verified via Sketchfab API)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 2,778 faces, full 1K PBR set (AO/base/metal/normal/rough), simple but coolers are simple
  - Use: Scattered beach/pier picnic clutter next to loungers and towels
- **[Ferris Wheel (David Aganov)](https://sketchfab.com/models/675ab80b477b40f280b7311f81fee730)** — Sketchfab · **CC-BY 4.0 (verified via Sketchfab API)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 34,522 faces, 11 textures, realistic fairground wheel
  - Use: Pier map centerpiece; rotate slowly and use gondola gaps as FPV gates
- **[Vintage Lamp Post (dasmodal)](https://sketchfab.com/models/56f6dcb3865144cd84e049ca6a736fae)** — Sketchfab · **CC-BY 4.0 (verified via Sketchfab API)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 8,170 faces, PBR, game-engine-ready classic lamp
  - Use: Instanced along boardwalk/pier edge; emissive globe at dusk
- **[Harbor Navigation Buoy (MisterH)](https://sketchfab.com/models/62f7c151f4c048508b8cf5526f8588f9)** — Sketchfab · **CC-BY 4.0 (verified via Sketchfab API)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 15,486 faces, 9 textures, realistic weathered navigation buoy
  - Use: Marina map water markers; bobbing slalom course for low passes
- **[Overhead Water Tank (Nodeaxis Interactive)](https://sketchfab.com/models/1745c92e50b441c6bf6588e11cdba538)** — Sketchfab · **CC-BY 4.0 (verified via Sketchfab API)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 508 faces with 4K PBR textures (downscale to 1K) - extreme value
  - Use: Rooftop map clutter; scatter several per building at near-zero cost
- **[Rusty House Satellite Dish (TomasKiniulis)](https://sketchfab.com/models/929f056abe02416da19d7b1aa805d235)** — Sketchfab · **CC-BY 4.0 (verified via Sketchfab API)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 3,176 faces, weathered PBR, apartment-style dish
  - Use: Rooftop clutter on parapets and walls, instanced with random rotation
- **[Industrial Asset Pack (vmatthew) - barrels/pallet/crate/gas cylinders](https://sketchfab.com/models/0edba07309ef4ff98e5bb4d0b858952c)** — Sketchfab · **CC-BY 4.0 (verified via Sketchfab API)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 15 props / 22,658 faces total, 2K Substance PBR, realistic wear
  - Use: Warehouse and marina dock clutter: oil drums, pallet, wooden box, cylinders
- **[Free CC0 Industrial 3D Models (IndustrialPack)](https://3dmodelscc0.itch.io/free-cc0-industrial-3d-models)** — itch.io (3DModelsCC0) · **CC0 (verified on page)** · model
  - Format: RAR containing FBX/OBJ + textures (64 MB, convert to glTF)
  - Quality: 12 realistic props: cable drum, pallet truck, trolley, work lights, barrels, electrical boxes, gas cans
  - Use: Warehouse interior + construction site filler; work lights are great night-map props
- **[Wooden Pallets (YadroGames)](https://sketchfab.com/models/dba5c00928cd400796d9f6fffdd724b3)** — Sketchfab · **CC-BY 4.0 (verified via Sketchfab search API)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 384 faces, textured, perfect instancing budget
  - Use: InstancedMesh pallet stacks in warehouse, loading dock, and pier service areas
- **[Warehouse Shelving Unit (jimbogies)](https://sketchfab.com/models/788cc9b477684951934ff8b1ebb978e1)** — Sketchfab · **CC-BY 4.0 (verified via Sketchfab search API)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 424 faces, metal shelving, extremely cheap; pair with Rusty Metal Warehouse Shelving (ccc250d7) for hero shots
  - Use: Long pallet-rack aisles inside warehouse map - the classic FPV corridor
- **[Forklift Truck (louis-muir)](https://sketchfab.com/models/060f3f8bc7de4e6ca2f348d414702e9d)** — Sketchfab · **CC-BY 4.0 (verified via Sketchfab API)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 9,645 faces, 11 PBR textures, realistic
  - Use: Warehouse floor hero prop; park mid-aisle as an obstacle
- **[Realistic Metal Scaffolding (Jungle Jim)](https://sketchfab.com/models/c1f03864ec72449c8968f0630c287c8d)** — Sketchfab · **CC-BY 4.0 (verified via Sketchfab API)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 28,028 faces, metal + wooden planks, modular-looking
  - Use: Construction site map: wrap building faces, fly through the frame gaps
- **[Tower Crane (Chamod1999)](https://sketchfab.com/models/49851dc7a51b43bda6aea06856c26a85)** — Sketchfab · **CC-BY 4.0 (from Sketchfab search API; model page fetch rate-limited - re-verify at download, confidence medium-high)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 32,308 faces, game-ready detail
  - Use: Construction/skyline landmark; the jib is a natural high-altitude FPV line
- **[Poly Haven scanned props (Barrel_01/02/03, cardboard_box_01, Shelf_01, CoffeeCart_01)](https://polyhaven.com/a/Barrel_01)** — Poly Haven · **CC0 (site-wide, confirmed via polyhaven.com/license and API listing)** · model
  - Format: glTF/GLB + Blend, 1K-4K PBR selectable at download
  - Quality: Photoscanned-grade realism, game-ready topology; the best free realism available
  - Use: Warehouse/dock barrels and boxes everywhere; CoffeeCart_01 doubles as a boardwalk vendor cart

### Not found free: we will author these ourselves
- **Beach towels** — No quality free models found; trivial to make as textured planes with slight vertex-noise displacement - do ourselves.
- **Realistic boardwalk food kiosk / snack stand** — Only a cyberpunk-styled kiosk (CC-BY, 498k faces) found. Poly Haven CoffeeCart_01 (CC0) is a partial stand-in; build a simple plank kiosk from CC0 PBR textures ourselves.
- **Dock cleats, coiled ropes, dock boxes** — No acceptable dedicated models found. Cleats are a 5-min model; ropes = THREE.TubeGeometry along a spline with a CC0 rope texture.
- **Rooftop HVAC / AC condenser unit (realistic)** — Best hit was AI-generated (Rodin Gen-1, 60k faces, CC-BY) - questionable quality and provenance. Model a simple finned box + fan ourselves; kitbash grilles from the CC0 industrial pack electrical boxes.
- **Roof vents / exhaust stacks / whirlybirds** — Nothing good found; simple cylinders + CC0 galvanized-metal PBR texture will read perfectly at drone speeds.
- **Flags and bunting** — Static meshes look wrong anyway; implement as small cloth-sim or vertex-shader-waved planes with flag textures.
- **Additional fair rides (carousel, drop tower)** — Candidates exist only under Sketchfab 'Standard' license (assetfactory's Amusement park pack, 79k faces) - permitted in games but weaker redistribution clarity than CC; flagging rather than recommending.

### Integration notes
Almost everything here is Sketchfab CC-BY: Sketchfab serves an auto-converted glTF for every downloadable model, so pipe each one through gltf-transform (meshopt or Draco + KTX2/BasisU texture compression, resize to 1K-2K) - expect 10-20x size reduction, which keeps this whole category under ~40MB of the 300MB budget. Build one attribution/credits screen now and append author + model URL + "CC-BY 4.0" as you download; it is the only license obligation. Use THREE.InstancedMesh for all repeated clutter (loungers, pallets, shelving, lamp posts, buoys, dishes, water tanks) and merge remaining static props per-zone to keep draw calls low; give big landmarks (ferris wheel, crane, lifeguard tower) a 2-level LOD or a baked impostor beyond ~250-300m since FPV speeds make pop-in obvious. Strip or decimate interior-facing detail on hero models (the 4K-textured lifeguard tower and water tank ship far bigger textures than a drone flyby needs - 1K is plenty for anything under 2m).

## FPV Gear, Audio & UI

_Research pending (agent hit session limit); will be filled in on the next pass._

---
**Totals:** 129 verified free assets cataloged, 44 items on the to-create list.

CC-BY assets require attribution â€” collect credits into an in-game CREDITS screen before shipping any of them.
