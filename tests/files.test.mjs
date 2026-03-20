import './mock_globals.mjs';
import assert from 'assert';
import { isDescendantOf } from './files.mjs';
import { state } from './state.mjs';

function setupState() {
    state.items = [
        { id: 'root1', type: 'folder', parentId: null },
        { id: 'child1', type: 'folder', parentId: 'root1' },
        { id: 'grandchild1', type: 'folder', parentId: 'child1' },
        { id: 'root2', type: 'folder', parentId: null },
    ];
}

setupState();

try {
    assert.strictEqual(isDescendantOf('child1', 'root1'), true, 'child is descendant of parent');
    assert.strictEqual(isDescendantOf('grandchild1', 'root1'), true, 'grandchild is descendant of grandparent');
    assert.strictEqual(isDescendantOf('root1', 'child1'), false, 'parent is not descendant of child');
    assert.strictEqual(isDescendantOf('child1', 'root2'), false, 'child is not descendant of unrelated root');
    assert.strictEqual(isDescendantOf('root1', 'root1'), true, 'node is descendant of itself');
    assert.strictEqual(isDescendantOf(null, 'root1'), false, 'null child returns false');
    assert.strictEqual(isDescendantOf('nonexistent', 'root1'), false, 'nonexistent child returns false');

    console.log('All tests passed!');
} catch (e) {
    console.error('Test failed:', e);
    process.exit(1);
}
