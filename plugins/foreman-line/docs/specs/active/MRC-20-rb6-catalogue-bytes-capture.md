---
ticket: MRC-20
title: RB-6 catalogue bytes capture (carried nit) — preserved public catalogue GET with digest provenance
status: active
owner: clinton.morgan
created: 2026-09-27
updated: 2026-09-27
risk: low
surfaces:
  - docs/goals/pi-model-configuration/evidence/rb6-catalogue-capture/catalogue-body.json
  - docs/goals/pi-model-configuration/evidence/rb6-catalogue-capture/response-headers.txt
  - docs/goals/pi-model-configuration/evidence/rb6-catalogue-capture/capture-manifest.json
routing_class: boilerplate
verification_class: equivalence-provable
---

# MRC-20 — RB-6 catalogue bytes capture

## Goal

Close the carried review nit exactly as named — report §7 row (`docs/goals/goal-status-report-2026-09-27.md:121`): *"RB-6 catalogue bytes capture (carried nit, §4.3)"*, with §4.3's wording at `:40`: *"Carried nits: RB-6 catalogue bytes capture; …"* — by preserving real catalogue bytes plus digest/provenance under the goal's `evidence/` root, per the review-B recommendation (`docs/goals/pi-model-configuration/pmc-p2-review-b-findings.md:199`): *"**Recommendation:** preserve the fetched catalogue body (or its parsed id list + headers + hash) under `evidence/` so the digest is re-derivable."* and the record's remaining item (`docs/goals/pi-model-configuration/pmc-p2-pi-configuration-and-route-resolver-2026-09-26.md:517-519`): *"**RB-6 capture** — the catalogue GET body/headers are still not preserved under `evidence/`; charter D8's 'captured Pi/version/catalogue metadata' wants a re-derivable capture before any residual value is ever set. Outside this rework's edit scope (evidence artifacts)."* Charter D8 (`docs/goals/pi-model-configuration/charter.md:59`) requires *"captured Pi/version/catalogue metadata"* per rollout.

The captured evidence is a **fresh, credential-free capture** of the public catalogue GET whose digest is re-derivable from the preserved bytes. It is **not** the 2026-09-27T01:19:55Z response: those bytes were never preserved and are not recoverable in this environment (STOP flag, Stop-and-Report Rule item 1). No disposition depends on the catalogue (record CORRECTED block, `…:362-370`: *"No disposition depends on the catalogue — every residual value remains typed-unavailable regardless — so nothing downstream inherits the gap."*).

## Dependencies

- **No hard predecessor** (report `:121`, "Hard predecessors: —"); Lane P-A (`:94`, *"Lane P-A — parallel with anything,** no contested writes (records, canon, external repos)"*).
- **Dispatch grant:** G-GATE2-PMC (`docs/goals/model-routing-chain-wrapper/charter.md:94`, *"per-parcel dispatch grant under `pi-model-configuration` for MRC-04, 13, 20"*).
- **Authority inputs (read-only):** RB-6 finding + disposition (`docs/goals/pi-model-configuration/pmc-p2-review-b-findings.md:195-199`, `:255`), record § 5 item 1 + CORRECTED block (`pmc-p2-pi-configuration-and-route-resolver-2026-09-26.md:353-370`), record § 9 item 1 (`:517-519`), charter D8 (`charter.md:59`), host-owner export rules (`docs/goals/routing-currency-and-merit/host-owner-export-request.md:16-18`, `:35-38`, `:45-51`).
- **Environment needs:** one outbound HTTPS GET to `https://openrouter.ai/api/v1/models` — the same metadata-only read class the record authorized (`pmc-p2-…-2026-09-26.md:353-355`: *"Public catalogue metadata GET (allowed evidence-gathering read; no key, no invocation, no provider execution)"*); `node` (v24.7.0 observed on this workstation) and `curl.exe`. Unreachable endpoint or non-200 → Stop-and-Report item 2.
- **Not available (STOP):** the original 2026-09-27T01:19:55.811Z→.959Z response bytes (see Shaping-Time Baseline); host `models-store.json` / `settings.json` (owner-held forbidden reads, `docs/kickstarters/foreman-line-build-PMC-P0.md:77-80`).
- **Downstream:** none in this chain; closure bookkeeping of record § 9 item 1 is a coordinator/MRC-01-class act (Out of Scope).

## Allowed Files

Exact paths relative to `plugins/foreman-line/`. Every other path is forbidden. All three are **new** files.

| Path | Change |
|---|---|
| `docs/goals/pi-model-configuration/evidence/rb6-catalogue-capture/catalogue-body.json` | create — verbatim response body bytes |
| `docs/goals/pi-model-configuration/evidence/rb6-catalogue-capture/response-headers.txt` | create — allowlisted response-header lines only (status line, `Date:`, `Content-Type:`) |
| `docs/goals/pi-model-configuration/evidence/rb6-catalogue-capture/capture-manifest.json` | create — digest/provenance manifest (Contract §3) |

## Forbidden

- Any path outside Allowed Files — in particular `pmc-p2-pi-configuration-and-route-resolver-2026-09-26.md`, `pmc-p2-review-b-findings.md`, `pmc-wave1-release-2026-09-27.md`, `loop-directive.md`, any `INDEX.md`, `prac-p0-compat/**`, `docs/goals/routing-currency-and-merit/host-owner-export/**`, `routing-policy/**`, `dispatch/**`, `templates/**`, `docs/specs/**` (except this spec, which the builder does not edit). A needed out-of-scope path stops work until a coordinator ratifies a spec amendment (SPEC-CONVENTION §4.8, `docs/SPEC-CONVENTION.md:128-138`).
- **No host reads**: `models-store.json`, `settings.json`, auth/credential files, credential stores, `headers` fields, secret-bearing URLs (`docs/kickstarters/foreman-line-build-PMC-P0.md:77-80`).
- **No key, no auth headers, no invocation, no provider execution, no Pi launch** — the GET is a public metadata read (`pmc-p2-…-2026-09-26.md:353-355`, `:476-477`).
- **Never capture cookies** (real responses carry a `set-cookie` Cloudflare cookie — Shaping-Time Baseline), never capture request headers, never hash a raw host document (`host-owner-export-request.md:49-51`: *"Hash sanitized projection bytes only; never hash the raw source document."*).
- **Never fabricate, pad, truncate, or edit bytes to match `9aae0055…`**; never edit the record's CORRECTED block or re-label the recorded attempt as verified (`pmc-p2-review-b-findings.md:198`: *"this is evidence discipline, not fabrication"*).

## Out of Scope

- Re-deriving the recorded digest `9aae0055b2e393aa4b3de4bee25e173b676d23640ca4d1b38696ba1a993a2269` — impossible without the unpreserved original bytes (STOP flag 1). The fresh capture must not be described as doing so.
- Record/loop-directive/INDEX/dispatch-table bookkeeping closing § 9 item 1 — coordinator or MRC-01-class act (wrapper charter D8, `docs/goals/model-routing-chain-wrapper/charter.md:36`: *"Owning goal records change only via MRC-01-class propagation parcels … or by explicit owner directive."*).
- The other § 9 remaining items (record `:520-529`: `pmc-p0-capability-baseline.md` landing, break-glass per-use attestation, the four `enabledModels` fates).
- Setting any residual value from catalogue metadata (record `:518-519`: *"before any residual value is ever set"*; a54 fail-closed dispositions unchanged).
- Regenerating, moving, or modifying `host-owner-export/` (SP18: *"refuse** writes; regeneration → **escalate**"*, `docs/goals/hierarchical-coordination-sidecars/hcs-p0-authority-and-collision-map.md:207`).
- Derived id-list artifacts — the preserved body makes every id claim re-derivable by parsing `data[].id`; no extra derived files.

## Contract

### 1. Which catalogue bytes

The **HTTP response body of `GET https://openrouter.ai/api/v1/models`** — the public OpenRouter catalogue document — captured fresh at build time from **one** response, together with that response's allowlisted header lines. This is the RB-6 object: *"the fetched catalogue body (or its parsed id list + headers + hash)"* (`pmc-p2-review-b-findings.md:199`) of *"Public catalogue metadata GET … `GET https://openrouter.ai/api/v1/models` … body 751,727 bytes, **SHA-256 `9aae0055…`**, 458 model ids"* (`pmc-p2-…-2026-09-26.md:353-357`).

**Not** host `models-store.json` and **not** the RCM export artifact: neither is the RB-6 object and neither can re-derive the recorded digest. The export is a normalized 443,195-byte projection of the Pi store (`host-owner-export/export-manifest.json:58`, `:105` `"sha256": "b0c2dc8c…"`; source `"pi-agent/models-store.json"` at `:66`) — different bytes from the GET body. Capturing either would be inventing evidence; both are forbidden (Forbidden above).

### 2. Where the captured evidence lands + capture method

Under the goal's `evidence/` root — the finding's wording (*"under `evidence/`"*, `pmc-p2-review-b-findings.md:199`) resolves to a goal-local evidence path under `docs/goals/pi-model-configuration/`, **not** `docs/specs/`. It does **not** land inside `prac-p0-compat/evidence/pi-0.87.1/`: that subtree is digest-pinned probe evidence (*"`evidence/pi-0.87.1/` holds only the probe artifacts"*, `pmc-p2-review-b-findings.md:197`; `prac-p0-compat/PROVENANCE.md:16` *"`evidence/pi-0.87.1/` — captured API-surface evidence for the pinned runtime"*) and is closed by its done-spec freeze (*"No other file may be created, edited, or deleted."*, `docs/specs/done/PRAC-P0-pi-extension-hook-surface-compat.md:126`). The capture is dated catalogue evidence, not 0.87.1 package evidence.

Capture in one command from `plugins/foreman-line/` (POSIX shell; body and headers come from the same response; non-allowlisted header lines never touch disk — exclusion before boundary, `host-owner-export/export-manifest.json:79`):

```sh
mkdir -p docs/goals/pi-model-configuration/evidence/rb6-catalogue-capture
curl.exe -sS -D - -o docs/goals/pi-model-configuration/evidence/rb6-catalogue-capture/catalogue-body.json \
  https://openrouter.ai/api/v1/models \
  | grep -Eai "^(HTTP/|Date:|Content-Type:)" \
  > docs/goals/pi-model-configuration/evidence/rb6-catalogue-capture/response-headers.txt
```

Then compute the manifest values (paste into §3):

```sh
node -e "const fs=require('fs'),c=require('crypto');const p='docs/goals/pi-model-configuration/evidence/rb6-catalogue-capture/';const b=fs.readFileSync(p+'catalogue-body.json');console.log('sha256   ',c.createHash('sha256').update(b).digest('hex'));console.log('bytes    ',b.length);console.log('modelIds ',JSON.parse(b).data.length);console.log('utcNow   ',new Date().toISOString())"
```

### 3. `capture-manifest.json` — digest/provenance fields

UTF-8 without BOM, stable serialization (2-space indent, one key per line, trailing newline), following the `host-owner-export/export-manifest.json` convention (*"The files must be UTF-8 without BOM, use stable serialization, and be hashed exactly as delivered."*, `host-owner-export-request.md:16-17`). Exact keys (values in `<>` computed/pasted per §2):

```json
{
  "manifestVersion": 1,
  "purpose": "MRC-20 RB-6 catalogue bytes capture (carried nit, pmc-p2 review B)",
  "generatedAtUtc": "<ISO>",
  "capture": {
    "source": { "method": "GET", "url": "https://openrouter.ai/api/v1/models", "auth": "none (no key; no auth headers sent)", "note": "public catalogue metadata read; no invocation, no provider execution (pmc-p2 record :353-355)" },
    "acquisitionTimeUtc": "<ISO>",
    "httpStatus": 200,
    "responseHeaders": { "date": "<Date header value>", "contentType": "application/json" },
    "byteFormat": { "bom": false, "byteLength": <n>, "encoding": "UTF-8", "lineEndings": "as-received (no normalization)" },
    "sha256": "<sha256 of the exact catalogue-body.json bytes>",
    "modelIdCount": <n>,
    "extractionMethod": { "name": "verbatim capture with in-stream header allowlist", "version": "mrc-20-catalogue-capture-v1", "implementation": "<the exact §2 commands>", "exclusionBeforeBoundary": true },
    "explicitOmissions": ["all response headers except status line, Date, Content-Type (including any cookie headers)", "all request headers (none were sent)", "URL userinfo/query/fragment (none used)"]
  },
  "sourceBoundary": {
    "credentialValuesExported": false,
    "secretUrlsExported": false,
    "rawMixedDocumentBytesExported": false,
    "rawSourceBytesHashed": false,
    "hashedBytes": "captured public catalogue response body only",
    "note": "No credential values, secret URLs, or raw mixed-document bytes were exported or hashed. Hash captured public response bytes only; never hash a raw host document."
  },
  "recordRelation": {
    "recordedAttempt": {
      "source": "GET https://openrouter.ai/api/v1/models",
      "fetchedAtUtc": "2026-09-27T01:19:55.811Z -> 2026-09-27T01:19:55.959Z",
      "sha256": "9aae0055b2e393aa4b3de4bee25e173b676d23640ca4d1b38696ba1a993a2269",
      "byteLength": 751727,
      "modelIdCount": 458,
      "locator": "docs/goals/pi-model-configuration/pmc-p2-pi-configuration-and-route-resolver-2026-09-26.md:353-370"
    },
    "rederivesRecordedDigest": <computed boolean: captured sha256 === recordedAttempt.sha256>,
    "idCountMatchesRecordedAttempt": <computed boolean: captured modelIdCount === 458>,
    "note": "The 2026-09-27T01:19:55Z response bytes were never preserved and are not recoverable in this environment (see Shaping-Time Baseline). This capture is a fresh GET; it is not that response and does not claim its digest. The preserved body makes every id-list claim in the record's item 1 re-derivable by parsing data[].id."
  }
}
```

`sourceBoundary` mirrors the export convention's required attestation (`host-owner-export-request.md:49-51`: *"The manifest must explicitly state that no credential values, secret URLs, or raw mixed-document bytes were exported or hashed."*; shape at `export-manifest.json:184-191`).

### 4. Acceptance check (bytes match source, digest recorded, redaction honored)

- **Bytes match source:** the body file is the verbatim `-o` output of the single §2 capture (no BOM, no re-serialization, no newline normalization); `capture.sha256`/`byteFormat.byteLength`/`modelIdCount` are computed **from those bytes** and must re-derive exactly (Verification V1). Hash-what-you-deliver per `host-owner-export-request.md:16-17` and the manifest-to-file digest gate at `:55-57`.
- **Digest recorded:** `capture.sha256` is the SHA-256 of the exact preserved bytes; the recorded attempt's digest/size/count are transcribed verbatim in `recordRelation.recordedAttempt` (V2).
- **Redaction honored — no credentials:** `response-headers.txt` contains exactly the allowlisted lines; zero credential/cookie-shaped content anywhere in the evidence directory (G1–G3).
- **Honest relation:** `rederivesRecordedDigest`/`idCountMatchesRecordedAttempt` are computed, never asserted; the manifest claims re-derivability of `9aae0055…` only if the computed boolean is true.

### Shaping-Time Baseline (observed 2026-09-27; refresh at builder Step 0, drift stops)

- Fresh probe of the same endpoint (2026-09-27T16:33:12Z): HTTP 200, body 751,858 bytes, SHA-256 `b4691ccd4ac3c172013e531702d69b5fe83e4fdfd3cac384faf160aaf52671e4`, 458 model ids, `typesafe/jev-1.13` absent. The id count corroborates the record's *"458 model ids"* (`pmc-p2-…-2026-09-26.md:357`) but **byte length and digest differ from the recorded attempt** (live document) — the recorded digest is not re-derivable by re-fetching.
- No 751,727-byte file exists in the shaper's reachable host temp locations (bounded size scan of `C:/Users/clint/AppData/Local/Temp`); the original response bytes are not in the repository tree (`pmc-p2-review-b-findings.md:160`: *"does not resolve to any artifact … no response bytes, id list, or headers were preserved anywhere in the tree (RB-6)"*).
- Real response headers carry `set-cookie` cookie material (Cloudflare) — captured headers must therefore be allowlist-filtered in-stream (§2). The probe digest `b4691ccd…` is a **shaping observation only** and must never be used as the capture's digest.

## Existing Patterns To Follow

- **Digest/provenance manifest shape** — `docs/goals/routing-currency-and-merit/host-owner-export/export-manifest.json`: `byteFormat` (`:56-61`), `extractionMethod.exclusionBeforeBoundary` (`:79`), `sha256` of exact bytes (`:105`), `sourceBoundary` attestations (`:184-191`); rules in `host-owner-export-request.md:16-18`, `:35-38`, `:45-51` (*"Exclude headers, credentials and credential references … Exclusion must happen … before the projection crosses the host boundary."*).
- **Evidence capture style** — `docs/goals/pi-model-configuration/prac-p0-compat/evidence/pi-0.87.1/`: raw capture file + hash manifest (`probe-output.txt`, `snapshot.json`) + digest-pinned excerpt (`compat-memo.md:22-24`); pattern only — that subtree stays frozen (see Contract §2).
- **Claim mirroring** — the manifest's fields mirror the record's own evidence-attempt block (`pmc-p2-…-2026-09-26.md:353-361`): source, fetch window, status, `Date`, `content-type`, byte count, digest, id count.

## Required Tests / Verification

No automated tests required. Manual verification (run from `plugins/foreman-line/`):

**V1 — digest comparison (manifest ↔ preserved bytes):**

```sh
node -e "const fs=require('fs'),c=require('crypto');const p='docs/goals/pi-model-configuration/evidence/rb6-catalogue-capture/';const b=fs.readFileSync(p+'catalogue-body.json');const m=JSON.parse(fs.readFileSync(p+'capture-manifest.json','utf8'));const sha=c.createHash('sha256').update(b).digest('hex');const ids=JSON.parse(b).data.length;console.log('body sha256     ',sha);console.log('manifest sha256 ',m.capture.sha256);console.log('body/manifest bytes ',b.length,'/',m.capture.byteFormat.byteLength);console.log('body/manifest ids   ',ids,'/',m.capture.modelIdCount);if(sha!==m.capture.sha256||b.length!==m.capture.byteFormat.byteLength||ids!==m.capture.modelIdCount)process.exit(1);console.log('DIGEST-COMPARISON PASS')"
```

Expected: `DIGEST-COMPARISON PASS`, exit 0.

**V2 — record-relation truth (computed booleans match reality):**

```sh
node -e "const fs=require('fs'),c=require('crypto');const p='docs/goals/pi-model-configuration/evidence/rb6-catalogue-capture/';const b=fs.readFileSync(p+'catalogue-body.json');const m=JSON.parse(fs.readFileSync(p+'capture-manifest.json','utf8'));const sha=c.createHash('sha256').update(b).digest('hex');const R='9aae0055b2e393aa4b3de4bee25e173b676d23640ca4d1b38696ba1a993a2269';const ids=JSON.parse(b).data.length;const ra=m.recordRelation.recordedAttempt;const ok=m.recordRelation.rederivesRecordedDigest===(sha===R)&&m.recordRelation.idCountMatchesRecordedAttempt===(ids===458)&&ra.sha256===R&&ra.byteLength===751727&&ra.modelIdCount===458;console.log('rederivesRecordedDigest ',m.recordRelation.rederivesRecordedDigest,'(computed',sha===R,')');console.log('idCountMatches          ',m.recordRelation.idCountMatchesRecordedAttempt,'(computed',ids===458,')');console.log(ok?'RECORD-RELATION PASS':'RECORD-RELATION FAIL');process.exit(ok?0:1)"
```

Expected: `RECORD-RELATION PASS`, exit 0 (with `rederivesRecordedDigest false` unless the captured bytes genuinely hash to the recorded digest — see STOP flag 1).

**G1 — acceptance grep, redaction (no credentials/cookies anywhere in the capture):**

```sh
grep -Erina "set-cookie|__cf_bm|authorization|bearer |api[_-]?key|sk-[A-Za-z0-9]{8,}" docs/goals/pi-model-configuration/evidence/rb6-catalogue-capture/
```

Expected: zero matches (exit 1).

**G2 — acceptance grep, headers allowlist-only (exactly the three permitted line shapes):**

```sh
grep -Eavc "^(HTTP/[0-9.]+ [0-9]{3}.*|Date: .*|Content-Type: .*)$" docs/goals/pi-model-configuration/evidence/rb6-catalogue-capture/response-headers.txt
grep -Eac "^(HTTP/|Date:|Content-Type:)" docs/goals/pi-model-configuration/evidence/rb6-catalogue-capture/response-headers.txt
```

Expected: `0` then `3`.

**G3 — acceptance grep, sourceBoundary attestations + recorded digest recorded verbatim:**

```sh
grep -Eac "\"(credentialValuesExported|secretUrlsExported|rawMixedDocumentBytesExported|rawSourceBytesHashed)\": false" docs/goals/pi-model-configuration/evidence/rb6-catalogue-capture/capture-manifest.json
grep -Ec "\"sha256\": \"9aae0055b2e393aa4b3de4bee25e173b676d23640ca4d1b38696ba1a993a2269\"" docs/goals/pi-model-configuration/evidence/rb6-catalogue-capture/capture-manifest.json
```

Expected: `4` then `1`.

**G4 — acceptance grep, record item-1 claim re-checkable over captured bytes:**

```sh
grep -Eac "typesafe/jev-1.13" docs/goals/pi-model-configuration/evidence/rb6-catalogue-capture/catalogue-body.json
```

Expected: `0` (record `:361`: *"`typesafe/jev-1.13` is absent"*). Any other value is a STOP-and-Report observation (item 5), never an edit.

**G5 — record untouched (closure bookkeeping is not this parcel's write):**

```sh
git diff --name-only -- docs/goals/pi-model-configuration/pmc-p2-pi-configuration-and-route-resolver-2026-09-26.md
```

Expected: empty output.

## Acceptance Criteria

1. Exactly three new files exist at the Allowed Files paths and nothing else changed (G5 empty; reviewer confirms `git status` shows only the new `evidence/rb6-catalogue-capture/` directory).
2. `catalogue-body.json` is the verbatim body of one `GET https://openrouter.ai/api/v1/models` captured by the §2 command — byte-preserved, no BOM, no re-serialization — and V1 proves digest/byte-length/id-count equality between bytes and manifest.
3. `response-headers.txt` contains exactly the status line, `Date:`, and `Content-Type:` lines of that same response and nothing else (G2: `0` then `3`).
4. `capture-manifest.json` carries every §3 field, stable serialization, and the four `false` sourceBoundary attestations (G3: `4` then `1`).
5. Redaction rules honored — no credentials, no cookie material, no request headers anywhere in the evidence directory (G1 zero matches).
6. The record relation is honest and machine-checked: `recordRelation.recordedAttempt` transcribes `9aae0055…`/751727/458 verbatim and the two relation booleans are computed (V2 PASS); no text anywhere claims this capture re-derives `9aae0055…` unless `rederivesRecordedDigest` is true.
7. The record's `typesafe/jev-1.13` absence claim is re-checkable against the preserved body (G4 recorded).

## Evidence Required

1. Verbatim output of V1, V2, G1–G5 with exit codes, plus `node --version` and `curl.exe --version` (first line).
2. The manifest's computed values: body SHA-256, byte length, observed `modelIdCount` vs the recorded 458, and both `recordRelation` booleans.
3. The STOP-flag statement from Stop-and-Report item 1 carried verbatim in the completion handoff: the recorded digest `9aae0055…` remains **not re-derivable** (original bytes unrecoverable; fresh bytes differ) — the capture closes the D8/§9 owed preservation only.
4. One independent review (charter table: "low | boilerplate | 1"); verification is external to the builder (SPEC-CONVENTION §4.3).

## Collision Risk

Write set $W$ = the 3 new files under `docs/goals/pi-model-configuration/evidence/rb6-catalogue-capture/`. Disjointness proof vs the report §7 lanes (`docs/goals/goal-status-report-2026-09-27.md:92-96`, task rows `:102-126`) and the HCS collision map (`docs/goals/hierarchical-coordination-sidecars/hcs-p0-authority-and-collision-map.md`):

- **Lane P-A peers** (report `:94`, *"no contested writes (records, canon, external repos)"*): MRC-01 writes only the named owning-goal records — boundary-routing D10 line, HRO-D3, RCM D3 memo + F boundary, PMC "B coordination note" (`:102`); MRC-04 writes PMC-P3 canon — skills, kickstarters, docs, human-facing templates (`:105`); MRC-21 is JEV external release rows (`:122`); MRC-22–25 live in *separate Keon repos* (`:123-126`). $W$ contains no record, canon, template, external-repo, or JEV path → **disjoint**. (A later coordinator/MRC-01-class § 9 bookkeeping write touches the record, not $W$.)
- **Lane G** (report `:93`, strict order `:143`; Lane-G task rows `:103-104`, `:106-114`): one writer at a time on `routing-policy/**` + `dispatch/**` — **SP8** (`:197`) and **SP9** (`:198`). $W$ touches neither tree and MRC-20 needs no write window → **disjoint**.
- **Lane P-R** (report `:95`; MRC-14–16 rows `:115-117`): read-only receipt analysis writing its own corpus artifacts; none may write $W$ → **disjoint**.
- **Lane X** (report `:96`; MRC-17–19 rows `:118-120`): smoke/report/experiment artifacts → **disjoint**.
- **SP11** (`templates/`, `:200`): zero contact — $W$ has no `templates/**` path.
- **SP13** (`:202`, FK §12 shared serialization-point family: plugin manifests, marketplace metadata, root workflow files, shared package manifests, receipt schemas, `SPEC-CONVENTION.md`, barrel exports): $W$ touches none of these serialization points → **zero contact**.
- **SP17** (`routing-policy/tests/`, `:206`) and **SP18** (`host-owner-export/` digest-pinned evidence, `:207`: *"Read-only for PMC, never modified … **refuse** writes"*): $W$ writes and reads neither; the export artifact is expressly not a capture source (Contract §1) → **respected read-only**.
- **Frozen PRAC payload** (`prac-p0-compat/**`, done-spec freeze `docs/specs/done/PRAC-P0-pi-extension-hook-surface-compat.md:126`): not written (path decision, Contract §2).

**Verdict: write-set disjoint from every other §7 lane and from SP8/SP9/SP11/SP13; SP17/SP18 respected read-only.** $W$ is pure-additive in a goal-local evidence directory no other parcel claims. Residual risk: a future catalogue capture landing in the same directory — mitigated by the capture-specific directory name and manifest; a second capture would be a separate dated directory, never an overwrite of these three files.

## Stop-and-Report Rule

Stop immediately and report (never guess, never self-expand authority) when:

1. **[STOP FLAG — carried from shaping] The recorded digest `9aae0055b2e393aa4b3de4bee25e173b676d23640ca4d1b38696ba1a993a2269` cannot be re-derived in this environment.** The original 2026-09-27T01:19:55Z response bytes were never preserved (record `:362-365`: *"no response bytes, id list, or headers were preserved under `evidence/`"*) and a fresh GET does not reproduce them (Shaping-Time Baseline: 751,858 bytes / `b4691ccd…` observed 2026-09-27). Report this as a permanent non-re-derivability statement; **never** fabricate or adjust bytes to match. If bytes hashing to `9aae0055…` ever surface (e.g. the host owner supplies the original response), stop and report before adding/replacing any capture.
2. The endpoint is unreachable, non-200, or the builder environment forbids the GET — report the exact output; never substitute bytes from any other source (no `models-store.json`, no export artifact, no cached copy).
3. Any requirement would read/copy host `models-store.json`, `settings.json`, auth files, or raw host export bytes, or write any path outside Allowed Files — stop and await a coordinator-ratified spec amendment (SPEC-CONVENTION §4.8).
4. The response carries credential material or the manifest/notes would need to name cookie/credential literals to pass G1 — exclusion before boundary (`export-manifest.json:79`); keep it out of the repository and report what was seen and excluded.
5. Any verification command contradicts the manifest (V1/V2 mismatch) or G4 shows `typesafe/jev-1.13` present — stop and report the observed values; regenerate the manifest from the bytes or leave the mismatch visible. Never edit `catalogue-body.json` to fit the manifest or the record.
6. Closure bookkeeping (record § 9 item 1, loop directive, `INDEX.md`, dispatch table) is requested of this parcel — report and hand off; wrapper D8 (`docs/goals/model-routing-chain-wrapper/charter.md:36`) routes record changes through MRC-01-class parcels or explicit owner directive.
