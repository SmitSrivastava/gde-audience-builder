# Make Audience Planning Deterministic and Boolean-Correct

## Confirmed diagnosis

- **OR parsing works:** the live parser converts “party or dineout” into two anchors—Party and Dine Out—with `join: OR`.
- **OR sizing is internally inconsistent:** the live result reports 330.7M total, 330.7M purchase-backed, and 330.7M interest-backed. The two evidence classes therefore exceed the headline when added together. The planner currently calculates the OR headline from purchase-backed rows only, then calculates interest-backed rows separately.
- **Exclusions are not implemented:** NOT/excluding/without/except reach the structured request and cache key, but the sizing engine never removes the excluded audience.
- **The earlier 97M and current 55.6M are based on different matched signal sets:** old cached runs used Gemini-generated labels/tokens such as “party/nightlife” and “dineout folks”; the current canonical run uses “party” and “dine out.” The overlap formula did not create that change. The old 88–97M results were phrasing-dependent and should not be treated as a trustworthy target.
- **Current tests cover text cleanup only:** they do not exercise parsing, matching, Boolean sizing, evidence totals, demographic slicing, or cache stability.

## Changes

1. **Define one audience algebra for every operator**
   - Calculate each anchor once from its complete post-modifier matched set.
   - AND: keep the existing bounded intersection model, but apply it consistently to total and evidence classes.
   - OR: compute a deduplicated union of purchase-backed and interest-backed signals, then make the headline equal purchase-backed + interest-backed without double counting.
   - NOT: resolve the excluded anchors, estimate their overlap with the included audience, subtract it, and cap the result between zero and the included audience.
   - Support more than two anchors by folding the same operator deterministically in anchor order rather than silently using only the first two for AND.

2. **Make evidence classes mutually exclusive and mathematically accountable**
   - Purchase-backed means the portion supported by purchase/transaction evidence.
   - Interest-backed means the remaining reachable audience after purchase-backed reach is removed.
   - Enforce invariants for every result: `total = purchase-backed + interest-backed`, neither class exceeds total, and filtered totals never exceed their unfiltered baseline.
   - Keep the existing purchase-backed and interest-backed page toggles, but make both use the same Boolean calculation as the full result.

3. **Keep semantic normalization without accepting a made-up target number**
   - Keep equivalent Party + Dine Out wording mapped to one canonical request and one cache identity.
   - Keep deterministic signal ordering and consumer/B2B separation.
   - Audit the matched rows and family vocabulary for Party and Dine Out against the source catalog; remove unrelated rows and retain relevant rows based on explicit family membership and relevance rules.
   - Establish the resulting canonical baseline from those validated inputs. Do not force the answer back to 97M or 55M merely to match an old screenshot.

4. **Fix cache correctness**
   - Version the parser and sizing semantics together.
   - Include operator, exclusions, modifiers, dimensions, evidence mode, and validated anchor identity in the cache key.
   - Ensure equivalent paraphrases share one result while AND, OR, and NOT requests cannot collide.

5. **Add real regression coverage**
   - Retain the 100 normalization paraphrases, but also run representative variants through parsing and sizing.
   - Cover AND, OR, NOT/excluding/without/except, three-anchor combinations, premium modifiers, city/geo/age/gender/above-age filters, and purchase/interest toggles.
   - Assert stable QueryIR, matched signal IDs/order, headline reach, evidence reconciliation, and split totals across repeated runs.
   - Add fixed regression cases for Party + Dine Out, premium skincare, quick-commerce + snacks, JEE in Patna, and SUV intenders.

6. **Verify in the actual planner**
   - Run repeated equivalent phrasings and confirm byte-stable structured requests, matched rows, and totals.
   - Compare Party AND Dine Out, Party OR Dine Out, and Party excluding Dine Out to verify the expected ordering: OR ≥ either audience ≥ AND, and exclusion ≤ Party.
   - Exercise evidence and demographic controls in the page and confirm the headline, split charts, and matched-signal table stay synchronized.

## Technical boundary

Limit changes to shared query normalization, the parser function, the audience-planning function, tests, and any minimal planner wiring needed for verification. Keep the page design, datasets, demographic cube, partner catalog, and existing navigation unchanged.
