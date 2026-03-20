import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import vm from 'node:vm';

const utilsCode = fs.readFileSync(new URL('../js/utils.js', import.meta.url), 'utf-8');
const context = vm.createContext({ Math, Date, exports: {} });
vm.runInContext(utilsCode.replace(/export const/g, 'exports.'), context);
const { escapeHtml } = context.exports;

test('escapeHtml utility function', async (t) => {
    await t.test('escapes & character', () => {
        assert.strictEqual(escapeHtml('foo & bar'), 'foo &amp; bar');
    });

    await t.test('escapes < character', () => {
        assert.strictEqual(escapeHtml('foo < bar'), 'foo &lt; bar');
    });

    await t.test('escapes > character', () => {
        assert.strictEqual(escapeHtml('foo > bar'), 'foo &gt; bar');
    });

    await t.test('escapes " character', () => {
        assert.strictEqual(escapeHtml('foo " bar'), 'foo &quot; bar');
    });

    await t.test('escapes multiple characters', () => {
        assert.strictEqual(
            escapeHtml('<a href="https://example.com/search?q=1&2">link</a>'),
            '&lt;a href=&quot;https://example.com/search?q=1&amp;2&quot;&gt;link&lt;/a&gt;'
        );
    });

    await t.test('returns string unchanged if no characters to escape', () => {
        assert.strictEqual(escapeHtml('just a normal string'), 'just a normal string');
    });

    await t.test('handles empty string', () => {
        assert.strictEqual(escapeHtml(''), '');
    });

    await t.test('handles string with only special characters', () => {
        assert.strictEqual(escapeHtml('&<>"'), '&amp;&lt;&gt;&quot;');
    });
});
