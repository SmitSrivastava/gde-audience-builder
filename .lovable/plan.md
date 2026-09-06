# Why the top number is bigger than purchase + interest — and a one-time fix

## What your screenshot shows

12.3M at the top, 9.9M purchase-backed, 1.6M interest-backed. Those two add to
11.5M, so 0.8M people appear to come from nowhere. The geo bars (9.7M + 1.5M +
954K + 194K) add back up to 12.3M, so Tier 2 and Tier 3 are not extra people —
the bars simply spread the top number across tiers, so any error in the top
number shows up there too.

## Where the 0.8M actually comes from (confirmed in the engine)

Every matched row is labelled either purchase-backed or interest-backed — never
both, never neither. So the two boxes must fully cover the top number: the top
number can never be larger than the two added together.

The engine breaks that rule because it runs the de-duplication **three separate
times**: once over all rows, once over purchase rows only, once over interest
rows only. Each run estimates person-overlap between partners using stored
correlation values, and the run over the full set removes a different amount of
overlap than the two smaller runs do. Three independent estimates cannot be
expected to agree, so the parts stop matching the whole. When two audiences are
combined with "and", the same mismatch is repeated a second time, because the
combine step is also applied to the total and the two classes independently.

There is also no check anywhere that the parts and the whole agree — so a broken
number is returned instead of being caught.

## The fix

1. **De-duplicate once, then split.** Build one person-set for the whole
   audience. Purchase-backed and interest-backed become slices of that same
   set — each person is attributed to the class of the strongest evidence
   behind them — instead of three separate calculations. The two boxes then
   always add exactly to the top number.

2. **Combine once, then split.** For "and", "or" and "excluding", the combine
   happens on the single person-set, and the two classes are re-derived from
   the result. No operator is applied three times any more.

3. **Same rule under every filter.** Metro, age, gender, above-age and the
   purchase/interest toggle all restrict the same set, so the parts keep adding
   up after filtering too.

4. **A guard that cannot be skipped.** Before any result is returned it must
   satisfy, for the unfiltered run and every filtered run:
   - purchase + interest = total (within rounding)
   - neither class larger than the total
   - geo bars, age bars and gender bars each add to the total
   - any filtered total no larger than the unfiltered one
   - "or" ≥ each audience ≥ "and", and "excluding" ≤ the base audience
   If a check fails the engine corrects the number rather than shipping it, and
   records which check fired.

5. **Verify the whole class of issue once, not this one screenshot.** Run a
   fixed battery live and report every number: skincare AND suv, party AND
   dineout, party OR dineout, party excluding dineout, three-audience combos,
   premium skincare female above 25 metro, quick-commerce snacks — each of them
   unfiltered, then per geo tier, per age band, per gender, and with both
   evidence toggles. Every run is checked against the list above and the results
   are pasted back to you.

## Technical notes

Changes stay inside `supabase/functions/plan-audience/index.ts`
(`uniquePeopleForClass` returns a person-set with per-class attribution rather
than three scalars; the Boolean fold and the exclusion loop operate on that set;
splits read the same set), `supabase/functions/_shared/audience-algebra.ts` (the
invariant guard), plus tests. Engine version bumped so cached answers recompute.
No page redesign, no data reload.
