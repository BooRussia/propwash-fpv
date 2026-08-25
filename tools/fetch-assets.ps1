# ============================================================
# PropWash FPV - asset fetcher (CC0 sources, direct downloads)
# Poly Haven textures/models/HDRIs + ambientCG texture zips.
# Run: powershell -NoProfile -ExecutionPolicy Bypass -File tools\fetch-assets.ps1
# ============================================================
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$assets = Join-Path $root 'assets'
$tmp = Join-Path $env:TEMP 'pw-asset-tmp'
New-Item -ItemType Directory -Force $assets, (Join-Path $assets 'textures'), (Join-Path $assets 'models'), (Join-Path $assets 'hdri'), $tmp | Out-Null

function Get-File($url, $dest) {
  if (Test-Path $dest) { Write-Output ("skip (exists): " + (Split-Path -Leaf $dest)); return }
  $d = Split-Path -Parent $dest
  New-Item -ItemType Directory -Force $d | Out-Null
  Write-Output ("GET " + $url)
  Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing -TimeoutSec 300
}

# ---------------- Poly Haven textures ----------------
# name = local key, slug = polyhaven id, res = 1k/2k
$phTextures = @(
  @{ key='sand_beach';    slug='aerial_beach_01';   res='2k' },
  @{ key='sand_wet';      slug='coast_sand_01';     res='1k' },
  @{ key='grass_wild';    slug='sparse_grass';      res='1k' },
  @{ key='rock_cliff';    slug='rock_face';         res='1k' },
  @{ key='rock_macro';    slug='aerial_rocks_02';   res='2k' },
  @{ key='snow';          slug='snow_02';           res='1k' },
  @{ key='forest_floor';  slug='forest_leaves_03';  res='1k' },
  @{ key='gravel';        slug='gravel_road';       res='1k' }
)

foreach ($t in $phTextures) {
  $f = Invoke-RestMethod ("https://api.polyhaven.com/files/" + $t.slug)
  $dir = Join-Path $assets ("textures\" + $t.key)
  $maps = @(
    @{ out='albedo.jpg'; keys=@('Diffuse','diff') },
    @{ out='normal.jpg'; keys=@('nor_gl') },
    @{ out='rough.jpg';  keys=@('Rough','rough') },
    @{ out='ao.jpg';     keys=@('AO','ao') }
  )
  foreach ($m in $maps) {
    $node = $null
    foreach ($k in $m.keys) {
      $p = $f.PSObject.Properties[$k]
      if ($p) { $node = $p.Value; break }
    }
    if (-not $node) { continue }
    $resNode = $node.PSObject.Properties[$t.res]
    if (-not $resNode) { $resNode = $node.PSObject.Properties['1k'] }
    if (-not $resNode) { continue }
    $jpg = $resNode.Value.PSObject.Properties['jpg']
    if (-not $jpg) { continue }
    Get-File $jpg.Value.url (Join-Path $dir $m.out)
  }
}

# ---------------- Poly Haven HDRIs (2k .hdr) ----------------
$phHdris = @(
  @{ key='beach_day';    slug='spiaggia_di_mondello' },
  @{ key='sunset';       slug='venice_sunset' },
  @{ key='night';        slug='satara_night' },
  @{ key='day_clear';    slug='qwantani_puresky' },
  @{ key='overcast';     slug='kloofendal_overcast_puresky' }
)
foreach ($h in $phHdris) {
  $f = Invoke-RestMethod ("https://api.polyhaven.com/files/" + $h.slug)
  $u = $f.hdri.'2k'.hdr.url
  Get-File $u (Join-Path $assets ("hdri\" + $h.key + "_2k.hdr"))
}

# ---------------- Poly Haven models (gltf + includes) ----------------
$phModels = @('boulder_01','rock_face_01','rock_07','namaqualand_boulder_04','moon_rock_02',
              'quiver_tree_02','tree_stump_01','shrub_02','shrub_03','fern_02','anthurium_botany_01',
              'potted_plant_02','potted_plant_04','plastic_monobloc_chair_01','shrub_04','lambis_shell')
foreach ($slug in $phModels) {
  $f = Invoke-RestMethod ("https://api.polyhaven.com/files/" + $slug)
  $g = $f.gltf.'1k'.gltf
  $dir = Join-Path $assets ("models\" + $slug)
  Get-File $g.url (Join-Path $dir ($slug + ".gltf"))
  $g.include.PSObject.Properties | ForEach-Object {
    Get-File $_.Value.url (Join-Path $dir ($_.Name -replace '/', '\'))
  }
}

# ---------------- ambientCG texture zips (1K JPG) ----------------
$acg = @(
  @{ key='asphalt';    id='Asphalt031' },
  @{ key='sidewalk';   id='PavingStones128' },
  @{ key='road_lines'; id='RoadLines019A' },
  @{ key='grass_lawn'; id='Grass001' },
  @{ key='sand_dunes'; id='Ground097' },
  @{ key='facade_glass'; id='Facade016' },      # night curtain wall (lit windows)
  @{ key='facade_glass_day'; id='Facade006' },  # DAYTIME blue-grey glass curtain wall
  @{ key='facade_office'; id='Facade020A' },    # daytime mid-rise brick/window
  @{ key='facade_day';   id='Facade001' },
  @{ key='bark_palm';    id='Bark012' }
)
foreach ($a in $acg) {
  $dir = Join-Path $assets ("textures\" + $a.key)
  if (Test-Path (Join-Path $dir 'albedo.jpg')) { Write-Output ("skip (exists): " + $a.key); continue }
  $zip = Join-Path $tmp ($a.id + ".zip")
  try {
    Get-File ("https://ambientcg.com/get?file=" + $a.id + "_1K-JPG.zip") $zip
  } catch { Write-Output ("MISS: " + $a.id + " (" + $_.Exception.Message + ")"); continue }
  $ext = Join-Path $tmp $a.id
  if (Test-Path $ext) { Remove-Item -Recurse -Force $ext }
  Expand-Archive $zip $ext
  New-Item -ItemType Directory -Force $dir | Out-Null
  $files = Get-ChildItem $ext -Recurse -File
  foreach ($fl in $files) {
    $n = $fl.Name
    if ($n -match '_Color\.') { Copy-Item $fl.FullName (Join-Path $dir 'albedo.jpg') -Force }
    elseif ($n -match '_NormalGL\.') { Copy-Item $fl.FullName (Join-Path $dir 'normal.jpg') -Force }
    elseif ($n -match '_Roughness\.') { Copy-Item $fl.FullName (Join-Path $dir 'rough.jpg') -Force }
    elseif ($n -match '_AmbientOcclusion\.') { Copy-Item $fl.FullName (Join-Path $dir 'ao.jpg') -Force }
    elseif ($n -match '_Opacity\.') { Copy-Item $fl.FullName (Join-Path $dir 'opacity.jpg') -Force }
    elseif ($n -match '_Emission\.') { Copy-Item $fl.FullName (Join-Path $dir 'emissive.jpg') -Force }
  }
}

# ---------------- three.js example water normals (local copy) ----------------
Get-File "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/textures/waternormals.jpg" (Join-Path $assets "textures\waternormals.jpg")

# ---------------- report ----------------
$total = (Get-ChildItem $assets -Recurse -File | Measure-Object -Property Length -Sum).Sum
Write-Output ("DONE. assets total: {0:N1} MB" -f ($total/1MB))
Get-ChildItem $assets -Directory | ForEach-Object {
  $s = (Get-ChildItem $_.FullName -Recurse -File | Measure-Object -Property Length -Sum).Sum
  Write-Output ("  {0}: {1:N1} MB" -f $_.Name, ($s/1MB))
}
