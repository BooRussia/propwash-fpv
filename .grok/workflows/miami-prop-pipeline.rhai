let meta = #{
    name: "miami-prop-pipeline",
    description: "Model then review Miami catalog props one section at a time",
    phases: [
        #{ title: "Model", detail: "one modeler per placement section" },
        #{ title: "Review", detail: "one reviewer per section approves wraps" },
    ],
    when_to_use: "Fill Miami sidewalks and city dressing from assets/catalog/miami-props.json",
};

let known = [
    "sidewalk-furniture",
    "traffic-control",
    "utilities-power",
    "fence-rail",
    "stairs-entry",
    "planting-landscape",
    "building-dressing",
    "beach-boardwalk",
    "alley-lot-marina",
];

let want = "all";
if (args != () && args.section != ()) { want = args.section; }

let sections = [];
if (want == "all") {
    for s in known { sections.push(s); }
} else {
    let hit = false;
    for s in known {
        if (s == want) { hit = true; }
    }
    if (!hit) { pause("verification", "args.section must be all or a catalog section id"); }
    sections.push(want);
}

fn modeler_prompt(section) {
    let p = "You are the Miami prop MODELER for catalog section `";
    p += section;
    p += "`. Repo: /Users/neyjohns/Documents/Claude/propwash-fpv. ";
    p += "Read assets/catalog/miami-props.json and js/world/miami/propCatalog.js first. ";
    p += "Work ONLY items whose section id is ";
    p += section;
    p += ". For each item one by one: ";
    p += "(1) if status is on-disk or in-engine, leave geometry unless sixSides is a lie; ";
    p += "(2) if source is download and files are missing, fetch CC0 via tools/fetch-models.sh or Poly Haven 1k glTF, put colormap.png beside Kenney GLBs, add MODEL_KEYS; ";
    p += "(3) if source is author and status is missing, write a 6-sided vertex-colour builder in js/world/miami/props/";
    p += section;
    p += ".js using cBox/cCyl from geo.js (origin at ground, mergeGeometries). Never wrap a window atlas onto +Y. ";
    p += "(4) Do not call rng/rng2/rng3/rng4. hash01 only. ";
    p += "(5) Do not edit buildings.js addTower rng loops, vehicles.js, bayWater.js, or constants ROAD_* . ";
    p += "(6) After each item, set its catalog status to needs-wrap and note file path. ";
    p += "Write a short report to assets/catalog/reviews/";
    p += section;
    p += "-model.md listing built ids. Use tools. Finish only after walking every missing/author item in the section.";
    return p;
}

fn reviewer_prompt(section) {
    let p = "You are the Miami prop REVIEWER for catalog section `";
    p += section;
    p += "`. Repo: /Users/neyjohns/Documents/Claude/propwash-fpv. ";
    p += "Read assets/catalog/miami-props.json, the modeler report assets/catalog/reviews/";
    p += section;
    p += "-model.md if it exists, and every file the modeler touched. ";
    p += "Approve an item only if: six sides are described, no window texture on roofs/lids, collider matches the visual, wrap.kind is vertex-color or colormap or pbr, and skins listed exist in catalog.skins. ";
    p += "For each approved item, write wrap notes (UV origin, atlas region or vertex palette hexes, night emissive). Set status to approved. Reject with a one-line reason otherwise. ";
    p += "Do not consume rng streams. Do not restack kenneyDressing placement except to scatter a newly approved slug with hash01. ";
    p += "Write assets/catalog/reviews/";
    p += section;
    p += "-review.md. Use tools; do not approve from memory.";
    return p;
}

phase("Model");
let mjobs = [];
for s in sections {
    mjobs.push(#{
        prompt: modeler_prompt(s),
        label: "model:" + s,
        capability_mode: "all",
    });
}
let modeled = parallel(mjobs);
let modeled_ok = 0;
for r in modeled {
    if (r != () && r.success) { modeled_ok += 1; }
}
log(modeled_ok.to_string() + "/" + sections.len().to_string() + " modelers finished");

phase("Review");
let rjobs = [];
for s in sections {
    rjobs.push(#{
        prompt: reviewer_prompt(s),
        label: "review:" + s,
        capability_mode: "all",
    });
}
let reviewed = parallel(rjobs);
let review_ok = 0;
for r in reviewed {
    if (r != () && r.success) { review_ok += 1; }
}
log(review_ok.to_string() + "/" + sections.len().to_string() + " reviewers finished");

complete(#{
    sections: sections.len(),
    modeled: modeled_ok,
    reviewed: review_ok,
});
