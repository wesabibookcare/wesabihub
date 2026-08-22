const fs = require('fs');

function replaceInFile(file, replacements) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}

// customer/ReturnRequestPage.tsx & TrackParcelPage.tsx & logitics/ScanWorkspacePage.tsx & EarningsPage
replaceInFile('src/pages/customer/ReturnRequestPage.tsx', [
  { from: /import \{ parcelEngine \} from '@\/src\/engines';\nimport \{ parcelEngine \} from '@\/src\/engines';/g, to: "import { parcelEngine } from '@/src/engines';" }
]);

replaceInFile('src/pages/customer/TrackParcelPage.tsx', [
  { from: /import \{ parcelEngine \} from '@\/src\/engines';\nimport \{ parcelEngine \} from '@\/src\/engines';/g, to: "import { parcelEngine } from '@/src/engines';" }
]);

replaceInFile('src/pages/logistics/ScanWorkspacePage.tsx', [
  { from: /import \{ parcelEngine \} from '@\/src\/engines';\nimport \{ parcelEngine \} from '@\/src\/engines';/g, to: "import { parcelEngine } from '@/src/engines';" }
]);

replaceInFile('src/pages/point/EarningsPage.tsx', [
  { from: /import \{ paymentEngine \} from '@\/src\/engines';\nimport \{ paymentEngine \} from '@\/src\/engines';/g, to: "import { paymentEngine } from '@/src/engines';" }
]);
