// Miami prop catalog — source of truth for later hash01 scatter.
// JSON lives at assets/catalog/miami-props.json so modelers can iterate
// one item at a time without restacking kenneyDressing.js.
// Does not draw rng/rng2/rng3/rng4.

export const CATALOG_URL = 'assets/catalog/miami-props.json';

export function parseCatalog(data) {
  if (!data || data.version !== 1 || !Array.isArray(data.sections)) {
    throw new Error('miami-props catalog v1 required');
  }
  return data;
}

export function allItems(catalog) {
  const out = [];
  for (const s of catalog.sections) {
    for (const it of s.items) out.push({ section: s.id, ...it });
  }
  return out;
}

export function sectionById(catalog, id) {
  return catalog.sections.find((s) => s.id === id) || null;
}

export function itemsByStatus(catalog, status) {
  return allItems(catalog).filter((it) => it.status === status);
}

export function itemsByBand(catalog, band) {
  return allItems(catalog).filter((it) => {
    const p = it.place || {};
    return p.band === band || p.also === band;
  });
}

export function catalogStats(catalog) {
  const items = allItems(catalog);
  const byStatus = {};
  const bySection = {};
  for (const it of items) {
    byStatus[it.status] = (byStatus[it.status] || 0) + 1;
    bySection[it.section] = (bySection[it.section] || 0) + 1;
  }
  return {
    sections: catalog.sections.length,
    items: items.length,
    missing: byStatus.missing || 0,
    onDisk: byStatus['on-disk'] || 0,
    inEngine: byStatus['in-engine'] || 0,
    approved: byStatus.approved || 0,
    byStatus,
    bySection,
  };
}

/** Tint a MeshStandardMaterial from a catalog skin. Caller owns the clone. */
export function applyCatalogSkin(mat, catalog, skinId) {
  const skin = catalog.skins && catalog.skins[skinId];
  if (!mat || !skin) return mat;
  if (skin.tint) mat.color.set(skin.tint);
  if (skin.roughness != null) mat.roughness = skin.roughness;
  if (skin.metalness != null) mat.metalness = skin.metalness;
  if (skin.emissiveHex) mat.emissive.set(skin.emissiveHex);
  if (skin.emissive != null) mat.emissiveIntensity = skin.emissive;
  return mat;
}
