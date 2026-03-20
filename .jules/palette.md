## 2024-03-04 - ARIA labels for icon-only elements
**Learning:** In this application, many icon-only interactive elements (like window controls, sidebar toggles, and theme swatches) were mistakenly relying on `title` attributes alone. The `title` attribute is insufficient for screen reader accessibility.
**Action:** Always add explicit `aria-label` attributes to icon-only buttons and interactive elements to ensure they are properly announced by screen readers, even if they already have a `title` attribute for visual tooltips.
## 2024-05-24 - Icon-only Interactive Elements Need ARIA Labels
**Learning:** Icon-only interactive elements (like the sidebar toggle, preview toggle, and window control buttons) often rely solely on `title` attributes for tooltips, but this is insufficient for screen readers. They need explicit `aria-label` attributes to ensure full accessibility.
**Action:** Always verify that interactive elements with only icons include `aria-label` attributes, not just `title` attributes.
