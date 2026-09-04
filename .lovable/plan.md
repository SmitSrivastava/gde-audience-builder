# Fix the missing skincare cohort

## Scope
Fix only the result for multi-category AND searches such as **“SUV intenders and premium skincare.”** No UI, styling, upload, split, or other feature changes.

## Change
- Parse each side of the AND as its own audience block.
- Scope **premium** only to the skincare block instead of applying it to SUV as well.
- Keep representative matched signals from **both** required blocks in the result table while retaining the AND/intersection scale calculation.
- Allocate the final intersection scale across those displayed signals so the rows and headline total remain consistent.

## Verification
Run the exact query and verify the visible Matched Audience Signals table contains both:
- Auto / SUV or four-wheeler signals
- Fashion & Beauty / skincare signals

Also confirm no card, UPI, beverage, or unrelated device signals appear and the displayed row scales reconcile to the headline audience scale.
