# Same question, different answer — why, and the fix

## Why a row "dropped out"

The engine keeps a **fixed-size shortlist** of the closest 60 signals per audience. It is a ranked cut-off, not a yes/no rule. Non-Vegetarian Food Preference sat near the bottom of that 60. When "go out" pushed Grocery / Razorpay above it, the list stayed at 60, so the last row fell off the end. Nothing decided that non-veg was irrelevant — it was simply pushed off the edge.

Two things caused it:
1. The search phrase still contains the user's raw words, so wording changes the ranking order.
2. A fixed shortlist size means any new entrant evicts the weakest existing one, which then changes purchase-backed vs interest-backed totals (57.1M to 61.4M).

## Fix 1 — Gemini cleans the sentence before anything is searched

Rather than hand-written word lists, the language model does the normalising:
- fixes spelling and spacing ("dineout", "choclate", "quickcommerce"),
- drops every filler word that is not a product/category noun, a modifier (premium, luxury, budget), or a dimension (metro, female, above 25),
- returns the cleaned canonical audience name plus a separate list of modifiers and dimensions.

"party and dineout", "people who party and go out for dineout", "party folks who dine out" all reduce to the same two audiences: **entertainment/nightlife AND dining**.

## Fix 2 — search with the resolved audience, not the typed sentence

- The search phrase is built only from the canonical audience name + that family's standard vocabulary. Leftover user words no longer steer the vector search.
- Candidates are pulled wide, then filtered to signals that actually belong to the resolved family, instead of relying on a fixed top-60 cut. A grocery-payments signal cannot enter a dining-only audience.
- Final ordering is deterministic (family match, then scale), so the same audience always produces the same list in the same order.

## Fix 3 — purchase-backed and interest-backed become clickable filters

On the result card, the two numbers turn into toggles. Clicking one filters the whole page — headline scale, geo/age/gender split bars, and the matched-signal table — to just that evidence type. Clicking again clears it. The active state is visible, and it combines with the existing geo/age/gender narrowing.

## Fix 4 — housekeeping

- Remove the "Upload Audience Dataset" button from the planner.
- Turn off the Lovable badge on the published site.

## Acceptance checks

- The three phrasings above return the same total within 2%, the same purchase/interest split, and an identical matched-signal list.
- No row disappears just because another row was added.
- Clicking "purchase-backed" changes the headline, both split panels and the table together; clicking again restores the full view.

## Technical notes

- `supabase/functions/vertex-parse/index.ts`: extend the system prompt and schema so the model returns a `normalized_brief` and cleaned per-anchor canonical text with filler stripped and spelling repaired; modifiers/dimensions keep their existing slots.
- `supabase/functions/plan-audience/index.ts`: `anchorQueryText()` uses family-canonical words only; `matchAnchor()` raises `match_count` and applies a family-membership gate on `product_families`/`category`/`sub_category` in place of the raw top-60 cut; deterministic sort before the per-anchor cap; `ENGINE_VERSION` bumped and `result_cache` cleared.
- `src/pages/Planning/CohortPlanner.tsx`: `evidenceFilter` state ("all" | "actual" | "intent") wired into the headline, split bars and signal table; remove the upload control.
- Badge off via publish settings.
