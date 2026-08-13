// ============================================================
// PropWash FPV — Ash Prairie map (assembled)
// Decommissioned Great Plains nuclear yard + grain co-op.
// Dual-scale: true 5" industrial landmarks + whoop pipe/duct clutter.
// v2: mezz / admin / antenna farm / night lights / accents + fidelity mats.
// ============================================================
import * as THREE from 'three';
import { settings, clamp } from '../../core/state.js';

import { groundHeight } from './constants.js';
import { mulberry32 } from './rng.js';
import { createColliderBag } from './colliders.js';
import { buildMaterials } from './textures.js';
import { buildGround, buildWater } from './terrain.js';
import { buildPoints } from './points.js';
import { buildCoolingTowers } from './landmarks/coolingTowers.js';
import { buildContainment } from './landmarks/containment.js';
import { buildGrainElevators } from './landmarks/grainElevators.js';
import { buildPipeRacks } from './landmarks/pipeRacks.js';
import { buildConveyor } from './landmarks/conveyor.js';
import { buildSwitchyard } from './landmarks/switchyard.js';
import { buildTurbineMezz } from './landmarks/turbineMezz.js';
import { buildRailCanal } from './landmarks/railCanal.js';
import { buildCoop } from './landmarks/coop.js';
import { buildSiloLF } from './landmarks/silo.js';
import { buildAdmin } from './landmarks/admin.js';
import { buildAntennaFarm } from './landmarks/antennaFarm.js';
import { buildNightLights } from './landmarks/nightLights.js';
import { buildAccents } from './landmarks/accents.js';
import { buildRuins } from './landmarks/ruins.js';

export async function buildAshPrairie(scene, env) {
  const rng = mulberry32(0xA5B04A1E);
  const rng2 = mulberry32(0xA5BD2E55);
  const root = new THREE.Group();
  root.name = 'ashPrairie';
  scene.add(root);

  const disposables = [];
  const track = (obj) => { disposables.push(obj); return obj; };
  const { colliders, addCollider } = createColliderBag();

  // Late golden-hour HDRI bands (sunset feel; day_clear for noon)
  if (env.setHDRIBands) {
    env.setHDRIBands({ day: 'day_clear', sunset: 'sunset', night: 'night', overcast: 'overcast' });
  }
  // Soft prairie haze — Environment has no setFog; shorten render distance slightly
  // so distance fog reads as warm basin air without killing tower silhouettes.
  if (typeof env.setRenderDistance === 'function') {
    env.setRenderDistance(1250);
  }
  if (env._fogBase && env._fogBase.isColor) {
    // Hint warm dust haze; _applyAtmosphere still owns band colors each frame.
    env._fogBase.lerp(new THREE.Color(0xb8a890), 0.25);
  }

  const mats = await buildMaterials(track);

  const ctx = {
    root, track, addCollider, colliders, rng, rng2, mats,
  };

  // Terrain
  await buildGround(ctx);
  const { water } = await buildWater(ctx);

  // Landmarks — hierarchy: towers → containment → elevators → turbine/yard → racks → co-op
  buildCoolingTowers(ctx);
  buildContainment(ctx);
  buildGrainElevators(ctx);
  buildSwitchyard(ctx);
  buildTurbineMezz(ctx); // AFTER switchyard — whoop mezz inside hall shell
  buildPipeRacks(ctx);
  buildConveyor(ctx);
  buildRailCanal(ctx);
  buildCoop(ctx);
  buildSiloLF(ctx);
  // v2 additive clusters
  buildAdmin(ctx);
  buildAntennaFarm(ctx);
  buildNightLights(ctx);
  buildAccents(ctx);
  buildRuins(ctx);

  const { spawnPos, gates, retrievalPoints } = buildPoints(ctx);

  let time = 0;
  let lastNightF = -1;
  const applyDayNight = () => {
    const tod = settings.environment.timeOfDay;
    const dayF = Math.sin(Math.PI * clamp((tod - 6.2) / 13.2, 0, 1));
    const nightF = clamp(1 - dayF * 2.1, 0, 1);
    if (Math.abs(nightF - lastNightF) < 0.006) return;
    lastNightF = nightF;
    const lit = nightF > 0.35;
    // Soft pad glow — night emissive ≤ 0.35 (Desi polish)
    if (mats.pad) {
      mats.pad.emissiveIntensity = lit
        ? Math.min(0.35, 0.12 + 0.23 * nightF)
        : 0.35 + 0.35 * (1 - nightF);
    }
    // Tiny bulb emissives (PointLights carry the real illumination)
    if (mats.nightEmit) {
      for (const m of mats.nightEmit) {
        m.emissiveIntensity = lit ? 0.6 + 0.5 * nightF : 0;
      }
    }
    if (mats.nightPointLights) {
      for (const entry of mats.nightPointLights) {
        entry.light.intensity = lit ? entry.baseIntensity * nightF : 0;
      }
    }
    // Slightly denser gray-brown fog at night if Environment exposes _fogBase
    if (env._fogBase && env._fogBase.isColor) {
      const warm = new THREE.Color(0xb8a890);
      const nightDust = new THREE.Color(0x6a6358);
      env._fogBase.copy(warm).lerp(nightDust, lit ? 0.35 * nightF : 0);
    }
  };
  applyDayNight();

  return {
    name: 'Ash Prairie',
    spawn: { position: spawnPos, yawRad: Math.PI }, // face -Z toward the yard silhouette
    getGroundHeight: groundHeight,
    colliders,
    gates,
    retrievalPoints,
    homePad: spawnPos.clone(),
    update(dt) {
      time += dt;
      applyDayNight();
      if (water && water.material && water.material.uniforms) {
        water.material.uniforms.time.value += dt * 0.35;
        const tod = settings.environment.timeOfDay;
        const dayF = Math.max(0.04, Math.sin(Math.PI * clamp((tod - 6.2) / 13.2, 0, 1)));
        // Stronger sun specular on basin at day; muted at dusk
        water.material.uniforms.sunColor.value.setRGB(
          dayF * 1.0, dayF * 0.9, dayF * 0.72
        );
        water.material.uniforms.waterColor.value.setHex(0x2C3538).multiplyScalar(0.18 + 0.82 * dayF);
      }
    },
    dispose(sceneRef) {
      sceneRef.remove(root);
      for (const d of disposables) { try { d.dispose?.(); } catch (e) { /* noop */ } }
    },
  };
}
