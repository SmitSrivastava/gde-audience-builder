# Revert to Generic GDE — Keep the Planning Page

## The issue

Reverting via the History tab restores the whole project to the pre-Netflix generic GDE state. That would also remove the newer work you want to keep: the Planning landing page (`/`), the Swiggy partner dashboard (`/partners/swiggy`), and their routing.

The good news: the Planning work is cleanly separable. It lives in standalone files that don't depend on the Netflix theme.

## Approach

**Step 1 — You revert**
Use the History tab (or the revert button under a chat message) to restore the version just before the Netflix overhaul (commit `e681f6b` — generic GDE with Enrichment & Activation, navy/dark-purple theme).

**Step 2 — I restore the Planning page on top**
Right after you revert, tell me and I will re-add, in this project:

- `src/pages/Planning/PlanningPage.tsx` — the light enterprise Planning landing page (Audience 360 hero, metric strip, sector scale cards)
- `src/pages/Partner/SwiggyPartnerDashboard.tsx` — the Swiggy/Instamart partner usage dashboard (including Brand-Wise Usage)
- Routing in `src/App.tsx`: `/` → Planning, `/partners/swiggy` → Swiggy dashboard, with the GDE app staying at `/dashboard`
- `framer-motion` dependency (used by the Planning page animations)

These files are self-contained (light theme, their own styles), so they will sit cleanly on the restored generic GDE codebase with no conflicts.

## What you end up with

- Generic WPP GDE product back as the main app (Dashboard, Segmentation, Enrichment, Activation, Admin)
- Planning page as the landing page at `/`
- Swiggy partner dashboard at `/partners/swiggy`
- Netflix pitch safe in your duplicated project

## Notes

- I have the full content of the Planning and Swiggy files in this chat's context, so nothing needs to be recovered manually.
- Do the revert first, then message me — restoring before the revert would be overwritten by it.
