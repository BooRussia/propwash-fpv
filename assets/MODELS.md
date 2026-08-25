# PropWash models

## Kenney CC0 (City Kit Suburban / Commercial / Roads)

Downloaded from kenney.nl. Creative Commons CC0. License copies in `assets/vendor/kenney/`.

Each GLB uses Kenney's authored `Textures/colormap.png` (walls, roof, trim are separate atlas regions — not a window photo wrapped onto a box).

| slug | kit | use |
|---|---|---|
| dumpster | roads | alley / landward sidewalk |
| traffic_cone | roads | (on disk, not yet scattered) |
| street_light | roads | both sidewalks |
| street_light_square | roads | on disk |
| traffic_light | roads | on disk |
| stop_sign | roads | Ocean Drive gaps |
| planter | suburban | promenade |
| fence_low | suburban | on disk |
| parasol_a | commercial | on disk |
| awning | commercial | on disk |
| kenney_skyscraper_a/c | commercial | far skyline z>640 |
| kenney_midrise_e | commercial | far skyline |
| kenney_house_a | suburban | on disk |

threejsassets.com Vice Beach GLBs need a signed-in download — not fetched.

Poly Haven plants/rocks stay in `assets/models/<slug>/<slug>.gltf` via `tools/fetch-assets.ps1`.
