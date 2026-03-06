## 2024-03-04 - ARIA labels for icon-only elements
**Learning:** In this application, many icon-only interactive elements (like window controls, sidebar toggles, and theme swatches) were mistakenly relying on `title` attributes alone. The `title` attribute is insufficient for screen reader accessibility.
**Action:** Always add explicit `aria-label` attributes to icon-only buttons and interactive elements to ensure they are properly announced by screen readers, even if they already have a `title` attribute for visual tooltips.
