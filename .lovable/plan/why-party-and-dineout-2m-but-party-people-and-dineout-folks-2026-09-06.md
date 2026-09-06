# Why "party and dineout" = 2M but "party people and dineout folks" = 54M

## What actually happened (verified from the saved runs)

Both briefs were parsed into the same shape: two audiences, entertainment AND dining.
The only thing that changed was the **words kept for each audience**:

| Brief | Audience 1 words | Audience 2 words | Result |
|---|---|---|---|
| party and dineout | "party" | "dine out", "dineout" | 2.0M (0.5M purchase-backed, 1.6M interest) |
| party people and dineout folks | "party/nightlife", "party people", "nightlife" | "dineout", "dineout folks" | 54.3M (all interest) |

Those words are turned into a meaning-vector and used to pull the closest partner
signals. Richer words ("nightlife", "party people") pull the big lifestyle and
going-out audiences. The bare word "party" pulls a narrow, literal set — including
IndiaMart business rows about party supplies and event planners, which are small and
B2B. Fewer and smaller signals on one side, and because the two sides are combined
with AND, the smaller side caps the answer. Hence 2M vs 54M.

So this is not a maths difference. It is a **retrieval-stability** defect: the same
intent phrased two ways produces two different candidate sets, and nothing pins the
words back to a stable audience definition.

## The fix

### 1. Anchor words become canonical, not whatever the user typed
Each audience the parser finds is mapped to its family (entertainment, dining, ...) and
the words used for retrieval are rebuilt from the project's own vocabulary for that
family — the family label plus its stored synonyms — with the user's words added as
extras, never as the only input. "party", "party people", "party/nightlife" then all
retrieve the same candidate set.

### 2. Filler words are stripped before matching
Words like people, folks, users, audience, guys, crowd, buyers add no meaning and shift
the vector. They get removed from anchor text.

### 3. Consumer vs business rows are separated
Business/RFQ style rows (IndiaMart supplier and wholesale listings) stop being mixed
into consumer lifestyle audiences unless the brief actually asks for a business
audience. This is what dragged "party" into party-supplies territory.

### 4. A floor on how thin one side may get
If one side of an AND matches only a handful of low-volume rows while its family
clearly has larger consumer signals, the family-level rows are added back (they are
already fetched today, but only when a literal token matches). That removes the cliff
between two phrasings of the same idea.

### 5. Consistency check before handover
Run these pairs; each pair must land within roughly 15% of each other:
- "party and dineout" vs "party people and dineout folks"
- "skincare buyers" vs "people who buy skincare"
- "quick commerce shoppers" vs "q-commerce users"

Each run's audience list must also stay free of business-supplier rows.

## Technical notes
- All changes are in `supabase/functions/plan-audience/index.ts` (`matchAnchor`) plus a
  small canonicalisation step after parsing. No UI change, no data reload.
- Canonical vocabulary comes from `synonym` / `family` in the backend.
- Engine version string is bumped so old cached answers are recomputed.
