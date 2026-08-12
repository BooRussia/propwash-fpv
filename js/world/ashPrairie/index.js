// ============================================================
// PropWash FPV — Ash Prairie map (assembled)
// Decommissioned Great Plains nuclear yard + grain co-op.
// Dual-scale: true 5" industrial landmarks + whoop pipe/duct clutter.
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
import { buildRailCanal } from './landmarks/railCanal.js';
import { buildCoop } from './landmarks/coop.js';
import { buildSiloLF } from './landmarks/silo.js';

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
  buildPipeRacks(ctx);
  buildConveyor(ctx);
  buildRailCanal(ctx);
  buildCoop(ctx);
  buildSiloLF(ctx);

  const { spawnPos, gates, retrievalPoints } = buildPoints(ctx);

  let time = 0;
  let lastNightF = -1;
  const applyDayNight = () => {
    const tod = settings.environment.timeOfDay;
    const dayF = Math.sin(Math.PI * clamp((tod - 6.2) / 13.2, 0, 1));
    const nightF = clamp(1 - dayF * 2.1, 0, 1);
    if (Math.abs(nightF - lastNightF) < 0.006) return;
    lastNightF = nightF;
    // Soft pad glow only — no neon
    if (mats.pad) mats.pad.emissiveIntensity = 0.25 + 0.45 * (1 - nightF) + 0.2 * nightF;
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
        water.material.uniforms.sunColor.value.setScalar(dayF * 0.85);
        water.material.uniforms.waterColor.value.setHex(0x2C3538).multiplyScalar(0.2 + 0.8 * dayF);
      }
    },
    dispose(sceneRef) {
      sceneRef.remove(root);
      for (const d of disposables) { try { d.dispose?.(); } catch (e) { /* noop */ } }
    },
  };
}
