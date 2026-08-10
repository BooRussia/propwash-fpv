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

- **[Nathan Animated 003 - Walking 3D Man (Renderpeople official)](https://sketchfab.com/3d-models/nathan-animated-003-walking-3d-man-143a2b1ea5eb4385ae90a73657aca3bc)** — Sketchfab (Renderpeople official account) · **CC-BY 4.0 (verified via Sketchfab API, slug 'by'; credit 'Renderpeople')** · model
  - Format: glTF (Sketchfab auto-convert) + source FBX
  - Quality: Photoscanned real human, 21,506 tris, 8K diffuse/normal/alpha (downscale to 2K), baked loopable 30fps mocap walk cycle
  - Use: The workhorse ambient pedestrian — walking loops along boardwalks, sidewalks, park paths; duplicate with tinted albedo for variety
- **[Sophia Animated 003 - Animated 3D Woman (Renderpeople official)](https://sketchfab.com/3d-models/sophia-animated-003-animated-3d-woman-dc448c3be0e74f96a55fb475a13433cf)** — Sketchfab (Renderpeople official account) · **CC-BY 4.0 (verified via Sketchfab API; credit 'Renderpeople')** · model
  - Format: glTF (Sketchfab auto-convert) + source FBX
  - Quality: Photoscanned woman, 16,475 tris, 8K textures, baked loopable animation, no rig needed
  - Use: Female ambient pedestrian to pair with Nathan; Manuel Animated 001 (dancing man, 23k tris, same account/license) adds a third animated variant
- **[Eric Rigged 001 - Rigged 3D Business Man (Renderpeople official)](https://sketchfab.com/3d-models/eric-rigged-001-rigged-3d-business-man-a46bc9f67aaa415bb4f3241eef900e7f)** — Sketchfab (Renderpeople official account) · **CC-BY 4.0 (verified via Sketchfab API; credit 'Renderpeople')** · model
  - Format: glTF (Sketchfab auto-convert) + source FBX with skeleton
  - Quality: Photoscanned, 20,542 tris, full skinned skeleton, 8K diffuse/normal/alpha
  - Use: Retarget any Mixamo/Rokoko/CMU clip onto him — sitting spectators, phone-checkers, waving bystanders near launch pads
- **[Carla Rigged 001 - Rigged 3D Business Woman (Renderpeople official)](https://sketchfab.com/3d-models/carla-rigged-001-rigged-3d-business-women-acf520f450d14dd799f98a6fede3edf5)** — Sketchfab (Renderpeople official account) · **CC-BY 4.0 (verified via Sketchfab API, slug 'by'; credit 'Renderpeople')** · model
  - Format: glTF (Sketchfab auto-convert) + source FBX with skeleton
  - Quality: Photoscanned, 19,988 tris, skinned rig, 8K textures; Claudia Rigged 002 (21.5k tris) is a third rigged variant on the same account
  - Use: Second retarget target for custom animations; mix-and-match with Eric for varied ambient NPC behaviors
- **[Dennis Posed 004 - Standing Man (Renderpeople official)](https://sketchfab.com/3d-models/dennis-posed-004-male-standing-business-model-e211ffd52a96416e89c0cc415a388d61)** — Sketchfab (Renderpeople official account) · **CC-BY 4.0 (verified via Sketchfab API; credit 'Renderpeople')** · model
  - Format: glTF (Sketchfab auto-convert) + source FBX
  - Quality: Static posed photoscan, 99,964 tris as shipped — decimate to ~10k for background use; photoreal
  - Use: Zero-animation-cost static bystander; Mei Posed 001 (walking pose, 100k tris, same account) is the female counterpart
- **[Fabienne & Percy 001 - Mother and Child (Renderpeople official)](https://sketchfab.com/3d-models/fabienne-percy-001-mother-and-child-8c9bfd4fb8a444b3a42a4fc31935a2fb)** — Sketchfab (Renderpeople official account) · **CC-BY 4.0 (verified via Sketchfab API account listing; credit 'Renderpeople')** · model
  - Format: glTF (Sketchfab auto-convert) + source FBX
  - Quality: Static posed photoscan pair, 199,850 tris — decimate hard (to ~15k combined) for background
  - Use: Adds rare child/family variety to park and beach scenes; the only free photoreal child asset found
- **[Lowpoly People + Waldo (282 remeshed body scans)](https://sketchfab.com/3d-models/lowpoly-people-waldo-9ec7a14729aa490fa712e51c217db0f5)** — Sketchfab (Loic Norgeot) · **CC-BY 4.0 (verified via Sketchfab API; credit 'Loic Norgeot')** · model
  - Format: glTF (Sketchfab auto-convert) + source
  - Quality: 282 distinct people, 140,943 tris TOTAL (~500 tris each), scan-derived silhouettes with baked color, foot-level origins
  - Use: The crowd goldmine — InstancedMesh/BatchedMesh beach crowds, race spectators, distant boardwalk fillers at near-zero GPU cost
- **[Human 3D model scanned with iPhone X (in3D)](https://sketchfab.com/3d-models/human-3d-model-scanned-with-iphone-x-73e467dfc8a04914bb314a9410077858)** — Sketchfab (in3D_io) · **CC-BY 4.0 (verified via Sketchfab API; credit 'in3D')** · model
  - Format: glTF (Sketchfab auto-convert) + source
  - Quality: Casual-clothed real-person scan, 37,210 tris, auto-rigged with 1 animation, phone-scan texture quality (good at 5m+ distance)
  - Use: Casually dressed pedestrian (the RP freebies are all business attire); in3D_io account has further scan variants
- **[Full Body Scan - Clean Pose (hoodie/jeans/cap man)](https://sketchfab.com/3d-models/full-body-scan-clean-pose-ae9559912f6240a8a87057911b69edd0)** — Sketchfab (OverseerThuror) · **CC-BY 4.0 (verified via Sketchfab API, slug 'by'; credit 'OverseerThuror')** · model
  - Format: glTF (Sketchfab auto-convert) + source
  - Quality: Cleaned photogrammetry, 153,880 tris (decimate to ~8k), single material/one texture, streetwear look
  - Use: Static casual bystander for urban map corners; author also has a 'Seahawks Football Fan' scan (528k tris) for a stadium-adjacent scene
- **[Mixamo (characters + animation library + auto-rigger)](https://www.mixamo.com/)** — Adobe Mixamo · **Adobe free license: royalty-free unlimited commercial use incl. games, no attribution; may NOT be redistributed/sold as standalone asset packs (verified via Adobe staff answer at community.adobe.com/t5/mixamo-discussions/the-license-to-use-mixamo/m-p/13228937; helpx FAQ page timed out on fetch and mixamo.com is a JS app — medium-high confidence, terms are Adobe-official)** · tool
  - Format: FBX (convert to glTF via Blender or FBX2glTF)
  - Quality: ~2,500 pro mocap animations (walk, sit, wave, jog, idle, cheer) + ~120 rigged characters of mid realism; free Adobe account required
  - Use: Primary animation source — upload Eric/Carla for auto-rig + apply idles/walks; also the fastest route to a posed pilot avatar (character + 'gaming idle' clip)
- **[CMU Motion Capture Database (cgspeed BVH conversion, 2,548 clips)](https://sites.google.com/a/cgspeed.com/cgspeed/motion-capture/the-motionbuilder-friendly-bvh-conversion-release-of-cmus-motion-capture-database)** — cgspeed / CMU Graphics Lab · **Free for any purpose, worldwide ('The files are free to use worldwide for any purpose' — CMU's canonical statement permits commercial use; may not be resold as data)** · animation
  - Format: BVH (retarget in Blender, export glTF)
  - Quality: 2,548 real human mocap sequences — walking, running, sitting, sports, idling; raw capture, needs cleanup/loop trimming
  - Use: Deep bench of natural ambient motion (loitering, looking around, jogging) beyond Mixamo's set; retarget onto the Renderpeople rigged pair
- **[Rokoko 263 free mocap assets](https://www.rokoko.com/resources/download-263-rokoko-motion-capture-assets)** — Rokoko · **Rokoko free-asset license: 'use them in any animation, VFX, game... including for commercial use' (page-verified; exact EULA ships with the Google Drive download — email signup required)** · animation
  - Format: FBX at 30fps, pre-exported for Mixamo / UE / HumanIK skeletons
  - Quality: 263 clean studio mocap clips incl. everyday idles, walks, sports; Mixamo-skeleton export retargets directly onto Mixamo-rigged characters
  - Use: Higher-fidelity idle/everyday loops for near-camera NPCs (spectators at the pilot spawn point)
- **[MakeHuman / MPFB 2 (CC0 character generator)](https://static.makehumancommunity.org/mpfb/faq/use_in_closed_source.html)** — MakeHuman Community · **Exported characters CC0 ('All core assets... are shared under CC0'; GPL applies only to the software, verified on FAQ); third-party clothing assets may differ — check each** · tool
  - Format: Exports OBJ/FBX/glTF from Blender via MPFB
  - Quality: Parametric realistic humans, poly count you choose, incl. swimwear/casual body types impossible to find as free scans
  - Use: Fabricate the gaps: beachgoers in swimwear, sunbathers, and a custom FPV pilot avatar — all CC0, no attribution burden
- **[Quaternius Ultimate Modular Men Pack (stylized fallback)](https://quaternius.com/packs/ultimatemodularcharacters.html)** — Quaternius · **CC0 (verified on page)** · model
  - Format: glTF, FBX, OBJ, Blend
  - Quality: 11 modular rigged characters x 24 animations, low-poly stylized — does NOT meet the photoreal bar
  - Use: Emergency-only fallback if photoreal crowd perf is untenable on low-end devices; listed because it is the only CC0 rigged+animated character set found

### Not found free: we will author these ourselves
- **Photoreal rigged humans under true CC0** — None found anywhere (Poly Haven has no humans; ambientCG none). Best available is CC-BY 4.0 (Renderpeople Sketchfab freebies) — acceptable, but every shipped person needs a credits entry.
- **FPV pilot avatar (person holding RC transmitter, goggles on head)** — Sketchfab search found only drones, no pilot. Build ourselves: MakeHuman/Mixamo character + Mixamo idle pose + a simple modeled transmitter prop.
- **Beach-specific people (swimwear, sunbathers lying down, kids playing)** — All free photoreal scans found wear business/street clothes. Generate in MakeHuman (CC0) or repose rigged CC-BY models with CMU 'lying/sitting' clips.
- **CC0 billboard/cutout crowd texture library** — Skalgubbar verified and REJECTED (license limits use to architecture visualization; games not permitted). MrCutout/CutoutPeople forbid redistribution — fails the browser-ships-the-file test. Instead render our own impostor sprite sheets from the CC-BY 3D people (derivative use is fine under CC-BY with credit).
- **Renderpeople.com's 40+ free web-store models (posed/rigged/animated variety)** — REJECTED for this project despite 'free commercial use': their T&C section 4.3(b) forbids making 3D data extractable by third parties, and a GitHub Pages app serves raw GLBs. Only their 9 Sketchfab CC-BY uploads are safe for us.
- **Large animated-crowd variety (10+ distinct clothed photoreal walkers)** — Only ~3 free animated photoreal people exist (Nathan/Sophia/Manuel). Stretch variety via albedo hue-shifts, texture swaps, and retargeting different clips onto Eric/Carla.

### Integration notes
Retarget everything onto the two Renderpeople rigged bodies (Eric/Carla) rather than shipping many unique skinned meshes: run Mixamo/Rokoko/CMU clips through Blender or three.js SkeletonUtils.retargetClip, and ship one shared clip library. For crowds, use the 282-person Lowpoly People set in an InstancedMesh/BatchedMesh (static poses are fine beyond ~30m), and bake 2-4 frame impostor sprite sheets rendered from the CC-BY models for the farthest ring — this replaces the missing cutout-people library license-cleanly. Compress aggressively with gltf-transform (meshopt + KTX2): downscale the 8K Renderpeople textures to 1K-2K (they compress to ~2-4MB each), decimate the 100-200k-tri posed scans to under 10k, and budget roughly 25-35MB for the entire character layer. Ship a CREDITS.md (and in-app credits screen) listing Renderpeople, Loic Norgeot, in3D, and OverseerThuror for the CC-BY assets; Mixamo/CMU/Rokoko/MakeHuman need no attribution.

## Sky & Lighting (HDRIs)

- **[Spiaggia di Mondello](https://polyhaven.com/a/spiaggia_di_mondello)** — Poly Haven · **CC0** · hdri
  - Format: EXR/HDR equirect (1K-20K) + 8K tonemapped JPG
  - Quality: Verified free (not vaulted); bright afternoon sun over sandy Sicilian beach, deep blue sky, high contrast; 4K EXR ~19.5MB
  - Use: Primary sky+environment for the tropical beach day map (sun angle ~afternoon, crisp shadows)
- **[Qwantani (Pure Sky)](https://polyhaven.com/a/qwantani_puresky)** — Poly Haven · **CC0** · hdri
  - Format: EXR/HDR equirect (1K-16K)
  - Quality: Clean clear-day pure sky (no ground), bright sun, deep blue gradient; ideal skydome since our maps supply their own terrain
  - Use: Generic clear-day sky for any map where we render our own ground/ocean; best IBL source for midday
- **[Venice Sunset](https://polyhaven.com/a/venice_sunset)** — Poly Haven · **CC0** · hdri
  - Format: EXR/HDR equirect (1K-16K) + 8K tonemapped JPG
  - Quality: Photoreal golden-hour: warm golden horizon, calm water reflections, medium contrast; 4K EXR ~18.5MB
  - Use: Golden hour variant for beach/coastal maps; low warm sun for long-shadow FPV cruising
- **[The Sky Is On Fire](https://polyhaven.com/a/the_sky_is_on_fire)** — Poly Haven · **CC0** · hdri
  - Format: EXR/HDR equirect (1K-16K) + tonemapped JPG
  - Quality: Fiery dusk/twilight seaside sky, partly cloudy, orange-magenta tones, unclipped 16K
  - Use: Dusk lighting preset; dramatic sunset freestyle sessions
- **[Rogland Clear Night](https://polyhaven.com/a/rogland_clear_night)** — Poly Haven · **CC0** · hdri
  - Format: EXR/HDR equirect (1K-24K) + 8K tonemapped JPG
  - Quality: Unclipped clear desert night with Milky Way and stars, soft natural starlight, minimal light pollution
  - Use: Clear-night map sky; pairs with LED-prop night flying and moon quad
- **[Satara Night](https://polyhaven.com/a/satara_night)** — Poly Haven · **CC0** · hdri
  - Format: EXR/HDR equirect (1K-16K) + 8K tonemapped JPG
  - Quality: Starry night with Milky Way plus warm village lamps and silhouetted trees; high contrast, atmospheric
  - Use: Alternate inhabited-night sky (campground/village night map) with warm practical lights baked in
- **[Kloofendal Overcast (Pure Sky)](https://polyhaven.com/a/kloofendal_overcast_puresky)** — Poly Haven · **CC0** · hdri
  - Format: EXR/HDR equirect (1K-24K) + 8K tonemapped JPG
  - Quality: Soft low-contrast overcast pure sky (ground removed), cool diffuse light with subtle sun glow
  - Use: Overcast weather preset for any map; flat diffuse IBL, no hard sun shadow
- **[Approaching Storm](https://polyhaven.com/a/approaching_storm)** — Poly Haven · **CC0** · hdri
  - Format: EXR/HDR equirect (4K/8K/16K)
  - Quality: Pre-storm mood: veiled sun, broad heavy cloud deck over grassland, low contrast; 4K EXR ~21MB
  - Use: Brighter early-storm variant; base lighting before lightning kicks in
- **[Quarry Cloudy](https://polyhaven.com/a/quarry_cloudy)** — Poly Haven · **CC0** · hdri
  - Format: EXR/HDR equirect (4K-20K)
  - Quality: Gloomy dark looming-storm sky, dramatic partly-cloudy, tagged storm/gloomy; verified free download
  - Use: Dark stormy map sky; grade slightly darker + add lightning billboards for full thunderstorm
- **[NASA CGI Moon Kit](https://svs.gsfc.nasa.gov/4720)** — NASA SVS · **Public domain (NASA); credit 'NASA's Scientific Visualization Studio' requested** · texture
  - Format: TIFF/EXR cylindrical maps: color 2K-16K, displacement 4-64 px/deg
  - Quality: Photoreal LRO-derived moon color + elevation maps; 2K color is plenty for a sky moon
  - Use: Textured moon sphere/quad in night skies (2K color + optional displacement-baked normal)
- **[Deep Star Maps 2020](https://svs.gsfc.nasa.gov/4851)** — NASA SVS · **Public domain (NASA); credit 'NASA/GSFC SVS; Gaia DR2: ESA/Gaia/DPAC'** · texture
  - Format: Equirect (plate carree) OpenEXR half-float + TIFF, 4K-64K
  - Quality: 1.7 billion real stars from Gaia/Hipparcos/Tycho; the definitive photoreal celestial sphere, HDR so bright stars survive tonemapping
  - Use: Star dome for clear-night map (4K EXR downscaled, additive on inner skysphere, rotated for time-of-night)
- **[Solar System Scope textures (moon + Milky Way)](https://www.solarsystemscope.com/textures/)** — Solar System Scope · **CC-BY 4.0 (attribution: 'Textures: Solar System Scope, CC BY 4.0')** · texture
  - Format: Equirect JPG/PNG, 2K and 8K (moon, stars, stars+Milky Way)
  - Quality: Ready-to-use LDR 8K Milky Way panorama and 8K moon color; easier drop-in than the NASA EXRs
  - Use: Lightweight LDR alternative star/moon maps if we skip HDR star rendering
- **[Clouds with Transparency](https://opengameart.org/content/clouds-with-transparency)** — OpenGameArt · **CC0** · texture
  - Format: 10x 2K PNG with alpha (+ JPG mattes), 28.5MB zip
  - Quality: Naturalistic Blender-generated volumetric-look cloud cutouts, clean alpha edges
  - Use: Instanced billboard clouds layered above beach/valley maps; distant cumulus cards
- **[Realistic transparent clouds (41)](https://olegvegan.itch.io/realistic-transparent-clouds)** — itch.io (olegvegan) · **CC0 (stated: 'cc0, free to use for any purpose')** · texture
  - Format: 41x PNG with transparency, 20MB zip
  - Quality: Photographic real-cloud cutouts (no AI), good variety for atlasing; resolution unstated per image (verify on download)
  - Use: Photoreal cloud billboard atlas — pack best 8-12 into one 2K atlas for instanced sky cards
- **[Lens-Flares and Particles (hackcraft.de)](https://opengameart.org/content/lens-flares-and-particles)** — OpenGameArt · **Dual CC0 / CC-BY 3.0 (use under CC0)** · texture
  - Format: Greyscale/alpha PNG elements (corona, iris, hexagon, aura, nova...), zips 245KB-614KB
  - Quality: Clean flare building blocks; tint at runtime, composes into convincing photographic flares
  - Use: Feed THREE.Lensflare addon: sun corona + hexagon ghost chain for beach/golden-hour maps (three.js's own bundled lensflare PNGs are CC-BY-NC-SA — do NOT ship those)
- **[Lens dirt texture Pack (9 textures)](https://opengameart.org/content/lens-dirt-texture-pack-1png)** — OpenGameArt · **CC0** · texture
  - Format: 9x PNG, 3870x2177 (~8.5MB each; one per page, packs 1-9 linked from this page)
  - Quality: High-res photographic lens dirt/bokeh smudge plates for post-processing
  - Use: FPV camera lens-dirt overlay that lights up when facing the sun (classic GoPro look); downscale to 1080p
- **[Lightning (electrical arcs)](https://opengameart.org/content/lightning)** — OpenGameArt · **CC0** · texture
  - Format: 8x 2048x512 PNG (4 purple, 4 blue), seamless-repeating
  - Quality: Procedural difference-cloud arcs; convincing at distance with additive blend, not photo-real close up
  - Use: Storm map lightning: additive billboard strikes synced with a white point-light flash and thunder SFX
- **[Kenney Particle Pack](https://kenney.nl/assets/particle-pack)** — Kenney · **CC0** · texture
  - Format: 80x 512x512 PNG sprites (smoke, flare, spark, light, dirt)
  - Quality: Soft generic particle sprites — stylized but reads realistic under additive/alpha blending at small sizes
  - Use: Utility sprites: prop-wash dust puffs, crash sparks, small sun-glint flares, cloud filler particles

### Not found free: we will author these ourselves
- **True thunderstorm HDRI (near-black cumulonimbus, rain shafts)** — Poly Haven's best free options are pre-storm (Approaching Storm) or gloomy (Quarry Cloudy). No CC0 full-blown thunderstorm HDRI found at acceptable quality. Plan: darken/grade Quarry Cloudy in-engine (exposure/tint) and layer dark cloud billboards.
- **Tropical beach day HDRIs at Poly Haven's newest quality tier** — The flagship beach HDRIs (Blue Lagoon Sunny, Ingwe Beach Sunny) are currently vaulted/patron-only — verified locked. Spiaggia di Mondello (CC0, free) is the best available substitute and is excellent; revisit the vault later as Poly Haven unlocks vaults over time.
- **Color anamorphic lens-flare ghost/streak sprite sheet (photographic)** — three.js's stock lensflare textures are CC-BY-NC-SA (commercial-unfriendly, cannot ship). CC0 options are greyscale elements only — we tint/compose our own flare chain, or bake one in Blender ourselves.
- **Photographic lightning bolt strike textures (high-res, licensed CC0)** — Only procedural arc textures found under CC0. For hero strikes, generate bolts procedurally (jittered polyline + emissive shader + bloom) which also animates better than static photos.
- **Relightable cloud impostor atlas (billboards with baked normals/scattering)** — Only flat RGBA cutouts exist for free. For sunset maps the flat cards won't take rim light; either tint per-time-of-day in the shader or bake our own octahedral impostors from a Blender volumetric later.
- **3D noise volume data for raymarched volumetric clouds** — Not found as a downloadable free asset; standard practice is generating Perlin-Worley 3D textures procedurally at load (cheap, ~few MB), so no asset needed if we go volumetric.

### Integration notes
Ship each map's sky as a 2K .hdr (1-6MB) loaded via RGBELoader, run it through PMREMGenerator once, and set it as both scene.background and scene.environment so PBR materials get matching IBL; place a single DirectionalLight manually aligned to the HDRI's sun for real shadows (Poly Haven pages list sun position/EV to match intensity). Prefer the "Pure Sky" variants for maps with our own terrain so the HDRI horizon doesn't fight the geometry, and lazy-load only the active map's HDRI to stay far under budget (all six weather presets at 2K ≈ 15-25MB total). For night, layer an additive inner skysphere using a 4K PNG downscale of the NASA/SolarSystemScope star map plus a small moon sprite using the 2K CGI Moon Kit color map — keep stars LDR and fake HDR pop with bloom on the brightest pixels. Clouds and lightning should be instanced camera-facing quads (InstancedMesh + depthWrite:false, soft-particle depth fade) drawn from a single packed 2K atlas, and the lens flare should use the three.js Lensflare addon but with the CC0 hackcraft/OpenGameArt sprites — never the repo's bundled CC-BY-NC-SA textures — plus a screen-space lens-dirt overlay whose opacity is driven by sun-to-camera dot product.

## Props & World Clutter

- **[Ocean Buoy](https://polyhaven.com/a/ocean_buoy)** — Poly Haven · **CC0** · model
  - Format: glTF/GLB (also FBX, blend)
  - Quality: 12,240 polys, up to 8K PBR textures (downscale to 1-2K), photoreal weathered red buoy with cage light and rust
  - Use: Marina/harbor water — scatter 2-3 instances as floating race markers; sibling asset lateral_sea_marker (red channel marker) on same site
- **[Coffee Cart 01](https://polyhaven.com/a/CoffeeCart_01)** — Poly Haven · **CC0** · model
  - Format: glTF/GLB (also FBX, blend)
  - Quality: 27,659 polys, 4K PBR, photoreal industrial metal cart with brewer and caster wheels
  - Use: Boardwalk/pier food vendor spot; doubles as street-corner kiosk in urban map
- **[Plastic Monobloc Chair 01](https://polyhaven.com/a/plastic_monobloc_chair_01)** — Poly Haven · **CC0** · model
  - Format: glTF/GLB (also FBX, blend)
  - Quality: 3,356 polys, 4K PBR, photoreal weathered white plastic chair with scuffs and dirt
  - Use: Instanced beach/cafe/rooftop scatter clutter — cheap enough to place dozens
- **[Wooden Crate 02 (+ Poly Haven props family: wooden_barrels_01, Barrel_01/02, old_military_crate, hand_truck, old_tyre, metal_jerrycan, WetFloorSign_01)](https://polyhaven.com/a/wooden_crate_02)** — Poly Haven · **CC0** · model
  - Format: glTF/GLB (also FBX, blend)
  - Quality: 5,176 polys, up to 8K PBR (downscale), photoreal worn planks/brass corners; siblings similar game-ready weights
  - Use: Warehouse interiors, dock stacks, alley clutter — instance in stacks with random yaw
- **[Street Lamp 01 / Street Lamp 02](https://polyhaven.com/a/street_lamp_01)** — Poly Haven · **CC0** · model
  - Format: glTF/GLB (also FBX, blend)
  - Quality: 31K tris (01, 3.9m tall) / 20K tris (02, 1.7m) — photoreal but heavy; decimate or LOD for rows
  - Use: Pier/boardwalk and street lamp rows; emissive material for night flying
- **[Lifeguard Tower](https://sketchfab.com/3d-models/lifeguard-tower-2f147eeb428847f7b06244026db6c07e)** — Sketchfab · **CC-BY 4.0 (credit: Sololopenko)** · model
  - Format: glTF/GLB auto-converted (Sketchfab download)
  - Quality: 6K tris, game-ready, tileable-texture realistic style
  - Use: Hero landmark on beach map — classic FPV gap/orbit subject
- **[Game Ready | Free Surfboards](https://sketchfab.com/3d-models/game-ready-free-surfboards-e79d7347ea4e4d6fbb649200d4911592)** — Sketchfab · **CC-BY 4.0 (credit: Saritasa / artist Anna Denisova)** · model
  - Format: glTF/GLB auto-converted (Sketchfab download)
  - Quality: 3,220 tris per board, 2048px PNG PBR textures, realistic
  - Use: Lean against lifeguard tower, stick upright in sand, rooftop of surf shack
- **[Deck Chair & Parasol FBX Low Poly FREE](https://sketchfab.com/3d-models/deck-chair-parasol-fbx-low-poly-free-b396d4de963e49f68692d53d236bfe57)** — Sketchfab · **CC-BY 4.0 (credit: Lady Lion Studios)** · model
  - Format: FBX + Sketchfab auto glTF/GLB
  - Quality: 4,290 faces, 4K PBR maps (normal/diffuse/roughness) sourced from CC0 textures — downscale to 1K
  - Use: Beach lounge rows — instance chair+umbrella pairs along the sand
- **[Beach table (table + chair + umbrella set)](https://sketchfab.com/3d-models/beach-table-e559392994e04527b3f5ee35a8c3c418)** — Sketchfab · **CC-BY 4.0 (credit: Jayson Stauffer)** · model
  - Format: glTF/GLB auto-converted (Sketchfab download)
  - Quality: 3,376 faces, 10 textures, realistic beachfront-restaurant set
  - Use: Boardwalk cafe seating clusters and pier-side restaurant patio
- **[Cooler Box](https://sketchfab.com/3d-models/cooler-box-2d02192c6be8434f9bb74de4e8a67ca4)** — Sketchfab · **CC-BY 4.0 (credit: Guy in a Poncho)** · model
  - Format: glTF/GLB auto-converted (Sketchfab download)
  - Quality: 2,778 faces, full 1024px PBR set (AO/basecolor/metallic/normal/roughness), realistic plastic cooler
  - Use: Beach blankets, boat decks, tailgate clutter near marina
- **[Rooftop Ventilations, Air Conditioning Units](https://sketchfab.com/3d-models/rooftop-ventilations-air-conditioning-units-6dfa32e7ec614362a29fd950b87212ca)** — Sketchfab · **CC-BY 4.0 (credit: Oskar3D_)** · model
  - Format: glTF/GLB auto-converted (Sketchfab download)
  - Quality: 3,480 faces total, modular AC/vent units, game-ready simple UVs
  - Use: Rooftop clutter across the whole city map — instance heavily, key for FPV rooftop lines
- **[CC0 - Antenna](https://sketchfab.com/3d-models/cc0-antenna-6bc0ff4565db46ab8f7d229a5d272c12)** — Sketchfab · **CC0 (declared in description; Sketchfab metadata shows CC-BY — attributing plaggy anyway is zero-cost)** · model
  - Format: glTF/GLB auto-converted (Sketchfab download)
  - Quality: 446 faces, 2048px PBR baked from high poly — ideal instanced rooftop prop
  - Use: TV antennas on every rooftop; pairs with the AC units for skyline detail
- **[Warehouse Assets (pack: pallets, barrels, shelves, racks, toolboxes, gas tanks)](https://sketchfab.com/3d-models/warehouse-assets-ed3f44d6395a4abcab43e6c402c2dd04)** — Sketchfab · **CC-BY 4.0 (credit: Big guy / andrej.lit)** · model
  - Format: glTF/GLB auto-converted (Sketchfab download)
  - Quality: 95K faces for the whole pack (split into individual props), Substance-textured realistic
  - Use: Primary dressing for warehouse map interior; split pack and instance pieces
- **[Pallet Racking](https://sketchfab.com/3d-models/pallet-racking-593e7d15f27346efa2dcc0149edb6ef2)** — Sketchfab · **CC-BY 4.0 (credit: YadroGames)** · model
  - Format: glTF/GLB auto-converted (Sketchfab download)
  - Quality: 1,296 faces, 2048px baked PBR in 4 variants, game-ready
  - Use: Long instanced shelving aisles in warehouse — the racing corridors
- **[Warehouse Forklift Gameready](https://sketchfab.com/3d-models/warehouse-forklift-gameready-94e21059f00c4e989c6403ada034516e)** — Sketchfab · **CC-BY 4.0 (credit: Kamran Mughal)** · model
  - Format: glTF/GLB auto-converted (Sketchfab download)
  - Quality: 7.8K tris, optimized for real-time, realistic
  - Use: Parked in warehouse aisles and loading dock; obstacle to slalom around
- **[Tower Crane](https://sketchfab.com/3d-models/tower-crane-49851dc7a51b43bda6aea06856c26a85)** — Sketchfab · **CC-BY 4.0 (credit: Chamod1999)** · model
  - Format: glTF/GLB auto-converted (Sketchfab download)
  - Quality: 32,308 faces, 2K Substance PBR, tagged game-ready
  - Use: Construction-site landmark — jib is a natural FPV flight line and perch point
- **[Modular Scaffolding Pack](https://sketchfab.com/3d-models/modular-scaffolding-pack-8a072763269f4fdc95eb283a9bc7a88f)** — Sketchfab · **CC-BY 4.0 (credit: Arsen Ismailov)** · model
  - Format: glTF/GLB auto-converted (Sketchfab download)
  - Quality: 294K faces for FULL pack — modular pieces; import only the 3-4 modules needed (each far smaller), 4K tarp/trim textures to downscale
  - Use: Wrap one construction building facade; tarps make readable wind-gap obstacles
- **[Ferris Wheel (WIP-1)](https://sketchfab.com/3d-models/ferris-wheel-wip-1-98e95a8d47c04d06a3c8543f09bd744a)** — Sketchfab · **CC-BY 4.0 (credit: 3DHaupt / Dennis H.)** · model
  - Format: glTF/GLB auto-converted (Sketchfab download)
  - Quality: 247K tris — over budget as-is; PBR textured, rigged and animated (rotating). Decimate to ~60-80K with gltf-transform simplify for use
  - Use: Pier-end fair landmark, slowly rotating; the signature orbit subject of the beach map

### Not found free: we will author these ourselves
- **Beach towels** — No quality free 3D model worth shipping — author as flat subdivided quads with a CC0 fabric texture (ambientCG) and slight vertex ripple; 10 minutes of work.
- **Dock cleats, mooring ropes, dock boxes** — Only photogrammetry bollards found (~1M faces each, CC-BY, artfletch) — unusable without heavy retopo. Model simple cleats/rope coils ourselves (<500 tris) with a CC0 rope texture.
- **Game-optimized realistic ferris wheel** — Best free realistic option is 247K tris (listed, needs decimation); the only light ones are stylized neon low-poly (David Aganov, 34K, CC-BY) — acceptable fallback for night scenes.
- **Residential satellite dish** — Only sci-fi-styled dishes found at game weight (CGKnuenz, CC-BY 5.5K). A simple parabolic dish is trivial to model; plaggy CC0 antenna covers most rooftop silhouette needs.
- **Flags and flag poles (animated)** — Static flag models are trivial; do it in-engine — cylinder pole + plane with a vertex-shader wave, reusing wind direction from the sim for coherence.
- **Full boardwalk food kiosk building** — Free kiosk models found are 230K-3M faces (fasih.lisan, Kirillwq). Stopgap: Poly Haven Coffee Cart (listed) or Stand_RS01 on Sketchfab (CC-BY, 9.3K faces, uid c5e026fa607c4a60b93140edf4d11a92); otherwise kit-bash a box + awning from CC0 textures.
- **Fair rides beyond ferris wheel (carousel, drop tower)** — Nothing found at realistic quality + free license + game weight; suggest skipping or silhouette-only background geometry.

### Integration notes
Use THREE.InstancedMesh (or BatchedMesh) for everything placed more than ~5 times — monobloc chairs, deck-chair/parasol pairs, pallets, rack aisles, AC units, antennas, lamp posts — one draw call per prop type transforms this category from a draw-call bomb into nearly free. Run every download through gltf-transform: `resize` textures to 1K (2K only for hero props like the crane/lifeguard tower), `simplify` (meshopt) for the ferris wheel and street lamps, then `etc1s`/`uastc` KTX2 + meshopt compression — the whole props set should land under 40MB. Sketchfab's auto-converted glTF sometimes ships unlit or specular-gloss materials — normalize to MeshStandardMaterial metal/rough and strip embedded lights/cameras on import. Keep one CREDITS.md/in-game credits screen listing every CC-BY author verbatim (author + model URL + license link) — that fully satisfies CC-BY 4.0 for the 12 attributed models; the Poly Haven and plaggy items are CC0 and need nothing.

## FPV Gear, Audio & UI

- **[FPV-dron_NonStop (freestyle FPV quad)](https://sketchfab.com/models/c75dea6e3ae441ac87f292efb17f5bae)** — Sketchfab · **CC-BY 4.0 (credit: Viktor_ / Viktor Zhuravlev)** · model
  - Format: glTF (Sketchfab auto-convert) + source
  - Quality: 24.7k faces, handcrafted 4K PBR textures, realistic game-ready FPV quad
  - Use: Hero/player drone for 3rd-person view, menu hangar, and spectator drones; carries Ukrainian/energy-drink livery so plan a quick retexture of the albedo
- **[DJI FPV drone](https://sketchfab.com/models/28321515f60346c0becb244ed094c1f8)** — Sketchfab · **CC-BY 4.0 (credit: Vitalii Sushko)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 42.2k faces, professional portfolio-grade PBR model of the DJI FPV
  - Use: Second selectable craft (cinewhoop-class handling profile) and photogenic menu model
- **[5-inch Tri-Blade Propeller](https://sketchfab.com/models/29c041703a6d49ecb08bc2427d71851a)** — Sketchfab · **CC-BY 4.0 (credit: The Van)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 3.3k faces, accurate 5" tri-blade prop geometry
  - Use: Attach 4x to any frame; swap to a textured blur-disc quad above ~30% throttle
- **[DJI Avata photogrammetry scan (cinewhoop)](https://sketchfab.com/models/49110a425abd4c4688cf35dd8bcd06fe)** — Sketchfab · **CC-BY 4.0 (credit: nugget)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 659k faces RealityScan photogrammetry - photoreal but MUST be decimated to ~40k in Blender before use
  - Use: Only real ducted cinewhoop found; decimate + bake for the cinewhoop craft option
- **[Whooper's Garage Aichi - Tiny Whoop Circuit](https://sketchfab.com/models/e3ce3c96f57a498e81c09dffc07976cd)** — Sketchfab · **CC-BY 4.0 (credit: Miyai)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 169k faces, scan/model of a real indoor tiny-whoop racing venue in Japan
  - Use: Drop-in indoor micro-flying map with authentic whoop-track layout (split into chunks + frustum cull)
- **[Helipad (game-ready)](https://sketchfab.com/models/bc2b0be44c954fa59f0376eb8b36b59e)** — Sketchfab · **CC-BY 4.0 (credit: Veterock)** · model
  - Format: glTF (Sketchfab auto-convert)
  - Quality: 48.5k faces, 10 PBR textures / 7 materials, explicitly game-ready
  - Use: Launch/landing pad at spawn points on rooftop and airfield maps
- **[FPV Drone Flight 3 (real FPV motor audio)](https://freesound.org/people/qubodup/sounds/854466/)** — Freesound · **CC0** · audio
  - Format: WAV 48kHz 16-bit mono, 13.5s
  - Quality: Genuine first-person FPV flight audio, clean motor/prop tone
  - Use: Primary source for the throttle-mapped motor loop (slice a clean sustain section, loop via Web Audio)
- **[Tiny Hawk 2 short flight (micro quad)](https://freesound.org/people/Sadiquecat/sounds/677833/)** — Freesound · **CC0** · audio
  - Format: WAV 96kHz 16-bit stereo, 45s
  - Quality: Real EMAX TinyHawk 2 whoop hovering/flying, close-mic Zoom H5
  - Use: Motor sound layer for the tiny-whoop craft and indoor maps
- **[Wind howling in Atacama salt desert](https://freesound.org/people/felix.blume/sounds/142335/)** — Freesound · **CC0** · audio
  - Format: WAV 48kHz 24-bit stereo, 2:00
  - Quality: Professional field recording (Schoeps MS rig), dramatic gusting wind
  - Use: Altitude/speed-scaled wind bed for mountain and open-field maps
- **[Wind Ambience (Looping)](https://freesound.org/people/jackyyang09/sounds/476849/)** — Freesound · **CC-BY 4.0 (credit: jackyyang09)** · audio
  - Format: WAV 48kHz 16-bit stereo, 52s seamless loop
  - Quality: Purpose-made seamless game wind loop
  - Use: Default outdoor ambient wind loop (lower-effort alternative to slicing the Atacama recording)
- **[Slowly Raining Loop](https://freesound.org/people/unfa/sounds/177479/)** — Freesound · **CC0 (via Freesound CC0 search filter)** · audio
  - Format: WAV loop
  - Quality: Clean steady rain recorded on a balcony, made to loop
  - Use: Rain weather setting on any map
- **[Ambiance_Ocean_Ribeira_Grande_Loop_Stereo_02](https://freesound.org/people/Nox_Sound/sounds/829629/)** — Freesound · **CC0** · audio
  - Format: WAV 96kHz 24-bit stereo, 1:00 seamless loop
  - Quality: Professional ocean shoreline field recording (Sony PCM D100), loop-ready
  - Use: Coastal/beach map ambience near the waterline (distance-attenuated)
- **[AMBTraf bus stop city ambience](https://freesound.org/people/SFXAFRIK/sounds/582935/)** — Freesound · **CC0** · audio
  - Format: WAV 96kHz 24-bit stereo, 2:42
  - Quality: Busy city traffic/street ambience, professional recording
  - Use: City/rooftop map background ambience (loop with crossfade)
- **[Fall debris (crash)](https://freesound.org/people/xkeril/sounds/703248/)** — Freesound · **CC0** · audio
  - Format: WAV 48kHz 16-bit stereo, 3.9s
  - Quality: Tiles/stone/metal impact on hard floor - punchy crash transient
  - Use: Drone crash impact SFX; pitch/gain-randomize per collision energy
- **[B612 Mono (Airbus cockpit display font)](https://fonts.google.com/specimen/B612+Mono)** — Google Fonts · **SIL OFL 1.1 (also EPL-2.0/EDL-1.0; verified at github.com/polarsys/b612)** · font
  - Format: TTF/WOFF2, 4 styles
  - Quality: Designed by Airbus+ENAC specifically for aircraft cockpit screen legibility
  - Use: Betaflight-style OSD/HUD text (altitude, voltage, timer, crosshair labels) - self-host the woff2

### Not found free: we will author these ourselves
- **Authentic Betaflight OSD bitmap font (.mcm)** — All real ones are license-incompatible: betaflight-configurator resources/osd, tigert/betaflight-fonts (Clarity) and Knifa/material-osd are GPL-3.0 copyleft; SNEAKY_FPV fonts are personal-use only. Recreate a 12x18 OSD glyph atlas ourselves (canvas-drawn) styled after it, or just use B612 Mono.
- **Textured race gates / flags / start arches (game models)** — Only 3D-print STLs exist (Cults/Printables/MakerWorld - untextured, often personal-use licenses); nothing suitable on Sketchfab. Trivial to model in-house: torus + truss + emissive fabric plane with checkered texture.
- **Neutral/unbranded 5-inch freestyle quad, CC0** — Best find (FPV-dron_NonStop) is CC-BY with distinctive livery; no CC0 FPV quad exists at quality. Retexture the CC-BY one or model a generic frame ourselves.
- **Tiny whoop drone model (game-ready)** — Sketchfab only has an untextured whoop frame; no complete downloadable whoop at acceptable quality. Model in-house (ducted frame is simple geometry) or scale/kitbash the 5-inch quad.
- **Throttle-sweep FPV motor recording (idle-to-punch RPM ramp)** — CC0 clips found are constant-RPM flight/hover; a clean sweep would let us pitch-map RPM directly. Slice multi-RPM grains from the qubodup/Sadiquecat clips or record one ourselves.

### Integration notes
Download the Sketchfab models as glTF, then run everything through gltf-transform (Draco or Meshopt + KTX2/BasisU textures downscaled to 1-2K) — the Avata scan additionally needs Blender decimation to ~40k tris; since the player mostly sees their own drone only in menus/prop-tips, one aggressive LOD is enough, and props should swap to a blur-disc texture above ~30% throttle. For audio, transcode all WAVs to ~96-128kbps OGG/Opus, drive the motor loop with Web Audio playbackRate + gain mapped to throttle (crossfade a hover layer and a full-throttle layer to avoid chipmunk pitch artifacts), and randomize pitch on the crash impact. Render the OSD with self-hosted B612 Mono into a canvas texture or DOM overlay rather than shipping GPL .mcm fonts. All Sketchfab models and the jackyyang09 wind loop are CC-BY 4.0, so add a credits screen listing each author (Viktor_, Vitalii Sushko, The Van, nugget, Miyai, Veterock, jackyyang09); everything else listed is CC0.

---
**Totals:** 162 verified free assets cataloged, 56 items on the to-create list.

CC-BY assets require attribution â€” collect credits into an in-game CREDITS screen before shipping any of them.
