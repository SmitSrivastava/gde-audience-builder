# Stabilize Equivalent Audience Queries

## Confirmed problem

The three phrases are not entering matching as the same query today:

- `party people and dineout folks` became `party/nightlife AND dineout` and returned **97.54M**.
- `party and dineout` became `party AND dine out` and returned **97.38M**.
- `people who party and go out for dineout` became `party AND dining out` and returned **88.22M**.

The parser cache currently keys the original normalized sentence, so these are three separate Gemini calls and three separate cached QueryIRs. Gemini returned different canonical labels and token lists; those differences changed the embedding search text, matched rows, and cohort size. Old cached QueryIRs also remain active after parser prompt changes.

The **60-row limit is not the root cause**. It makes the difference more visible because small embedding changes can move rows across the cutoff. Removing the limit entirely would process far more rows through cube slicing and overlap calculations, increase response time, and change existing audience baselines. It can therefore make the planner less stable if changed before canonicalization is fixed.

## Changes

1. **Normalize filler before Gemini and before the parser cache**
   - Apply the supplied filler list deterministically, longest phrases first, so phrases such as `go out for`, `interested in`, and `audience size` are removed as units.
   - Protect true Boolean operators, exclusions, modifiers, dimensions, age expressions, and city names from removal.
   - Normalize simple variants needed for equivalence, including `partying → party` and `dineout/dining out → dine out`.
   - The three example phrases will all become the same normalized input: `party AND dine out`.

2. **Give Gemini the explicit parsing contract**
   - Add the supplied retain/drop rules and examples to the QueryIR parser instructions.
   - Send Gemini the cleaned sentence, while retaining the original sentence only for diagnostics.
   - Require a canonical normalized form in its structured response and ensure filler cannot appear in anchors or retrieval tokens.
   - Preserve `AND`, `OR`, `NOT`, `excluding`, `without`, and `except`; extend the structured QueryIR minimally if needed so exclusions are represented rather than silently discarded.

3. **Canonicalize QueryIR after Gemini**
   - Normalize anchor aliases and inflections after model output so `dineout`, `dining out`, and `dine out` resolve identically, as do `party people`, `partying`, and `party/nightlife` for this concept.
   - Remove confidence and model-generated token variation from the semantic cache/matching identity.
   - Sort and re-stamp equivalent anchors, modifiers, dimensions, Boolean operators, and exclusions into one deterministic JSON shape.
   - Key both parser and result caches from that canonical semantic representation, not the user's filler-heavy sentence.

4. **Keep retrieval bounded, but deterministic**
   - Keep the 60 semantic-neighbour limit for now; do not make retrieval unbounded during this stabilization.
   - Build embedding text only from the canonical anchor and controlled catalog vocabulary—not free-form Gemini token additions.
   - Add a deterministic tie-breaker for equally ranked rows.
   - Ensure the same canonical QueryIR always produces the same matched signal IDs in the same order, then the same cohort size.
   - Separately benchmark 60 vs 100 vs full eligible-family retrieval. Raise the cap only if measured recall improves without unacceptable latency or baseline drift.

5. **Invalidate stale behavior safely**
   - Version the parser normalization and sizing engine caches.
   - Prevent old rows containing previous `normalized_brief` or filler-derived anchors from being reused after deployment.
   - Leave the existing UI, evidence filters, demographic slicing, and sizing formulas unchanged.

6. **Add the requested 100-variation regression suite**
   - Create 100 paraphrases of Party AND Dine Out using the supplied wrapper words, verbs, behavior phrases, connectors, punctuation, spacing, and inflections.
   - Assert every variant produces the same normalized phrase, semantic QueryIR, retrieval text, matched signal ID set/order, purchase/interest split, and final cohort size.
   - Add protection cases proving modifiers and dimensions survive, such as premium skincare, international travel, and female + above 25 + metro + premium chocolate.
   - Add exclusion cases proving `not`, `excluding`, `without`, and `except` are retained and canonicalized.
   - Run the live Gemini path as well as deterministic unit tests, so model prompt failures and downstream matching drift are both caught.

## Acceptance criteria

- All three supplied Party + Dine Out sentences return byte-equivalent semantic QueryIR and identical matched rows and sizing.
- All 100 equivalent Party + Dine Out variants pass the same equality checks.
- Filler never becomes an anchor, modifier, dimension, or retrieval term.
- Modifiers, dimensions, Boolean operators, and exclusions are never removed as filler.
- Existing skincare, quick-commerce + snacks, demographic filters, and purchase/interest toggles remain unchanged.
- The 60-row limit remains until benchmark evidence supports a safe increase.
