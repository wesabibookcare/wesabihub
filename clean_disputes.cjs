const fs = require('fs');

let file = 'src/pages/admin/DisputesPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import \{ disputeRepository \} from '\.\.\/\.\.\/services\/db\/DisputeRepository';\n/g, "");
content = content.replace(/import \{ paymentProtectionRepository \} from '\.\.\/\.\.\/services\/db\/PaymentProtectionRepository';\n/g, "");

fs.writeFileSync(file, content, 'utf8');
