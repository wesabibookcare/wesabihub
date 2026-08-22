const fs = require('fs');

let file = 'src/pages/admin/DisputesPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { disputeRepository } from '../../services/db/DisputeRepository';", "import { disputeEngine } from '../../engines/DisputeEngine';\nimport { disputeRepository } from '../../services/db/DisputeRepository';\nimport { paymentProtectionRepository } from '../../services/db/PaymentProtectionRepository';");

content = content.replace("import { paymentProtectionRepository } from '../../services/db/PaymentProtectionRepository';", "");

fs.writeFileSync(file, content, 'utf8');
