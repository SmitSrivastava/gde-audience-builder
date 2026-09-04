# Why that 37.3M number is wrong — and how to fix the engine

## What is actually happening today

Your query "SUV intenders and premium skincare" produced Food & Beverages, UPI users, Card users, Debit card, Mobile | Device. That is not your spec — it is three concrete defects in `src/lib/planningEngine.ts`.

**1. Keyword matching is substring-based, not word-based.**
Eligibility is `row.text.includes(keyword)`. So:
- `"car"` (SUV / Auto) matches **card users**, **debit card**, **credit card**
- `"ev"` (electric vehicle) matches **beverages**, **device**, **level**
- `"app"` matches **apparel**, `"food"` matches everything with food in the path

That single line is why BFSI and CPG signals are sitting inside an auto + skincare cohort. The anchor category is being matched, but so is half the dataset.

**2. Boolean AND is applied to the total but not to the signal list.**
`combine()` for AND does `min(totals) x 0.25` for the headline number, but the Matched Audience Signals table is built from the **union** of every block's rows. So the table shows "SUV rows OR skincare rows" while the number claims an intersection. The number and the table describe two different audiences.

**3. Splits are not really query-driven.**
Only Zepto rows carry real geo/age/gender distribution. Every other partner is rebuilt on a fixed neutral distribution (35/25/25/15 geo, 22/34/24/20 age, 52/48 gender). Since most matched volume is non-Zepto, almost every query converges to the same 41% metro / 24% 29-34 shape you keep seeing.

Also: "premium" is only honoured if the literal word appears in the partner's signal text; otherwise the whole block is flattened by a blanket 0.35 factor, which is why the premium cut barely moves the number.

## The fix

**A. Strict anchor eligibility (word-boundary + phrase matching)**
- Replace `includes()` with tokenised, word-boundary matching; multi-word keywords match as phrases.
- Add negative guards for known collisions (`car` must not match `card`, `ev` must not match `beverage`/`device`, `app` must not match `apparel`).
- Keep your rule: a row is eligible **only** on `raw_signal` / `raw_category` / `raw_sub_category` / `normalized_cohort_key` / semantic text, and **only** when an anchor core-category keyword hits. Modifiers (premium/affluent/luxury/high value), intents (buyer/shopper/user/intender) and filters (male/female/metro/tier/age) can never make a row eligible on their own.
- Apply the score threshold from your spec: 8 for specific queries, 5 for broad, relaxed by 1 when fewer than 10 rows qualify.

**B. Real boolean semantics**
- Every operator returns a **row set as well as a total**, so the table always describes the same audience as the number.
- AND: intersect on `normalized_cohort_key` where the same cohort meaning appears in both blocks; where blocks are genuinely different categories, keep the smaller block's rows as the surviving row set and apply your AND factor (0.25 same sector+layer, 0.15 different).
- OR: union of rows, sum minus overlap (40% same sector, 25% related, 10% unrelated).
- EXCLUDE: base block rows minus overlap (30/15/8%), never negative, base block's rows only.
- Nested groups inherit modifiers/filters only down their own branch — bracket > EXCLUDE > AND > OR precedence preserved.

**C. Modifiers as scoped narrowing, per your spec**
- Direct premium signal present → use it as-is.
- No direct premium signal but affluence layer overlap exists → 0.35 narrowing on that block only.
- Neither → 0.20 incremental, and the block is flagged lower confidence.
- Modifiers apply to the block/group they attach to only — never globally.

**D. Query-responsive splits**
- Build splits from the real partner-level geo/age/gender volumes for every partner that has them in the dataset (not only Zepto), aggregated at signal level and weighted by each matched signal's contributed volume.
- Only partners that genuinely lack a breakdown fall back to a neutral cut, and their weight in the blended split is proportional, so the shape moves with the matched signal mix.
- Explicit filters (metro / female / 29-34) hard-filter the split rather than just scaling the total.

**E. Verification before I hand it back**
Run these against the loaded dataset and check the matched-signals table for category bleed:
- "SUV intenders and premium skincare" — must show only Auto + Fashion & Beauty signals, no card/UPI/beverage rows
- "premium skincare buyers"
- "UPI migration audience"
- "quick commerce snack buyers in metro"
- "affluent travellers 35-40"

## Scope

Changes are confined to `src/lib/planningEngine.ts` (matching, boolean combination, modifier scoping, split computation). `CohortPlanner.tsx` keeps its current layout, cards, table and charts; only the values it renders change. No new UI wording, no dataset re-upload.
