import fs from 'fs';
import { execSync } from 'child_process';

const copyToMjs = (src, dest) => {
    let content = fs.readFileSync(src, 'utf8');
    // Change internal imports to point to .mjs files for the mock environment
    content = content.replace(/from\s+['"]\.\/([^'"]+)\.js['"]/g, "from './$1.mjs'");
    fs.writeFileSync(dest, content);
};

// Ensure all needed files are available as .mjs
const jsFiles = ['state', 'utils', 'persistence', 'render', 'dialogs', 'i18n', 'files', 'menus', 'images', 'theme', 'shortcuts'];
jsFiles.forEach(file => {
    copyToMjs(`./js/${file}.js`, `./tests/${file}.mjs`);
});

// Run the test
try {
    execSync('node --experimental-vm-modules tests/files.test.mjs', { stdio: 'inherit' });
} finally {
    // Cleanup
    jsFiles.forEach(file => {
        if (fs.existsSync(`./tests/${file}.mjs`)) {
            fs.unlinkSync(`./tests/${file}.mjs`);
        }
    });
}
