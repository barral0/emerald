## 2024-05-24 - Optimize renderSidebar
**Learning:** O(N^2) complexity in recursive tree rendering can easily become a bottleneck for large datasets (e.g. 10k items).
**Action:** Always pre-compute a children map (O(N)) to allow O(1) lookups during tree traversal, reducing overall rendering complexity to O(N).
