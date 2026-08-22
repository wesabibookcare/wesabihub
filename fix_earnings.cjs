const fs = require('fs');

let file = 'src/pages/point/EarningsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { centreEngine, paymentEngine } from '@/src/engines';\nimport { paymentEngine } from '@/src/engines';", "import { centreEngine, paymentEngine } from '@/src/engines';");

fs.writeFileSync(file, content, 'utf8');
