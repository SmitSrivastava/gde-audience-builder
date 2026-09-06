# Roadmap

- [x] Normalize equivalent audience phrases before Gemini and caching
- [x] Canonicalize QueryIR and deterministic retrieval identity
- [x] Deploy parser and planner with fresh cache versions
- [x] Verify 100 paraphrases plus existing audience regressions
- [x] Correct AND, OR, and exclusion audience algebra
- [x] Reconcile purchase-backed and interest-backed totals
- [x] Add Boolean regression coverage and deploy fresh cache versions
- [x] Verify repeated live planner scenarios and page controls
- [ ] Collapse matched rows into unique purchase and interest audiences per anchor
- [ ] Keep headline purchase-only and show interest separately
- [ ] Apply AND/OR once to the collapsed anchor populations
- [ ] Make row cards and checklist recalculation use reliability-adjusted people
- [ ] Verify U1–U4 against the live planner- [x] Headline = union of full purchase and full interest counts (never > sum, never < larger)
- [ ] Verify live: skincare AND suv, party AND/OR/excluding dineout, filters and evidence toggles
