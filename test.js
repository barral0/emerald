const path = require('path');
const fs = require('fs');

// Create test folder
const testDir = path.join(__dirname, 'test-workspace');
if (!fs.existsSync(testDir)) fs.mkdirSync(testDir);

let allowedWorkspaces = [testDir];

function isSafePath(targetPath) {
    const resolvedPath = path.resolve(targetPath);
    return allowedWorkspaces.some(workspace => {
        const resolvedWorkspace = path.resolve(workspace);
        // Ensure the path is within the workspace, or is the workspace itself
        return resolvedPath === resolvedWorkspace || resolvedPath.startsWith(resolvedWorkspace + path.sep);
    });
}

function assert(condition, message) {
    if (!condition) {
        console.error('❌ ' + message);
        process.exit(1);
    }
    console.log('✅ ' + message);
}

console.log('Testing isSafePath logic:');
console.log('Workspace:', testDir);

assert(isSafePath(testDir), 'Workspace path should be safe');
assert(isSafePath(path.join(testDir, 'test.md')), 'File inside workspace should be safe');
assert(isSafePath(path.join(testDir, 'folder/test.md')), 'Nested file inside workspace should be safe');
assert(!isSafePath(path.join(testDir, '../test.md')), 'File outside workspace using .. should NOT be safe');
assert(!isSafePath('/etc/passwd'), 'Absolute path outside workspace should NOT be safe');

// Cleanup
if (fs.existsSync(testDir)) fs.rmdirSync(testDir);

console.log('All path tests passed!');
