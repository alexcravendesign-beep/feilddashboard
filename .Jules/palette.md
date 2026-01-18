# Palette's Journal

## 2026-01-18 - Missing ARIA on Theme Toggle
**Learning:** Icon-only buttons (like theme toggles) often get overlooked for accessibility because they are visually self-explanatory but invisible to screen readers without labels.
**Action:** Always check `size="icon"` usage in the codebase and verify `aria-label` presence.

## 2026-01-18 - Form Labels Validation
**Learning:** Simple `required` attribute on inputs is good, but visual indicators (like asterisks) help users scan forms faster before submitting.
**Action:** Add visual cues for required fields in the future.

## 2026-01-18 - Data Visualization Accessibility
**Learning:** Charts and heatmaps are visual-heavy and need alternative text descriptions or accessible structures.
**Action:** Ensure `role="img"` and `aria-label` are present on container elements of charts, summarizing the data trend.
