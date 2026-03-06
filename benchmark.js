const fs = require('fs');
const path = require('path');
const fsPromises = fs.promises;

async function setupBenchmarkDir(dir, depth, numFiles) {
    if (depth === 0) return;
    await fsPromises.mkdir(dir, { recursive: true });
    for (let i = 0; i < numFiles; i++) {
        await fsPromises.writeFile(path.join(dir, `file_${depth}_${i}.md`), '# Hello');
    }
    for (let i = 0; i < 3; i++) {
        await setupBenchmarkDir(path.join(dir, `dir_${depth}_${i}`), depth - 1, numFiles);
    }
}

async function runScan(scanFunc, dir) {
    const start = performance.now();
    const items = await scanFunc(dir);
    const end = performance.now();
    return { time: end - start, count: items.length };
}

// 2. Read all files in a directory (recursive) looking for .md files
async function readDirectoryOld(dirPath) {
    const items = [];

    async function scan(currentPath, parentId = null) {
        const entries = await fsPromises.readdir(currentPath, { withFileTypes: true });
        for (const entry of entries) {
            // Ignore hidden files / node_modules
            if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

            const fullPath = path.join(currentPath, entry.name);
            const id = Buffer.from(fullPath).toString('base64'); // use path as stable ID

            if (entry.isDirectory()) {
                items.push({
                    id,
                    type: 'folder',
                    parentId,
                    title: entry.name,
                    isOpen: false,
                    fsPath: fullPath,
                });
                await scan(fullPath, id);
            } else if (entry.isFile()) {
                const lowerName = entry.name.toLowerCase();
                const isMarkdown = lowerName.endsWith('.md');
                const isImage = /\.(png|jpe?g|gif|webp|svg)$/.test(lowerName);

                if (isMarkdown || isImage) {
                    const stats = await fsPromises.stat(fullPath);
                    items.push({
                        id,
                        type: isMarkdown ? 'file' : 'image', // custom 'image' type for sidebar
                        parentId,
                        title: entry.name,
                        lastModified: stats.mtimeMs,
                        fsPath: fullPath,
                        // Content is loaded lazily to save memory
                    });
                }
            }
        }
    }

    await scan(dirPath);
    return items;
}

async function readDirectoryNew(dirPath) {
    const items = [];

    async function scan(currentPath, parentId = null) {
        const entries = await fsPromises.readdir(currentPath, { withFileTypes: true });
        await Promise.all(entries.map(async (entry) => {
            // Ignore hidden files / node_modules
            if (entry.name.startsWith('.') || entry.name === 'node_modules') return;

            const fullPath = path.join(currentPath, entry.name);
            const id = Buffer.from(fullPath).toString('base64'); // use path as stable ID

            if (entry.isDirectory()) {
                items.push({
                    id,
                    type: 'folder',
                    parentId,
                    title: entry.name,
                    isOpen: false,
                    fsPath: fullPath,
                });
                await scan(fullPath, id);
            } else if (entry.isFile()) {
                const lowerName = entry.name.toLowerCase();
                const isMarkdown = lowerName.endsWith('.md');
                const isImage = /\.(png|jpe?g|gif|webp|svg)$/.test(lowerName);

                if (isMarkdown || isImage) {
                    const stats = await fsPromises.stat(fullPath);
                    items.push({
                        id,
                        type: isMarkdown ? 'file' : 'image', // custom 'image' type for sidebar
                        parentId,
                        title: entry.name,
                        lastModified: stats.mtimeMs,
                        fsPath: fullPath,
                        // Content is loaded lazily to save memory
                    });
                }
            }
        }));
    }

    await scan(dirPath);
    return items;
}

async function main() {
    const testDir = path.join(__dirname, 'test_bench_dir');
    if (fs.existsSync(testDir)) {
        await fsPromises.rm(testDir, { recursive: true, force: true });
    }
    console.log('Setting up benchmark directory...');
    // Depth 5, 10 files per dir. Total dirs: 1 + 3 + 9 + 27 + 81 = 121
    // Total files: 121 * 10 = 1210
    await setupBenchmarkDir(testDir, 6, 20);

    console.log('Running old scan...');
    const oldResult = await runScan(readDirectoryOld, testDir);
    console.log(`Old scan took ${oldResult.time.toFixed(2)}ms for ${oldResult.count} items.`);

    console.log('Running new scan...');
    const newResult = await runScan(readDirectoryNew, testDir);
    console.log(`New scan took ${newResult.time.toFixed(2)}ms for ${newResult.count} items.`);

    await fsPromises.rm(testDir, { recursive: true, force: true });
}

main().catch(console.error);
