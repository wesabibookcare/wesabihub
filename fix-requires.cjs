const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.{ts,tsx}');
let changedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace: const { XXX } = require('YYY');
  // With: Top level import, and remove the local const.

  const requireRegex = /const\s+\{\s*([a-zA-Z0-9_]+)\s*\}\s*=\s*require\(['"]([^'"]+)['"]\);/g;

  let match;
  let importsToAdd = new Set();

  while ((match = requireRegex.exec(content)) !== null) {
    const varName = match[1];
    const modulePath = match[2];
    importsToAdd.add(`import { ${varName} } from '${modulePath}';`);
  }

  content = content.replace(requireRegex, '');

  // also: return require('../services/db/RoleApplicationRepository').roleApplicationRepository;
  const requirePropRegex = /return\s+require\(['"]([^'"]+)['"]\)\.([a-zA-Z0-9_]+);/g;
  while ((match = requirePropRegex.exec(content)) !== null) {
    const modulePath = match[1];
    const varName = match[2];
    importsToAdd.add(`import { ${varName} } from '${modulePath}';`);
  }

  content = content.replace(requirePropRegex, 'return $2;');

  if (importsToAdd.size > 0) {
    const importsStr = Array.from(importsToAdd).join('\n') + '\n';

    // insert after last import, or at top
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLastImport = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, endOfLastImport + 1) + importsStr + content.slice(endOfLastImport + 1);
    } else {
      content = importsStr + content;
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log('Fixed', file);
  }
}
console.log('Changed files:', changedCount);
