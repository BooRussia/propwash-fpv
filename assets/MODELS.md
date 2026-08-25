# PropWash models

All files under `assets/models/` are CC0 or public-domain equivalents, free for commercial use.

## Kenney CC0 (City Kit Suburban / Commercial / Roads + Nature Kit)

Downloaded from kenney.nl (direct zip URLs). Creative Commons CC0.
License copies: `assets/vendor/kenney/`.

Each City Kit GLB uses Kenney's authored `Textures/colormap.png` (walls, roof, lids, and trim are separate atlas regions — not a window photo wrapped onto +Y). Dumpster lids (`lid-left` / `lid-right`) are separate meshes on that same atlas. Nature Kit palms/cactus are vertex-coloured (no atlas).

| slug | kit | scene |
|---|---|---|
| dumpster | roads | landward sidewalk / alley |
| traffic_cone | roads | zebra-crossing planting strip |
| street_light | roads | both sidewalks |
| street_light_square | roads | on disk |
| traffic_light | roads | on disk |
| stop_sign | roads | Ocean Drive gaps |
| planter | suburban | promenade |
| fence_low | suburban | on disk |
| parasol_a | commercial | beach (instanced) |
| awning | commercial | on disk |
| kenney_skyscraper_a/c | commercial | far skyline z>640 |
| kenney_midrise_e | commercial | far skyline |
| kenney_house_a | suburban | on disk |
| kenney_cactus | nature | leftover city beds |
| kenney_palm | nature | on disk |

Re-fetch: `bash tools/fetch-models.sh`

## Poly Haven CC0 (1k glTF)

Fetched via `https://api.polyhaven.com` (1k glTF + jpg includes), same as `tools/fetch-assets.ps1`.

| slug | scene |
|---|---|
| boulder_01, rock_07, … | existing breakwater / beach rocks |
| shrub_02, shrub_03, fern_02, anthurium_botany_01 | existing boardwalk dressing |
| potted_plant_02 | promenade pots |
| potted_plant_04 | city planting-strip succulents |
| plastic_monobloc_chair_01 | beach chairs |
| shrub_04 | leftover city dirt |
| lambis_shell | beach shells (no collider) |

threejsassets.com Vice Beach GLBs need a signed-in download — not fetched.
