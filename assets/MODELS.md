# PropWash models

All files under `assets/models/` are CC0 or public-domain equivalents, free for commercial use.

## Kenney CC0 (City Kit Suburban / Commercial / Roads + Nature Kit + Car Kit)

Downloaded from kenney.nl (direct zip URLs). Creative Commons CC0.
License copies: `assets/vendor/kenney/`.

Each City Kit GLB uses Kenney's authored `Textures/colormap.png` (walls, roof, lids, and trim are separate atlas regions — not a window photo wrapped onto +Y). Dumpster lids (`lid-left` / `lid-right`) are separate meshes on that same atlas. Nature Kit palms/cactus are vertex-coloured (no atlas).

| slug | kit | scene |
|---|---|---|
| dumpster | roads | landward sidewalk / alley |
| traffic_cone | roads | zebra-crossing planting strip |
| street_light | roads | both sidewalks |
| street_light_square | roads | on disk |
| traffic_light | roads | Ocean Drive × GAP_X corners, ±7 m, z 34.4–35.2 / 53.2–54.0 |
| stop_sign | roads | Ocean Drive gaps (city z=50.6 + beach z=37.6) |
| planter | suburban | promenade |
| fence_low | suburban | on disk |
| parasol_a | commercial | beach (instanced) |
| awning | commercial | city sidewalk landward edge z 56–58 |
| kenney_skyscraper_a/c | commercial | far skyline z>640 |
| kenney_midrise_e | commercial | far skyline |
| kenney_house_a | suburban | far low-rise infill z 720–820 |
| kenney_cactus | nature | leftover city beds |
| kenney_palm | nature | leftover city dirt / promenade z 58–72 |
| construction_barrier | roads | on disk |
| construction_fence | roads | on disk |
| construction_light | roads | on disk |
| electricity_pole | roads | on disk |
| street_sign | roads | on disk |
| warning_sign | roads | on disk |
| traffic_light_horizontal | roads | on disk |
| highway_sign | roads | on disk |
| street_light_double | roads | on disk |
| fence | suburban | on disk (taller than fence_low) |
| kenney_tree_large / kenney_tree_small | suburban | on disk |
| kenney_house_b/c/d | suburban | on disk |
| awning_wide | commercial | on disk |
| overhang | commercial | on disk |
| parasol_b | commercial | on disk |
| kenney_skyscraper_b/d/e | commercial | on disk |
| kenney_midrise_a/c | commercial | on disk |
| kenney_palm_tall / kenney_palm_bend | nature | on disk (vertex-coloured) |
| kenney_cactus_tall | nature | on disk |
| kenney_bush | nature | on disk |
| kenney_sedan / sedan_sports / taxi / suv / suv_luxury / van / hatchback | car | on disk |
| kenney_police / ambulance / firetruck / garbage_truck / delivery / truck | car | on disk |

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
| fire_hydrant | street corners |
| metal_trash_can | sidewalks / alleys |
| exterior_aircon_unit | rooftop / alley AC |
| wooden_crate_02 | dock / alley stacks |
| Barrel_01, Barrel_02 | metal / plastic barrels |
| wooden_barrels_01 | dock stacks |
| wooden_picnic_table | park / beach picnic |
| modular_street_seating | sidewalk benches |
| covered_car | alley / lot parked car |
| old_tyre | alley clutter |
| utility_box_01 | sidewalk electrical boxes |
| concrete_road_barrier | construction / median |
| outdoor_table_chair_set_01 | cafe patio |
| planter_box_01 | promenade planters |
| ocean_buoy | bay / marina markers |
| security_camera_01 | building corners |
| CoffeeCart_01 | boardwalk vendor |

bicycle, satellite, generic palm/car/hydrant/bench/trash slugs 404 on api.polyhaven.com — skipped.

threejsassets.com Vice Beach GLBs need a signed-in download — not fetched.
