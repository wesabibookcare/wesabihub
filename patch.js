const fs = require('fs');
const file = 'src/pages/point/InventoryPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// The handleExport method we want to move
const handleExportRegex = /\s*const handleExport = async \(\) => \{[\s\S]*?\n  \};\n/;

const match = content.match(handleExportRegex);
if (match) {
  content = content.replace(match[0], '');

  // Insert after filteredParcels
  const insertTarget = '  const getStatusBadge = (status: string) => {';
  content = content.replace(insertTarget, match[0].trim() + '\n\n' + insertTarget);
  fs.writeFileSync(file, content);
  console.log('patched');
} else {
  console.log('not found');
}
