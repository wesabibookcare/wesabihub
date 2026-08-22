const fs = require('fs');
const file = 'src/pages/admin/UsersPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');

// Find the first "import React" after line 1
let realStartIdx = -1;
for (let i = 1; i < lines.length; i++) {
  if (lines[i].includes('import React')) {
    realStartIdx = i;
    break;
  }
}

if (realStartIdx !== -1) {
  let newContent = lines.slice(realStartIdx).join('\n');

  // Clean up the whitespace at the start if any
  newContent = newContent.trimStart();
  fs.writeFileSync(file, newContent);
  console.log('Trimmed top garbage');
}
