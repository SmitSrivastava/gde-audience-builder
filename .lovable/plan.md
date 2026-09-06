# Why the combined number came out smaller than one of its own rows

You are right: a union of overlapping audiences can never be smaller than the
biggest audience inside it. What you saw is real, and the cause is not the union
maths — it is that the number printed next to each row and the number used in
the union are two different quantities.

## What is actually happening

1. **The Scale column shows the raw signal size.** Each row prints the partner's
   full national volume for that signal (volume x reliability). Nothing about your
   query is applied to it.

2. **The union uses a shrunken version of the same row.** Before combining, every
   row is cut down by the selected geo/age/gender slice, and then the whole
   combined result is multiplied again by a blanket modifier factor (for example
   "premium" applies roughly a third when there is no direct premium signal).

3. So the union is computed on, say, 30% of each row, while the table displays
   100% of each row. A headline of 4.0M sitting under a row that reads 4.8M is
   the arithmetic consequence, not an overlap error.

4. **No floor is enforced.** Nothing in the engine checks the one rule that can
   never be broken: the combined audience must be at least as large as its
   largest member, and at most the sum of all members.

## The fix

1. **One number per row, everywhere.** The Scale column shows the row's
   *contribution to this result* — after the geo/age/gender slice and after any
   modifier — which is exactly the value the union consumes. The raw national
   figure stays available on the row detail, clearly labelled as the full signal
   size, so nothing is lost.

2. **Modifiers stop being applied after the union.** A modifier narrows each
   row before combining, so the union is built from already-narrowed rows.
   Multiplying the finished union again is what let the result slide under a
   member row.

3. **Floor and ceiling enforced in code.** For every result — total,
   purchase-backed and interest-backed independently — the engine asserts:
   union >= largest contributing row, and union <= sum of contributing rows.
   Same for the anchor level and the final headline. A violation is corrected to
   the floor and recorded, never shipped.

4. **Ticking and unticking stays consistent.** Removing a row can only make the
   number smaller or equal; adding one can only make it bigger or equal. This is
   checked as part of the same guard.

## Acceptance checks

- "premium luxury four wheeler and skincare": headline >= 4.8M row and >= every
  other ticked row; unticking the largest row lowers the headline.
- Purchase-backed >= largest purchase row, interest-backed >= largest interest
  row, headline >= each of the two.
- With a Metro filter every row's shown scale drops and the headline still sits
  above the largest shown row.

## Technical notes

- `supabase/functions/plan-audience/index.ts`: `matched_signals[].scale` becomes
  the sliced+modified contribution (same input as `uniquePeopleForClass`), with
  the raw `peopleOf(r)` carried as a separate `full_scale` field; modifier
  `m.scale` moves from the post-union multiply (lines ~729-737) into the per-row
  weight; a new `assertUnionBounds(union, parts)` in
  `supabase/functions/_shared/audience-algebra.ts` enforces
  `max(parts) <= union <= sum(parts)` and is called at the partner fold, the
  cross-partner fold and the anchor fold.
- `src/pages/Planning/CohortPlanner.tsx`: Scale column renders the contribution
  value; the full signal size shows as secondary text.
- Unit tests for the bounds guard; `ENGINE_VERSION` bumped so cached answers
  recompute; live re-run of the query in the screenshot.
