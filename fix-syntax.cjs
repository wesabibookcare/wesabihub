const fs = require('fs');

function fix(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Remove stranded "import {" lines that have no matching closing brace before the next import
  const lines = content.split('\n');
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === 'import {') {
       // if it's stranded, remove it. But wait, maybe the next line is an import?
       if (i + 1 < lines.length && lines[i+1].trim().startsWith('import ')) {
         continue; // drop this line
       }
    }

    // For stranded items, let's just find the first `} from 'lucide-react'` and see if it misses `import {`
    // Actually, it's easier: if a line is `  Send,` and the previous line isn't an import and doesn't end with `,` and isn't `{`

    newLines.push(lines[i]);
  }

  content = newLines.join('\n');

  // The lucide-react block:
  content = content.replace(/(\n\s+[A-Z][a-zA-Z0-9]+,\s*\n\s+[A-Z][a-zA-Z0-9]+)/, '\nimport {$1');

  // The engines block:
  content = content.replace(/(\n\s+[a-z][a-zA-Z0-9]+Engine,?\s*\n\s*[a-z][a-zA-Z0-9]+Engine)/, '\nimport {$1');

  // Fix double imports
  content = content.replace(/import\s*\{\s*import\s*\{/g, 'import {');

  fs.writeFileSync(file, content);
}

const filesToFix = [
  'src/engines/BulkIntakeEngine.ts',
  'src/engines/ConfigurationEngine.ts',
  'src/engines/UserEngine.ts',
  'src/pages/admin/RevenueReportsPage.tsx',
  'src/pages/admin/UsersPage.tsx',
  'src/pages/customer/Dashboard.tsx',
  'src/pages/customer/SendParcelPage.tsx',
  'src/pages/logistics/OwnerDashboard.tsx',
  'src/pages/merchant/Dashboard.tsx',
  'src/pages/merchant/TrackShipmentsPage.tsx',
  'src/pages/point/BulkIntakePage.tsx',
  'src/pages/point/OwnerDashboard.tsx',
  'src/pages/point/ReleaseParcelPage.tsx'
];

for (const file of filesToFix) {
  try {
    fix(file);
    console.log('Fixed', file);
  } catch (e) {
    console.error(e);
  }
}
