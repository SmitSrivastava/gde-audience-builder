# Restore the Previous Audience Logic

## Why it failed

The screenshot’s message is generated before audience sizing: the parser returned no usable audience family for that request, so the planner refused it instead of running the calculation. The latest change altered both the model instructions and retrieval rules at once—adding aggressive filler cleanup, canonical-only search text, a strict family gate, a wider candidate pull, and new cache versioning. That was too broad for a request that only needed three UI changes and made a previously working path unstable.

The current live endpoint now parses the exact sentence correctly as **Party AND Dine Out** and returns **49.9M**, while the query cache confirms the same two families. This means the screenshot captured the inconsistent period during the multi-function rollout, not a missing catalog family. Even so, the unrequested logic rewrite should be removed.

## Changes

1. Restore the planner and model parser to the last working behavior from before the latest wording/retrieval rewrite.
   - Restore the prior query text and candidate matching behavior.
   - Remove the new strict family gate, expanded candidate pull, deterministic family-floor rewrite, and added model filler-normalisation instructions.
   - Preserve the already-correct cube-based geo, age, and gender filtering and baseline caps.
2. Keep only the requested additions.
   - Purchase-backed card remains clickable and filters the complete result.
   - Interest-backed card remains clickable and filters the complete result.
   - Excel upload control remains removed.
   - “Edit with Lovable” badge remains hidden.
3. Prevent stale results by using a fresh result-cache version after the rollback.
4. Verify the exact failing sentence plus the earlier working variants return valid, consistent Party + Dine Out results, then verify skincare, quick-commerce snacks, purchase/interest toggles, and demographic filters still work.

## Technical boundary

Use the planner behavior at the last stable pre-rewrite revision as the baseline, then reapply only the evidence-filter parameter and UI toggle behavior. Do not roll back unrelated planning-page features, datasets, cube calculations, or styling.
