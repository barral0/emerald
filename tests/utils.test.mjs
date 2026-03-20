import fs from 'fs';
import { test } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.join(__dirname, '../js/utils.js');
const tmpPath = path.join(__dirname, 'utils.mjs');

import { after } from 'node:test';

// Create a temporary .mjs copy so Node's ESM loader can import it.
fs.copyFileSync(srcPath, tmpPath);

after(() => {
    // Clean up
    try {
        if (fs.existsSync(tmpPath)) {
            fs.unlinkSync(tmpPath);
        }
    } catch (e) {
        // Ignore
    }
});

const { generateId, escapeHtml, formatDate, sortItems } = await import('./utils.mjs');

test('generateId()', async (t) => {
    await t.test('generates string starting with "id-"', () => {
        const id = generateId();
        assert.ok(id.startsWith('id-'));
    });

    await t.test('generates unique ids', () => {
        const id1 = generateId();
        const id2 = generateId();
        assert.notStrictEqual(id1, id2);
    });

    await t.test('generates ids of minimum length 4', () => {
        const id = generateId();
        assert.ok(id.length >= 4); // 'id-' (3) + at least 1 char from slice(2, 11)
    });
});

test('escapeHtml()', async (t) => {
    await t.test('escapes &', () => {
        assert.strictEqual(escapeHtml('a & b'), 'a &amp; b');
    });

    await t.test('escapes < and >', () => {
        assert.strictEqual(escapeHtml('<a>'), '&lt;a&gt;');
    });

    await t.test('escapes "', () => {
        assert.strictEqual(escapeHtml('"test"'), '&quot;test&quot;');
    });

    await t.test('handles multiple occurrences', () => {
        assert.strictEqual(escapeHtml('&&<<>>""'), '&amp;&amp;&lt;&lt;&gt;&gt;&quot;&quot;');
    });

    await t.test('leaves strings without special chars unchanged', () => {
        assert.strictEqual(escapeHtml('no special chars'), 'no special chars');
    });

    await t.test('escapes complex strings', () => {
        assert.strictEqual(escapeHtml('<div class="x">&y</div>'), '&lt;div class=&quot;x&quot;&gt;&amp;y&lt;/div&gt;');
    });
});

test('formatDate()', async (t) => {
    await t.test('formats timestamp as non-empty string', () => {
        const ts = new Date('2023-10-27T14:30:00Z').getTime();
        const formatted = formatDate(ts);
        assert.ok(typeof formatted === 'string');
        assert.ok(formatted.length > 0);
    });

    await t.test('includes date and time separators', () => {
        const ts = new Date('2023-10-27T14:30:00Z').getTime();
        const formatted = formatDate(ts);
        assert.ok(formatted.includes(':'));
        assert.ok(formatted.match(/[-/.]/));
    });
});

test('sortItems()', async (t) => {
    await t.test('sorts folders before files', () => {
        const items = [
            { id: 1, type: 'file', lastModified: 100 },
            { id: 2, type: 'folder', lastModified: 100 }
        ];
        const sorted = sortItems(items);
        assert.strictEqual(sorted[0].id, 2); // folder
        assert.strictEqual(sorted[1].id, 1); // file
    });

    await t.test('sorts items of same type by lastModified descending', () => {
        const items = [
            { id: 1, type: 'file', lastModified: 100 },
            { id: 2, type: 'file', lastModified: 200 }
        ];
        const sorted = sortItems(items);
        assert.strictEqual(sorted[0].id, 2); // newest file first
        assert.strictEqual(sorted[1].id, 1); // oldest file last
    });

    await t.test('sorts mixed items correctly', () => {
        const items = [
            { id: 1, type: 'file', lastModified: 100 },
            { id: 2, type: 'folder', lastModified: 50 },
            { id: 3, type: 'file', lastModified: 200 },
            { id: 4, type: 'folder', lastModified: 150 },
        ];
        const sorted = sortItems(items);
        assert.strictEqual(sorted[0].id, 4); // newest folder
        assert.strictEqual(sorted[1].id, 2); // oldest folder
        assert.strictEqual(sorted[2].id, 3); // newest file
        assert.strictEqual(sorted[3].id, 1); // oldest file
    });

    await t.test('returns a new array, preserving original', () => {
        const items = [{ id: 1, type: 'file', lastModified: 100 }];
        const sorted = sortItems(items);
        assert.notStrictEqual(items, sorted);
    });
});
