# Fix the zero purchase/interest boxes, then run your 100-query test battery

## What your screenshot shows

Total 754K, purchase-backed 0, interest-backed 0. Every matched person is
labelled either purchase-backed or interest-backed, so the two boxes must add
up to the total. Both being zero is impossible and proves a calculation fault,
not a data gap.

## Confirmed cause (read from the engine)

For an "and" query the engine runs the combine step three separate times: once
on the total, once on purchase-backed only, once on interest-backed only. Each
class is combined independently, so if one side of the "and" has no
purchase-backed rows (luxury cars are interest signals) the purchase result
collapses to zero; if the other side has no interest-backed rows the interest
result collapses to zero as well. The total survives because it is computed on
the full row set. Nothing forces the parts to add back to the whole, and no
check catches it before the answer is returned.

A second confirmed gap: the engine returns geo, age and gender splits only.
There is no nested split (geo inside age inside gender, etc.), so check 9 in
your list cannot pass today in any nesting order.

## The fix

1. **One person-set, then slice it.** Combine once on the whole audience, then
   derive purchase-backed and interest-backed as shares of that same result.
   Each person is attributed to the class of the strongest evidence behind
   them. The two boxes then always add exactly to the headline, and neither can
   be zero while the headline is not.

2. **Same rule for and / or / excluding**, for single-anchor queries, for
   nested Boolean queries, and under every geo, age, gender, above-age and
   evidence filter.

3. **Nested splits.** Add a nested breakdown supporting all six orders (geo →
   age → gender, geo → gender → age, age → geo → gender, age → gender → geo,
   gender → geo → age, gender → age → geo), each level adding back to its
   parent and the top level adding to the headline.

4. **A guard that cannot be skipped.** Before any answer is returned:
   purchase + interest = total; neither part above the total; total not zero
   when matched rows exist; every split adds to the total; "or" ≥ each side ≥
   "and"; "excluding" ≤ the base audience; suggestions excluded unless ticked.
   A failed check is corrected and recorded, never shipped.

## Then: the full 100-query battery

All 100 queries run live against the real engine, each checked on your 14
points: valid parse, correct anchors, correct modifiers, correct operator
(single / and / or / excluding / nested), non-empty matched table, non-zero
result where data exists, every output field populated (reach, confidence,
matched signals, primary and expansion audience, geo/age/gender/nested splits,
how-it-was-built trace), splits reconciling, all six nesting orders, wording
variants giving the identical result, Boolean ordering holding, fallback and
modifier behaviour clearly labelled, suggestions not silently counted, and the
query written to the audit/cache record.

You get one results table back: query, detected anchors, operator, headline,
purchase, interest, and PASS or the exact check that failed. Every failure that
is an engine fault gets fixed and re-run until the battery is clean; anything
that is genuinely absent from the source data is reported as such rather than
patched with an invented number.

## Technical notes

Work stays in `supabase/functions/plan-audience/index.ts` (single de-duplicated
person-set with per-class attribution replacing the three independent folds; new
nested split builder), `supabase/functions/_shared/audience-algebra.ts` (the
invariant guard), plus tests and the harness that runs the 100 queries. Engine
version bumped so cached answers recompute. No page redesign, no data reload.
