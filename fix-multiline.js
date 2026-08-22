const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.{ts,tsx}');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // replace "import { \nimport {" with "import {"
  content = content.replace(/import\s*\{\s*import\s*\{/g, 'import {');

  // Also, for lines that are just "  Send," or "  Search," that were stripped of "import {",
  // we actually need to fix the multi-line imports.
  // The earlier dedupe script extracted lines starting with "import ".
  // This left lines like "  Send," stranded in otherLines.

  fs.writeFileSync(file, content, 'utf8');
}
