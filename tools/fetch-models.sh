#!/usr/bin/env bash
# PropWash FPV — extra CC0 models (macOS/Linux).
# Poly Haven 1k glTF + Kenney City/Nature kit GLBs.
# Run: bash tools/fetch-models.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ASSETS="$ROOT/assets/models"
VENDOR="$ROOT/assets/vendor/kenney"
TMP="${TMPDIR:-/tmp}/pw-models-fetch"
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
mkdir -p "$ASSETS" "$VENDOR" "$TMP"

get_file() {
  local url="$1" dest="$2"
  if [[ -f "$dest" ]]; then
    echo "skip (exists): $(basename "$dest")"
    return 0
  fi
  mkdir -p "$(dirname "$dest")"
  echo "GET $url"
  curl -fL --retry 3 --retry-delay 2 -A "$UA" -o "$dest" "$url"
}

# ---------------- Poly Haven models (1k glTF + includes) ----------------
ph_model() {
  local slug="$1"
  local dest="$ASSETS/$slug/${slug}.gltf"
  if [[ -f "$dest" ]]; then
    echo "skip (exists): $slug"
    return 0
  fi
  python3 - "$slug" "$ASSETS" "$UA" <<'PY'
import json, os, sys, urllib.request
slug, assets, ua = sys.argv[1], sys.argv[2], sys.argv[3]
req = urllib.request.Request(
    'https://api.polyhaven.com/files/' + slug,
    headers={'User-Agent': ua, 'Accept': 'application/json'})
with urllib.request.urlopen(req, timeout=60) as r:
    files = json.load(r)
g = files.get('gltf', {}).get('1k', {}).get('gltf')
if not g:
    raise SystemExit('no 1k gltf for ' + slug)
out_dir = os.path.join(assets, slug)
os.makedirs(out_dir, exist_ok=True)

def fetch(url, dest):
    if os.path.isfile(dest):
        print('skip (exists):', os.path.basename(dest))
        return
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    print('GET', url)
    req = urllib.request.Request(url, headers={'User-Agent': ua})
    with urllib.request.urlopen(req, timeout=180) as r, open(dest, 'wb') as w:
        w.write(r.read())

fetch(g['url'], os.path.join(out_dir, slug + '.gltf'))
for name, node in (g.get('include') or {}).items():
    fetch(node['url'], os.path.join(out_dir, name.replace('/', os.sep)))
print('ok', slug)
PY
}

for slug in \
  potted_plant_02 \
  potted_plant_04 \
  plastic_monobloc_chair_01 \
  shrub_04 \
  lambis_shell \
  fire_hydrant \
  metal_trash_can \
  exterior_aircon_unit \
  wooden_crate_02 \
  Barrel_01 \
  Barrel_02 \
  wooden_barrels_01 \
  wooden_picnic_table \
  modular_street_seating \
  covered_car \
  old_tyre \
  utility_box_01 \
  concrete_road_barrier \
  outdoor_table_chair_set_01 \
  planter_box_01 \
  ocean_buoy \
  security_camera_01 \
  CoffeeCart_01
do
  ph_model "$slug"
done

# ---------------- Kenney City / Nature / Car kits (CC0 zip, public URLs) ----------------
KENNEY_ZIPS=(
  "suburban|https://kenney.nl/media/pages/assets/city-kit-suburban/2c871b7af2-1745479373/kenney_city-kit-suburban_20.zip"
  "commercial|https://kenney.nl/media/pages/assets/city-kit-commercial/a742d900eb-1753115042/kenney_city-kit-commercial_2.1.zip"
  "roads|https://kenney.nl/media/pages/assets/city-kit-roads/74288c9459-1787042796/kenney_city-kit-roads.zip"
  "nature|https://kenney.nl/media/pages/assets/nature-kit/37ac38a37b-1677698939/kenney_nature-kit.zip"
  "car|https://kenney.nl/media/pages/assets/car-kit/1a312ec241-1775131960/kenney_car-kit.zip"
)

for spec in "${KENNEY_ZIPS[@]}"; do
  name="${spec%%|*}"
  url="${spec#*|}"
  zip="$TMP/kenney_${name}.zip"
  get_file "$url" "$zip"
  if [[ ! -d "$TMP/kenney_$name" ]]; then
    mkdir -p "$TMP/kenney_$name"
    unzip -q -o "$zip" -d "$TMP/kenney_$name"
  fi
done

copy_kenney_glb() {
  local slug="$1" src="$2" colormap="$3"
  local dest_dir="$ASSETS/$slug"
  local dest="$dest_dir/${slug}.glb"
  if [[ -f "$dest" ]]; then
    echo "skip (exists): $slug"
    return 0
  fi
  mkdir -p "$dest_dir"
  cp "$src" "$dest"
  if [[ -n "$colormap" && -f "$colormap" ]]; then
    mkdir -p "$dest_dir/Textures"
    cp "$colormap" "$dest_dir/Textures/colormap.png"
  fi
  echo "copied $slug"
}

SUB="$TMP/kenney_suburban/Models/GLB format"
COM="$TMP/kenney_commercial/Models/GLB format"
ROAD="$TMP/kenney_roads/Models/GLB format"
NAT="$TMP/kenney_nature/Models/GLTF format"
CAR="$TMP/kenney_car/Models/GLB format"

copy_kenney_glb dumpster "$ROAD/dumpster.glb" "$ROAD/Textures/colormap.png"
copy_kenney_glb traffic_cone "$ROAD/construction-cone.glb" "$ROAD/Textures/colormap.png"
copy_kenney_glb street_light "$ROAD/light-curved.glb" "$ROAD/Textures/colormap.png"
copy_kenney_glb street_light_square "$ROAD/light-square.glb" "$ROAD/Textures/colormap.png"
copy_kenney_glb traffic_light "$ROAD/traffic-light-object-vertical.glb" "$ROAD/Textures/colormap.png"
copy_kenney_glb stop_sign "$ROAD/road-sign-object-stop.glb" "$ROAD/Textures/colormap.png"
copy_kenney_glb planter "$SUB/planter.glb" "$SUB/Textures/colormap.png"
copy_kenney_glb fence_low "$SUB/fence-low.glb" "$SUB/Textures/colormap.png"
copy_kenney_glb parasol_a "$COM/detail-parasol-a.glb" "$COM/Textures/colormap.png"
copy_kenney_glb awning "$COM/detail-awning.glb" "$COM/Textures/colormap.png"
copy_kenney_glb kenney_skyscraper_a "$COM/building-skyscraper-a.glb" "$COM/Textures/colormap.png"
copy_kenney_glb kenney_skyscraper_c "$COM/building-skyscraper-c.glb" "$COM/Textures/colormap.png"
copy_kenney_glb kenney_midrise_e "$COM/building-e.glb" "$COM/Textures/colormap.png"
copy_kenney_glb kenney_house_a "$SUB/building-type-a.glb" "$SUB/Textures/colormap.png"
copy_kenney_glb kenney_cactus "$NAT/cactus_short.glb" ""
copy_kenney_glb kenney_palm "$NAT/tree_palmDetailedShort.glb" ""

# Extra City Kit Roads street dressing (skip tiled road meshes — another agent owns roads)
copy_kenney_glb construction_barrier "$ROAD/construction-barrier.glb" "$ROAD/Textures/colormap.png"
copy_kenney_glb construction_fence "$ROAD/construction-fence.glb" "$ROAD/Textures/colormap.png"
copy_kenney_glb construction_light "$ROAD/construction-light.glb" "$ROAD/Textures/colormap.png"
copy_kenney_glb electricity_pole "$ROAD/electricity-pole.glb" "$ROAD/Textures/colormap.png"
copy_kenney_glb street_sign "$ROAD/road-sign-object-street.glb" "$ROAD/Textures/colormap.png"
copy_kenney_glb warning_sign "$ROAD/road-sign-object-warning.glb" "$ROAD/Textures/colormap.png"
copy_kenney_glb traffic_light_horizontal "$ROAD/traffic-light-object-horizontal.glb" "$ROAD/Textures/colormap.png"
copy_kenney_glb highway_sign "$ROAD/sign-highway.glb" "$ROAD/Textures/colormap.png"
copy_kenney_glb street_light_double "$ROAD/light-curved-double.glb" "$ROAD/Textures/colormap.png"

# Extra suburban houses / fence / trees
copy_kenney_glb fence "$SUB/fence.glb" "$SUB/Textures/colormap.png"
copy_kenney_glb kenney_tree_large "$SUB/tree-large.glb" "$SUB/Textures/colormap.png"
copy_kenney_glb kenney_tree_small "$SUB/tree-small.glb" "$SUB/Textures/colormap.png"
copy_kenney_glb kenney_house_b "$SUB/building-type-b.glb" "$SUB/Textures/colormap.png"
copy_kenney_glb kenney_house_c "$SUB/building-type-c.glb" "$SUB/Textures/colormap.png"
copy_kenney_glb kenney_house_d "$SUB/building-type-d.glb" "$SUB/Textures/colormap.png"

# Extra commercial awnings / parasols / skyline
copy_kenney_glb awning_wide "$COM/detail-awning-wide.glb" "$COM/Textures/colormap.png"
copy_kenney_glb overhang "$COM/detail-overhang.glb" "$COM/Textures/colormap.png"
copy_kenney_glb parasol_b "$COM/detail-parasol-b.glb" "$COM/Textures/colormap.png"
copy_kenney_glb kenney_skyscraper_b "$COM/building-skyscraper-b.glb" "$COM/Textures/colormap.png"
copy_kenney_glb kenney_skyscraper_d "$COM/building-skyscraper-d.glb" "$COM/Textures/colormap.png"
copy_kenney_glb kenney_skyscraper_e "$COM/building-skyscraper-e.glb" "$COM/Textures/colormap.png"
copy_kenney_glb kenney_midrise_a "$COM/building-a.glb" "$COM/Textures/colormap.png"
copy_kenney_glb kenney_midrise_c "$COM/building-c.glb" "$COM/Textures/colormap.png"

# Extra nature palms / cactus / bush (vertex-coloured, no atlas)
copy_kenney_glb kenney_palm_tall "$NAT/tree_palmDetailedTall.glb" ""
copy_kenney_glb kenney_palm_bend "$NAT/tree_palmBend.glb" ""
copy_kenney_glb kenney_cactus_tall "$NAT/cactus_tall.glb" ""
copy_kenney_glb kenney_bush "$NAT/plant_bushDetailed.glb" ""

# Car Kit street vehicles (colormap atlas, same as City Kits)
copy_kenney_glb kenney_sedan "$CAR/sedan.glb" "$CAR/Textures/colormap.png"
copy_kenney_glb kenney_sedan_sports "$CAR/sedan-sports.glb" "$CAR/Textures/colormap.png"
copy_kenney_glb kenney_taxi "$CAR/taxi.glb" "$CAR/Textures/colormap.png"
copy_kenney_glb kenney_suv "$CAR/suv.glb" "$CAR/Textures/colormap.png"
copy_kenney_glb kenney_suv_luxury "$CAR/suv-luxury.glb" "$CAR/Textures/colormap.png"
copy_kenney_glb kenney_van "$CAR/van.glb" "$CAR/Textures/colormap.png"
copy_kenney_glb kenney_hatchback "$CAR/hatchback-sports.glb" "$CAR/Textures/colormap.png"
copy_kenney_glb kenney_police "$CAR/police.glb" "$CAR/Textures/colormap.png"
copy_kenney_glb kenney_ambulance "$CAR/ambulance.glb" "$CAR/Textures/colormap.png"
copy_kenney_glb kenney_firetruck "$CAR/firetruck.glb" "$CAR/Textures/colormap.png"
copy_kenney_glb kenney_garbage_truck "$CAR/garbage-truck.glb" "$CAR/Textures/colormap.png"
copy_kenney_glb kenney_delivery "$CAR/delivery.glb" "$CAR/Textures/colormap.png"
copy_kenney_glb kenney_truck "$CAR/truck.glb" "$CAR/Textures/colormap.png"

cp -f "$TMP/kenney_suburban/License.txt" "$VENDOR/License-suburban.txt"
cp -f "$TMP/kenney_commercial/License.txt" "$VENDOR/License-commercial.txt"
cp -f "$TMP/kenney_roads/License.txt" "$VENDOR/License-roads.txt"
cp -f "$TMP/kenney_nature/License.txt" "$VENDOR/License-nature.txt"
cp -f "$TMP/kenney_car/License.txt" "$VENDOR/License-car.txt"

echo "DONE. models:"
du -sh "$ASSETS"/* | sort
