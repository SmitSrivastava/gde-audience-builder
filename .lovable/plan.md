# Natural-Language Cohort Builder (AI-powered)

## What you'll be able to do

Type a plain-English description like "premium beauty users" or "luxury skincare buyers in metros" in the Audience Builder. The app sends it to an LLM (Gemini via Lovable AI Gateway), which:

1. Interprets the intent (beauty, luxury, premium, skincare, etc.)
2. Matches those concepts against the attribute list from your uploaded Excel (synonyms and related terms handled by the model — "beauty" ≈ "cosmetics", "skincare" ≈ "derma care")
3. Returns the matching fields/operators/values as Query Builder rules
4. Pre-fills the Query Builder and shows an estimated cohort size

## How it works

```text
User sentence ──► Edge Function ──► Gemini (Lovable AI Gateway)
                       │
        Excel attributes uploaded once ──► stored in DB
                       │
   Gemini gets: user sentence + full attribute catalog
   Gemini returns: matched rules (field, operator, value) + rationale
                       │
   App pre-fills Query Builder rows + simulated cohort size
```

## Build steps

1. **Enable Lovable Cloud** — needed for the edge function (LLM call) and storing the uploaded attribute catalog. Nothing runs fully client-side; the API key stays server-side.
2. **Attribute catalog upload (Admin)** — an Excel upload widget (SheetJS to parse `.xlsx`) that stores attribute names + values into a `attribute_catalog` table. You upload your Excel once; it becomes the matching dictionary.
3. **Edge function `interpret-cohort`** — receives the English sentence, fetches the catalog, calls `google/gemini-3.7-flash` with structured output (list of `{field, operator, value}` rules + a short "why" summary). Handles errors properly (rate limits, credit exhaustion surfaced in UI).
4. **Audience Builder UI addition** — a prompt bar at the top of Create Audience: "Describe your cohort in plain English…" with a Generate button. Results populate the existing Query Conditions rows, highlight matching data partners, and trigger the existing size simulation (scaled by number/strictness of matched rules).
5. **No changes to existing functionality** — manual rule building stays exactly as-is; AI is an optional shortcut that fills the same rule model.

## Technical details

- Lovable Cloud: database table `attribute_catalog` (field, value, source_sheet), edge function with `LOVABLE_API_KEY` (auto-provisioned, server-only)
- Model: `google/gemini-3.7-flash` via AI SDK + Lovable AI Gateway, structured output with a small schema; rule values constrained to the catalog so hallucinated attributes are filtered out in code
- Excel parsing: `xlsx` (SheetJS) package on the client, rows sent to the backend for storage
- Cohort size: simulated from matched rules using the existing size logic (base × rule factors), clearly labeled as an estimate

## What I need from you

- The Excel file (or its column structure) when we build — I can start with a placeholder catalog and swap in yours later.
- Approval to enable Lovable Cloud for this project.
