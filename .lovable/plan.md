# Ground the Planner in the Excel with real semantic retrieval

## The honest diagnosis

The `/planner` page does **not** call Gemini and does **not** use retrieval. It runs a
hand-written keyword matcher in `src/lib/planningEngine.ts`:

```text
query -> lowercase -> tokenize -> word-boundary regex against
raw_signal / raw_category / raw_sub_category
-> score (+5 signal, +4 category, +6 sector, +3 modifier)
-> keep rows above threshold
-> arithmetic factors (AND = min x 0.25, premium x 0.35, cross-partner 0.40 / 0.25)
```

Consequences, all visible in the screenshot:

- "skincare" matched almost nothing because no row literally contains that token, so the AND
  fallback kept only the Auto block and dropped the skincare block entirely.
- 8.1M is `min(block totals) x 0.25` — a fixed factor, not a number derived from the data.
- Earlier "premium beauty" and "card / UPI / beverage" bleed came from the same root cause:
  lexical matching with no meaning behind it.

Patching the matcher again will not fix this. The engine needs to retrieve against meaning.

## What gets built

### 1. Signal embedding index (grounding layer)
- On dataset load, every distinct audience signal (partner + category + sub-category + signal)
  is embedded once through the Lovable AI Gateway embedding model.
- Vectors are stored in the backend alongside the signal row so they persist across refreshes
  and are computed only once per dataset, not per query.

### 2. Retrieval on every query
- The user query is embedded and matched against the signal index by cosine similarity.
- Retrieval returns the top candidate signals with a similarity score.
- Lexical scoring is kept, but only as a boost on top of retrieval, never as the sole gate.
  A signal is eligible if it is semantically close **or** an exact keyword hit.
- This is what makes "skincare" reach derma-care, beauty-care and facial-care rows that share
  no literal token.

### 3. Gemini as the query interpreter
- Before retrieval, the query goes to Gemini with the dataset's real category and sub-category
  vocabulary supplied as context.
- Gemini returns a structured plan: blocks (each with core category, sector, intent),
  the boolean operator between them, and per-block modifiers and filters.
- Gemini can only choose from vocabulary that exists in the loaded dataset; anything outside it
  is discarded in code, so it cannot invent categories.
- "SUV intenders and premium skincare" becomes two blocks: Auto / SUV intent, and
  Fashion & Beauty / skincare with premium scoped to that block only.

### 4. Scale computed from retrieved rows, not from a fixed factor
- Each block's scale is the sum of its retrieved signal volumes, with same-partner duplicates
  collapsed and cross-partner contribution applied.
- AND is derived from the actual overlap between the two blocks' retrieved rows rather than
  a blanket `min x 0.25`.
- The matched signals table always lists rows from every block in the query, so the number and
  the table describe the same audience.
- Geo, age and gender splits stay volume-weighted from the retrieved rows.

### 5. No new UI wording
Layout, cards, table and charts stay exactly as they are. Only the values change, plus a small
loading state while the query is interpreted and retrieved.

## Verification before handover
Each of these must return rows from every category named in the query, with no unrelated sector
bleed:
- "SUV intenders and premium skincare" — Auto rows **and** Fashion & Beauty skincare rows
- "premium skincare buyers"
- "luxury beauty audience in metro"
- "UPI migration audience"
- "affluent travellers 35-40"

## Technical notes
- Embeddings and chat both run through the Lovable AI Gateway (no key handling needed).
- Embedding the dataset happens once at load; queries only embed the short query string,
  so per-search latency stays low.
- Vector storage and the interpretation endpoint live in the backend; the planner page keeps
  its existing upload and persistence flow untouched.
- `src/lib/planningEngine.ts` keeps its scoring and boolean helpers, but eligibility and
  scale now consume retrieved candidates instead of raw keyword scans.
