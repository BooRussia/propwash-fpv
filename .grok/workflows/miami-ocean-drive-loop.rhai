let meta = #{
    name: "miami-ocean-drive-loop",
    description: "Build, test, self-approve, and merge the next Ocean Drive FPV slice to main",
    phases: [
        #{ title: "Pick", detail: "read the living plan and choose the next slice" },
        #{ title: "Build", detail: "implement the slice without asking the user" },
        #{ title: "Verify", detail: "run tests and hunt travel-lane / leftoverLot collisions" },
        #{ title: "Merge", detail: "commit and push origin/main if green" },
    ],
    when_to_use: "Continuously flesh out Ocean Drive NPCs, landmarks, fly-throughs, then expand inland",
};

let pick_schema = #{
    "type": "object",
    "required": ["phase_id", "title", "files", "reason"],
    "properties": #{
        "phase_id": #{ "type": "string" },
        "title": #{ "type": "string" },
        "files": #{ "type": "array", "items": #{ "type": "string" } },
        "reason": #{ "type": "string" },
    },
};

let build_schema = #{
    "type": "object",
    "required": ["done", "summary", "files_touched"],
    "properties": #{
        "done": #{ "type": "boolean" },
        "summary": #{ "type": "string" },
        "files_touched": #{ "type": "array", "items": #{ "type": "string" } },
        "blocked": #{ "type": "string" },
    },
};

let verify_schema = #{
    "type": "object",
    "required": ["pass", "evidence"],
    "properties": #{
        "pass": #{ "type": "boolean" },
        "evidence": #{ "type": "string" },
        "failures": #{ "type": "array", "items": #{ "type": "string" } },
    },
};

let repo = "/Users/neyjohns/Documents/Claude/propwash-fpv";

phase("Pick");
let pick_prompt = "Repo: ";
pick_prompt += repo;
pick_prompt += ". Read assets/catalog/miami-build-plan.json with read_file. ";
pick_prompt += "Pick the first phase whose status is pending or in_progress. ";
pick_prompt += "If every phase is done, pick city-skyline or inland-5th and describe the next inland slice. ";
pick_prompt += "Do not invent ped.js or traffic.js. Do not touch leftoverLot A-H cells. ";
pick_prompt += "Return {phase_id, title, files, reason}. Use tools; do not answer from memory.";

let picked = agent(pick_prompt, #{
    label: "pick-next",
    capability_mode: "read-only",
    output_schema: pick_schema,
});

if (picked == () || !picked.success || picked.output.phase_id == ()) {
    complete(#{ summary: "pick failed closed", merged: false });
}

let phase_id = picked.output.phase_id;
let title = picked.output.title;
log("next slice: " + phase_id + " — " + title);

phase("Build");
let build_prompt = "You are the Ocean Drive FPV builder. Repo: ";
build_prompt += repo;
build_prompt += ". Implement phase `";
build_prompt += phase_id;
build_prompt += "` titled `";
build_prompt += title;
build_prompt += "`. Read assets/catalog/miami-build-plan.json, js/world/miami/index.js, js/world/miami/constants.js, and the files named in that phase. ";
build_prompt += "INVARIANTS: no ped.js/traffic.js (NPCs go in crowd.js); hash01 only (never rng/rng2/rng3/rng4); no ShaderMaterial in bayWater.js; travel lanes 40.2-47.8 stay empty of solids and NPC colliders; NPCs have no colliders; leftoverLot A-H cells (x>=251 z~84) must not slide; skyline backdrop stays 60 boxes; merge to main not a PR. ";
build_prompt += "Self-approve. Do not ask the user. Use tools. After implementing, set that phase status to in_progress in the plan JSON if you did work. ";
build_prompt += "Return {done, summary, files_touched, blocked}.";

let built = agent(build_prompt, #{
    label: "build-slice",
    capability_mode: "all",
    output_schema: build_schema,
});

if (built == () || !built.success) {
    complete(#{ summary: "build agent failed", phase_id: phase_id, merged: false });
}

phase("Verify");
let vjobs = [];
vjobs.push(#{
    prompt: "Repo: " + repo + ". Run these tests with the shell and paste the last line of each: node ./tools/run-miami-crowd-test.mjs ; node ./tools/run-vehicles-test.mjs ; node ./tools/run-miami-leftover-lot-test.mjs ; node ./tools/run-miami-rejects-test.mjs ; node ./tools/run-miami-site-plan-test.mjs . Set pass=true only if every command exits 0. Evidence must quote the ok lines. Fail closed if you did not run them.",
    label: "verify-core",
    capability_mode: "all",
    output_schema: verify_schema,
});
vjobs.push(#{
    prompt: "Repo: " + repo + ". Adversarial collision check for the slice just built (`" + phase_id + "`). Use grep/read_file. Confirm: no new ped.js/traffic.js; no rng/rng2/rng3/rng4 in new modules; no stamp/NPC collider in z 40.2-47.8; leftoverLot A x=258 z=84 unchanged; any new FLY_VOIDS have inKeepout and an open bay in flyColliderShapes. Set pass=true only with evidence. Fail closed otherwise.",
    label: "verify-collisions",
    capability_mode: "read-only",
    output_schema: verify_schema,
});
let verdicts = parallel(vjobs);

let all_pass = true;
let evidence = "";
for v in verdicts {
    if (v == () || !v.success || v.output.pass != true) {
        all_pass = false;
    }
    if (v != () && v.success && v.output.evidence != ()) {
        evidence += v.output.evidence;
        evidence += " | ";
    }
}

if (!all_pass) {
    let fix_prompt = "Repo: ";
    fix_prompt += repo;
    fix_prompt += ". Verification failed for phase `";
    fix_prompt += phase_id;
    fix_prompt += "`. Evidence: ";
    fix_prompt += evidence;
    fix_prompt += " Fix the breaks. Re-run node ./tools/run-miami-crowd-test.mjs and node ./tools/run-miami-leftover-lot-test.mjs. Do not ask the user. Do not invent ped.js. Return {done, summary, files_touched, blocked}.";
    let fixed = agent(fix_prompt, #{
        label: "fix-breaks",
        capability_mode: "all",
        output_schema: build_schema,
    });
    if (fixed == () || !fixed.success || fixed.output.done != true) {
        complete(#{ summary: "verify failed and fix did not land", phase_id: phase_id, merged: false, evidence: evidence });
    }
}

phase("Merge");
let merge_prompt = "Repo: ";
merge_prompt += repo;
merge_prompt += ". If git status is dirty with the Ocean Drive slice, update assets/catalog/miami-build-plan.json so phase `";
merge_prompt += phase_id;
merge_prompt += "` status is done. Then: git add -A (only under this repo), git commit -m a short message about that phase, git push origin main. ";
merge_prompt += "Do not open a PR. Do not ask the user. If nothing to commit, still push if ahead. ";
merge_prompt += "Return {done, summary, files_touched}.";

let merged = agent(merge_prompt, #{
    label: "merge-main",
    capability_mode: "all",
    output_schema: build_schema,
});

let merged_ok = merged != () && merged.success && merged.output.done == true;
complete(#{
    summary: phase_id + " " + (if merged_ok { "merged to main" } else { "built but merge skipped" }),
    phase_id: phase_id,
    merged: merged_ok,
});
