# Foreman Line Defect Lessons

This current-repository ledger begins with the lessons distilled during the
E6-R1 current-repository evidence rerun. Earlier lesson numbers remain cited by
the imported standing constraints; their absent historical prose is not
reconstructed here.

## #37 — Repository identity is not install resolution

A living install instruction can name the canonical repository and still be
unusable when its requested plugin is absent from the declared marketplace.
Repository normalization therefore needs an end-to-end resolver assertion:
marketplace key → source directory → nested plugin manifest → matching plugin
name.

**Disposition:** installed as Builder conditional constraint #14 in
`docs/kickstarters/STANDING-CONSTRAINTS.md`. The E6-R1 one-time inventory sweep
covered all 46 builder paths; Audit Suite was the only unresolved living install
surface, and its marketplace entry plus stale-key regression checks now pass.

## #38 — Named evidence tests must fail when the named structure is stripped

A test described as validating a full provider response was able to pass while
asserting only a small subset of the response. Evidence-fixture tests must bind
each named structural field and include a mutation that removes the asserted
structure, proving the test turns red.

**Disposition:** mechanically installed in the E6-R1 integration regression as
the named-field structural guard and stripped-capture negative; Reviewer
constraint #11 already requires this mutate-to-prove technique. The E6-R1
one-time sweep covered both captured merge-gating rulesets and found no second
unbound current-response fixture in the scoped inventory.
