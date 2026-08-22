const fs = require('fs');

const files = [
  'src/pages/point/InventoryPage.tsx',
  'src/pages/customer/ShipmentHistoryPage.tsx',
  'src/pages/merchant/WalletPage.tsx',
  'src/pages/merchant/OrdersPage.tsx',
  'src/pages/logistics/PayoutsPage.tsx',
  'src/pages/logistics/OwnerDashboard.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  if (content.includes("await import('json2csv')")) {
    // Add import { exportToCsv } from '@/src/lib/utils'; if not exists
    if (!content.includes('exportToCsv')) {
      content = content.replace(/import \{ cn \} from '@\/src\/lib\/utils';/, "import { cn, exportToCsv } from '@/src/lib/utils';");
    }

    // Replace logic
    const regex = /const \{ Parser \} = await import\('json2csv'\);[\s\S]*?document\.body\.removeChild\(link\);/g;

    content = content.replace(regex, (match) => {
      // Find the filename pattern
      const filenameMatch = match.match(/setAttribute\('download',\s*(`[^`]+`|'[^']+')\);/);
      const filename = filenameMatch ? filenameMatch[1] : '`export.csv`';

      return `exportToCsv(${filename}, csvData);`;
    });

    fs.writeFileSync(file, content);
    console.log(`Fixed ${file}`);
  }
}
