# Fix the filter maths properly (not one bug at a time)

Yes — this is solvable, and it should be solved once at the root, not patched per symptom.

## What is actually going wrong

A filtered audience can never be larger than the unfiltered one. Right now
"party people and dineout folks" gives 97.5M with no filter and 114.0M with
Metro selected, and the geo bar then reads Metro = 100%.

The cause is in how a filtered size is built. For each matched audience signal the
engine asks the geo x age x gender cube for the people inside the selected slice.
When the cube has no rows for that signal in that slice, the code falls back to the
signal's **full national volume** instead of zero. So under a Metro filter, every
signal that has no Metro cells contributes its entire India-wide number. The more
you narrow, the more signals miss the cube, and the bigger the answer gets. The
split bars then divide those inflated numbers by the Metro-only cells, which is why
Metro reads 100%.

Two smaller versions of the same flaw sit next to it: the unfiltered run and the
filtered run are two independent calculations that can pick different join
branches, and there is no check anywhere that a narrower answer must be smaller.

## The fix — one calculation path, cube as the only source of truth

1. **Cube is authoritative.** Every audience size, filtered or not, is summed from
   the geo x age x gender cube. No fallback to the master volume mid-calculation.
   A signal with no cells in the selected slice contributes zero, which is the
   truth.

2. **Coverage is measured once, not guessed.** For signals whose cube total does
   not reconcile with their master volume, the difference is distributed across
   that signal's own cells in proportion to the cube, at load time. After that,
   full-cube total per signal always equals the master volume, so unfiltered and
   filtered results come from the same numbers.

3. **Filtering is a restriction, never a re-plan.** A filter run reuses the exact
   same matched signals, same join branch, same overlap treatment as the unfiltered
   run, and only swaps the cell restriction. Today the filter path can land on a
   different branch and produce an unrelated number.

4. **Purchase-backed vs interest-backed shrink with the filter too**, from the same
   restricted cells, so the two boxes always add to the headline.

5. **Guardrail in code.** Every filtered result is checked against the unfiltered
   one: total, purchase-backed and interest-backed must each be less than or equal
   to the unfiltered value, and any single geo/age/gender selection must be less
   than or equal to that bar's share of the unfiltered total. If the invariant
   breaks, the engine returns the corrected (capped) number rather than a wrong one.

6. **Acceptance checks before handover** — each run unfiltered, then per filter:
   - "party people and dineout folks": Metro <= total, and Metro + Tier1 + Tier2 +
     Tier3 within ~1% of total
   - "premium skincare buyers": same, plus the age bars sum to total
   - "quick commerce snack buyers": gender bars sum to total
   - phrasing pairs stay within ~15% of each other (already holding)

## Technical notes

- `supabase/functions/plan-audience/index.ts`: in `unionPeople`, the term
  `volMap[id] ?? r.volume ?? 0` becomes cube-only; `slice()` returns an explicit
  zero for signals with no cells in the slice; `splits()` and the headline read the
  same map so the bars and the number can no longer disagree.
- Filter requests carry the cached plan (matched ids, branch, anchors) instead of
  re-entering the planning branch selection.
- Cube reconciliation is a one-off backfill on `signal_cell` (proportional
  scaling per `master_signal_id` to its `signal.volume`), plus the same rule
  applied on future cube uploads.
- Engine version string bumped so cached answers recompute.
