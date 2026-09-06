# OR logic: what is running today, and what still needs fixing

## What the OR does right now

Yes — it is exactly the formula you stated.

Each audience is built individually first (same as before: match the signals for that
audience, sum purchase-backed and interest-backed people). Then:

```text
AND  = A ∩ B
OR   = A + B − (A ∩ B)
NOT  = A − (A ∩ B)
```

The overlap `A ∩ B` is not a guess out of thin air. It is bounded by what is
arithmetically possible and then set by the stored correlation for that pair of
families (for example entertainment × dining = 0.4):

```text
lower bound = max(0, A + B − population)
upper bound = min(A, B)
A ∩ B       = lower + rho × (upper − lower)
```

So OR can never exceed the population, never be smaller than the larger of the two,
and AND is always the smallest. Purchase-backed is combined with the same formula,
and interest-backed is the remainder, so the two boxes always add up to the headline.

## What is still wrong (and what this plan fixes)

1. **Three or more audiences shrink too much.** The fold is pairwise and re-applies
   the correlation at every step, so "party and dineout and snacks" collapsed to
   5.5M against 55.5M for the two-audience version. Fix: fold once against the
   running combined audience using the correlation of the *combined* family set, and
   cap so adding an audience with AND can only reduce and with OR can only increase.

2. **"Excluding" removes nothing.** The excluded audience is resolved by family name
   only; "dine out" has no family entry, so it matched zero people and subtracted
   zero. Fix: resolve the excluded audience through the same matcher used for the
   included audiences, so it always finds its signals.

3. **Ordering guardrail.** After every calculation, assert `OR ≥ each audience ≥ AND`
   and `exclusion ≤ base audience`, and correct rather than return a broken number.

## Verification before handover

Run each live and report the numbers:
- Party AND Dine Out, Party OR Dine Out, Party excluding Dine Out — check ordering
- Party AND Dine Out AND Snacks — must be ≤ the two-audience AND, not 10× smaller
- Purchase-backed + interest-backed = headline in every case
- Repeat phrasings return identical numbers

## Technical notes

Changes confined to `supabase/functions/plan-audience/index.ts` (Boolean fold,
exclusion resolution, invariant guard), `_shared/audience-algebra.ts` (fold helper),
plus tests, then redeploy with a bumped engine version so caches recompute.
