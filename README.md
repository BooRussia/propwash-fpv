# PropWash FPV — Browser Drone Simulator

A Liftoff-style FPV drone simulator that runs entirely in your browser using three.js.
Realistic per-drone flight physics, real radio (USB gamepad) support with full calibration,
Miami Skyline + procedural maps, racing / retrieval / freestyle modes, day/night, wind & rain.

## Running it

No installs needed. From PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\serve.ps1
```

Then open **http://localhost:8971/** in a Chromium browser (Chrome/Edge recommended).
An internet connection is needed on first load (three.js comes from the jsDelivr CDN).

## Drones

| Drone | Class | Props | Battery | AUW | TWR |
|---|---|---|---|---|---|
| BetaFPV Meteor75 Pro | Tiny whoop | 1.6" | 1S | ~34 g | ~2.8 |
| GEPRC Cinebot30 | 3" cinewhoop | 3" | 4S | ~410 g | ~3.7 |
| iFlight Nazgul5 V3 | 5" freestyle | 5" | 6S | ~640 g | ~8 |

Each drone uses its real mass, thrust, inertia, motor spool time and drag profile — the
whoop gets shoved around by wind and sags on punch-outs; the 5" rips.

## Radio

Plug your radio in via USB in **joystick/HID mode** (EdgeTX/OpenTX: plug USB → "USB Joystick").
Then: **ESC → Controller → Calibrate radio**. The wizard captures centers, ranges, channel
order and direction; the **Fine-tune** panel handles stick drift (trims, deadband, invert,
"set current as center").

No radio? Keyboard fallback: **I/K** throttle, **W/S** pitch, **A/D** roll, **J/L** yaw.

## Keys

| Key | Action |
|---|---|
| ESC | Menu (maps, modes, rates, controller, environment, graphics) |
| Space | Arm / disarm |
| R | Reset drone |
| V | FPV ↔ line-of-sight view |
| C | Camera static overlay on/off (analog/digital in menu) |
| ↑ / ↓ | FPV camera tilt |
| ← / → | FPV camera FOV |

## Performance

ESC → Graphics: quality presets, render distance (also sizes procedural maps),
render scale, bloom, shadows. Quality auto-detects your GPU on first run.
