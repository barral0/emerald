HOME_CSS = """
/* ── Home Screen ─────────────────────────────────────────── */
.home-screen {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: stretch;
    background: var(--bg-main);
}

.home-left {
    width: 320px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 56px 48px;
    background: var(--bg-pane);
    border-right: 1px solid var(--border);
    backdrop-filter: blur(28px) saturate(180%);
    -webkit-backdrop-filter: blur(28px) saturate(180%);
}

.home-brand { display: flex; flex-direction: column; gap: 12px; }

.home-gem {
    font-size: 3rem;
    line-height: 1;
    user-select: none;
}

.home-app-name {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.5px;
}

.home-tagline {
    font-size: 0.88rem;
    color: var(--text-secondary);
    line-height: 1.55;
}

.home-meta {
    display: flex;
    align-items: center;
    gap: 8px;
}

.home-lang-select {
    background: var(--bg-pane-hover);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    border-radius: 6px;
    padding: 5px 8px;
    font-family: var(--font-ui);
    font-size: 0.78rem;
    cursor: pointer;
    outline: none;
    transition: all var(--transition);
}

.home-lang-select:hover {
    border-color: var(--accent);
    color: var(--text-primary);
}

.home-about-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    border-radius: 6px;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-secondary);
    font-family: var(--font-ui);
    font-size: 0.78rem;
    cursor: pointer;
    transition: all var(--transition);
    white-space: nowrap;
}

.home-about-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
}

.home-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 56px 64px;
    gap: 32px;
    overflow-y: auto;
}

.home-actions-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.home-action-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 18px;
    border-radius: 10px;
    font-family: var(--font-ui);
    font-size: 0.92rem;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all var(--transition);
    width: 100%;
}

.home-action-btn svg { flex-shrink: 0; opacity: 0.85; }

.home-action-btn.primary {
    background: var(--accent);
    color: #fff;
    box-shadow: 0 4px 16px var(--accent-glow);
}

.home-action-btn.primary:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px var(--accent-glow);
}

.home-action-btn.secondary {
    background: var(--bg-pane-hover);
    color: var(--text-primary);
    border-color: var(--border);
}

.home-action-btn.secondary:hover {
    border-color: var(--accent);
    background: hsla(142, 65%, 48%, 0.07);
    transform: translateY(-1px);
}

.home-action-btn.ghost {
    background: transparent;
    color: var(--text-secondary);
    border-color: transparent;
}

.home-action-btn.ghost:hover {
    background: hsla(0, 80%, 60%, 0.07);
    color: #f87171;
    border-color: hsla(0, 80%, 60%, 0.2);
}

.home-section-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 1.2px;
    margin-bottom: 8px;
}

.home-recent-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.home-recent-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all var(--transition);
    min-width: 0;
}

.home-recent-item:hover {
    background: var(--bg-pane-hover);
    border-color: var(--border);
}

.home-recent-item svg { flex-shrink: 0; opacity: 0.5; }

.home-recent-name {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.home-recent-path {
    font-size: 0.72rem;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
}

"""

with open('css/layout.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Insert after .preview-pane block, before body.bg-aurora
insert_before = '\nbody.bg-aurora {'
idx = content.find(insert_before)
if idx != -1:
    content = content[:idx] + HOME_CSS + content[idx:]
    with open('css/layout.css', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done! Inserted', len(HOME_CSS), 'chars at index', idx)
else:
    print('Marker not found')
