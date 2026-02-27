import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

new_home = '''    <!-- Home Screen (Desktop only) -->
    <div id="home-screen" class="home-screen" style="display: none;">

        <!-- Left: Branding -->
        <div class="home-left">
            <div class="home-brand">
                <span class="home-gem">\U0001f48e</span>
                <h1 class="home-app-name">Emerald</h1>
                <p class="home-tagline" data-i18n="home.subtitle">Select a workspace to start writing</p>
            </div>
            <div class="home-meta">
                <select id="home-lang-select" class="home-lang-select" aria-label="Language">
                    <option value="en">EN</option>
                    <option value="pt">PT</option>
                    <option value="es">ES</option>
                </select>
                <button id="home-about-inline-btn" class="home-about-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <span data-i18n="menu.about">About</span>
                </button>
            </div>
        </div>

        <!-- Divider -->
        <div class="home-divider"></div>

        <!-- Right: Actions + Recent -->
        <div class="home-right">
            <div class="home-actions-group">
                <button class="home-action-btn primary" id="home-open-btn">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
                    </svg>
                    <span data-i18n="home.open_folder">Open Existing Folder</span>
                </button>
                <button class="home-action-btn secondary" id="home-create-btn">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        <line x1="12" y1="11" x2="12" y2="17"></line>
                        <line x1="9" y1="14" x2="15" y2="14"></line>
                    </svg>
                    <span data-i18n="home.create_new">Create New Workspace</span>
                </button>
                <button class="home-action-btn ghost" id="home-close-app-btn">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"></path>
                    </svg>
                    <span data-i18n="home.close_app">Exit Application</span>
                </button>
            </div>

            <div class="home-recent-section" id="home-recent-section" style="display: none;">
                <p class="home-section-label" data-i18n="home.recent">Recently Opened</p>
                <ul class="home-recent-list" id="home-recent-list"></ul>
            </div>
        </div>

    </div>'''

# Find boundaries using regex
pattern = r'    <!-- Home Screen.*?    </div>(?=\s*\n\s*<div class="app-layout")'
match = re.search(pattern, html, re.DOTALL)
if match:
    html = html[:match.start()] + new_home + html[match.end():]
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print('Success! Replaced', match.end() - match.start(), 'chars')
else:
    print('Pattern not found')
    # Debug
    idx = html.find('<!-- Home Screen')
    print('Found Home Screen at:', idx)
    print(repr(html[idx-4:idx+100]))
