const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.{ts,tsx}');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  const importLines = content.split('\n').filter(line => line.trim().startsWith('import '));
  const otherLines = content.split('\n').filter(line => !line.trim().startsWith('import '));

  const uniqueImports = Array.from(new Set(importLines));

  if (uniqueImports.length !== importLines.length) {
    const newContent = uniqueImports.join('\n') + '\n' + otherLines.join('\n');
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Fixed', file);
  }
}
