# Why the two questions give different numbers

## What is actually being compared

Both questions resolve to the same two audiences (Party AND Dine Out), but the words kept for each audience are not identical, and those words are what the matching engine searches with.

For each audience the engine builds a short "search phrase" from:
1. the standard words for that audience family (from the reference lists), plus
2. the exact words the question used for that part ("dineout" vs "go out for dineout").

That phrase is turned into a meaning-vector and compared against a meaning-vector stored for every audience signal (built from partner + category + sub-category + signal name + families + sector + layer). The engine keeps the 60 closest signals above a fixed closeness score.

So the comparison is: **question phrase (which still contains the user's raw words) vs signal description**. Adding "go out" nudges that phrase toward general going-out/spending language, which is why:
- Grocery / Razorpay 57.0M enters the top 60,
- Non-Vegetarian Food Preference 12.3M drops out,
- purchase-backed goes 57.1M to 61.4M.

The maths did not change. The candidate list did.

## The fix: make the search phrase depend on the resolved audience, not the typed words

1. **Search with the resolved audience only.** Build the search phrase purely from the canonical family vocabulary for that audience (entertainment/nightlife, dining). The user's raw leftover words stop feeding the vector search; they are still used for ranking and for the on-screen wording, not for deciding who is in the candidate pool.
2. **Widen and then gate.** Pull a larger candidate set, then keep only signals whose family, category or sub-category actually belongs to the resolved audience family. A grocery-payments signal cannot enter a dining audience unless dining is one of its own families.
3. **Deterministic ordering.** After gating, order candidates by family match first, then by scale, so two phrasings of the same audience produce the same list in the same order rather than a score-order that shifts with wording.
4. **Same rule for both sides of an AND.** Apply the gate per audience, so one side widening cannot silently widen the other.
5. **Bump the engine version** so cached results are recomputed.

## Acceptance checks after the change

- "party and dineout" and "party people and go out for dineout" return the same total within 2%, and the same purchase-backed / interest-backed split within 2%.
- The matched-signal list for both is identical (same rows, same order).
- Grocery / Razorpay no longer appears under a dining-only audience unless it carries a dining family.
- "premium skincare buyers" vs "people who buy premium skincare" stay identical too.

## Technical notes

- File: `supabase/functions/plan-audience/index.ts`.
- `anchorQueryText()` returns family-canonical words only; anchor tokens move to a separate ranking-only field.
- `matchAnchor()`: `match_count` raised (200), followed by a family-membership gate on `product_families` / `category` / `sub_category`; existing family-floor and B2B-exclusion logic kept.
- Sorting made explicit (family-exact, then `volume`) before the per-anchor cap.
- `ENGINE_VERSION` bumped; `result_cache` cleared after deploy.
