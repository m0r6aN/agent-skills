# FK-P0 amendment R19 — the chain head gets a floor

**Status:** coordinator-ratified. **Committed alone, before any dependent code**, per SPEC-CONVENTION §11.
**Target:** AC4, the migration-chain paragraph.

## Why

**R16 is mine.** I designed the head exemption's hardening and I ratified it. Two independent
post-rework reviewers, working the mandate I wrote precisely because that mechanism had never been
examined by anyone but its authors, each found it admits a tampered registry that validates green.
**Two different routes, both reproduced by me against pristine `src/` and the shipped registry.**

**Route A — a shadow link.** `chainLinkFor` selects both chain commands with `Array.prototype.find`,
the first match in evidence order, and nothing constrains the head's evidence multiset. `unshift` one
`command-result` declaring the manifest of a tampered document and the chain binds to it:

```
payload: 7 gate3.merge-authority rules flipped active-reading -> historical-only
payload alone         -> MIGRATION_EVIDENCE_INVALID
payload + shadow link -> valid:true, 0 violations
resolveAuthority(gate3.merge-authority, coordinator, merge)
   before: RESOLVED / REFUSE / critical / controlling=[b1ac4aa9eddf, c74628d41600]
   after:  REQUIRE_HUMAN / NO_APPLICABLE_AUTHORITY / controlling=[]
```

The head then carries **two** `superseding-binding-manifest-r14` entries, same predecessor, different
successors. The honest one is still there, still declaring the true manifest. Nothing reports the
contradiction; array order decides. Fork detection keys on `prevDigest` *across* records, so it
cannot see a fork *inside* one.

The payload is the on-the-nose one: it silently retires every rule asserting that **Gate 3 merges are
human-owned and nondelegated**, in a parcel whose entire purpose is to represent honestly where
enforcement is real.

**Route B — deletion promotes a pinned record.** Head identity is positional and position depends on
what exists. Delete the head and the previously-pinned record is promoted into the exemption,
escaping its byte pin:

```
delete head                                    -> MIGRATION_EVIDENCE_INVALID
  + repoint promoted head to the live manifest -> valid:true, 0 violations
  + actorClass:anonymous, exitCode:137         -> valid:true, 0 violations
  + FALSIFIED sources[0].fullFileSha256        -> valid:true, 0 violations
control: same falsification, real head intact  -> MIGRATION_EVIDENCE_INVALID
```

The ratified residual limit covers *appending* a head. It never covered *erasing* a record the pin
table declares immutable. `registry-rework-df8155a` is not in `REQUIRED_REWORK_MIGRATIONS`, so its
deletion raises no `RECONCILIATION_MISSING` — the migration record attesting the R14 rework can be
removed with zero violations.

## The coordinator error this corrects

I ran five attack variants against the head, saw all five refused, and wrote **"a missing guard, not
a hole"** into the goal record. Both live routes are exactly **one step past where I stopped**. I had
even run "tamper + delete head record" and seen it caught — and did not take the next step of
repairing the promoted head, which is the whole attack. A negative result at depth one is not a
negative result.

The one thing I did right was withholding that conclusion when I sent the reviewers the raw
observation. Had I sent the verdict with the fact, I would have anchored both of them onto my error.

## Ratified text

Appended to AC4 immediately after "...invented for a historical record that never had any.":

> The head exemption is a *narrower* binding than a pinned constant and never a weaker one, and four
> further obligations make that true rather than merely asserted. First, **exactly one chain link per
> record**: a migration-chain record declares exactly one prior-binding-manifest command and exactly
> one superseding-binding-manifest command, and a record carrying two or more of either is invalid
> whatever their contents or order. Selecting the first match and ignoring the rest is a defect,
> because a second superseding command sharing a predecessor and declaring a different successor is a
> fork *inside* one record, which across-record fork detection cannot see. Second, **a pinned record
> is never the head**: a reconciliation record holding an entry in the shipped record-digest table is
> invalid as a chain head, so head position is not selectable by deletion - removing the head must
> invalidate the document, never promote a pinned record out of its pin. Third, **the head has a
> required shape**: it declares `superseded-by-amendment` with non-null superseding evidence, carries
> at least one `git-commit` evidence entry whose reference is a forty-character lowercase hex commit,
> and carries command evidence issued by this tool with `actorClass` `coordinator` and `exitCode`
> `0`; a record meeting the schema minimums but not this shape is not a head. Fourth, **evidence
> digests bind their references**: for every observed-evidence entry of every kind, the recorded
> digest is the SHA-256 of the recorded reference, and an entry whose digest is merely well-formed
> hex binds nothing - comparing a digest to itself is not a binding. The accepted residual limit is
> stated in terms of a *well-formed, correctly chained* head record; these four obligations are what
> make "well-formed" mean something, and none of them is corpus-dependent, so none reintroduces the
> shipped-manifest freeze this structure exists to remove.

## What this does not change

The accepted residual limit stands: a party who can already edit the file can append a genuinely
well-formed, correctly chained head declaring the manifest of a tampered registry. R19 does not close
that and does not pretend to. It makes "well-formed" a checked property instead of a hopeful adjective.

Nothing here is corpus-dependent, so the shipped-manifest freeze R16 correctly removed does not
return. The existing topology guards are unaffected — both reviewers probed fork, cycle, orphan,
duplicate-head, prefix-dodge, wrong-predecessor and truncation independently, and **all of them
fire**. The gap was never the topology. It was that the head had no floor on its *content*.
