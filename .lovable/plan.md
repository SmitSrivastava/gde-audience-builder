# Run all 100 queries first, report every failure, then one single fix

No patch-by-patch work. Order is: full test run → complete failure report → one
consolidated fix → re-run the same 100 queries to prove it clean.

## Step 1 — Run the full battery (no code changes)

All 100 queries you listed are run live against the real engine, exactly as the
page calls it. For each query I record:

- the parsed request (valid or not)
- anchors detected
- modifiers detected
- operator detected: single / and / or / excluding / nested
- matched-signal count
- headline reach, purchase-backed, interest-backed
- planning confidence
- primary audience, expansion audience
- geo, age, gender and nested splits (all six nesting orders spot-checked)
- how-it-was-built trace present
- whether the run was written to the audit/cache record

And each is scored against your checks: parse valid, anchors right, modifiers
right, operator right, matched table not empty where data exists, no false
zeros, all fields populated, splits reconcile with the headline, same meaning
in different wording gives the same result (queries 1–3, 11–13, 32–34 etc.),
"or" ≥ each side ≥ "and", "excluding" ≤ the base, fallback/modifier behaviour
clearly labelled, suggestions not counted unless ticked.

## Step 2 — The failure report

One table back to you: query, anchors, operator, headline, purchase, interest,
PASS or the exact check that failed — plus a grouped list of root causes, so you
can see how many distinct faults there actually are rather than 100 symptoms.

Already known and going into that list:

- **Purchase and interest both showing 0 while the headline is fine.** Cause
  confirmed in the engine: for an "and" query the combine step runs three
  separate times — once on the total, once on purchase rows only, once on
  interest rows only. If one side of the "and" has no purchase rows and the
  other has no interest rows, both class figures collapse to zero while the
  total survives. Your suggested behaviour — when a combined class comes out
  zero, show the per-audience figures instead of a bare 0 — is included in the
  fix, alongside making the two classes always add back to the headline.

## Step 3 — One consolidated fix

Every root cause from step 2 fixed together in a single pass, plus one guard
that runs before any answer is returned: purchase + interest = headline; neither
part above the headline; no zero where matched rows exist; every split adds back
to the headline; "or" ≥ each side ≥ "and"; "excluding" ≤ the base; suggestions
excluded unless ticked. A failed check is corrected and recorded, never shipped.

## Step 4 — Re-run the same 100 queries

Same battery, same table, and I paste the results back. Anything that is
genuinely absent from the source data is reported as such rather than filled
with an invented number.

## Technical notes

Battery is a Deno harness invoking `plan-audience` (and `vertex-parse`) with
cache bypassed so nothing stale is measured. Fixes land in
`supabase/functions/plan-audience/index.ts` and
`supabase/functions/_shared/audience-algebra.ts` (invariant guard), plus tests.
Engine version bumped so cached answers recompute. No page redesign, no data
reload, no change to the splits already working on screen.
