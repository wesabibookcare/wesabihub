const fs = require('fs');

function addImports(file, importsString) {
  let content = fs.readFileSync(file, 'utf8');
  content = importsString + '\n' + content;
  fs.writeFileSync(file, content, 'utf8');
}

function replaceInFile(file, replacements) {
  if (!fs.existsSync(file)) return;
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

replaceInFile('src/engines/ComplianceEngine.ts', [
  { from: /import \{/g, to: "import { PolicyVersion, UserConsent } from '../types';\nimport {" }
]);

replaceInFile('src/engines/InvitationEngine.ts', [
  { from: /StaffInvitation/g, to: "Invitation" }
]);

replaceInFile('src/engines/NotificationEngine.ts', [
  { from: /notificationService\.getUnread/g, to: "notificationRepository.getUnread" },
  { from: /import \{ NotificationEngine \} from '\.\/index';/g, to: "" },
  { from: /import \{ notificationRepository \} from '\.\.\/services\/db\/NotificationRepository';/g, to: "import { notificationRepository } from '../services/db/NotificationRepository';" }
]);

addImports('src/engines/NotificationEngine.ts', "import { notificationRepository } from '../services/db/NotificationRepository';");

replaceInFile('src/engines/PaymentEngine.ts', [
  { from: /paymentProtectionEngine\.getByMerchantId/g, to: "paymentProtectionRepository.getByMerchantId" }
]);
addImports('src/engines/PaymentEngine.ts', "import { paymentProtectionRepository } from '../services/db/PaymentProtectionRepository';");

replaceInFile('src/engines/RiskEngine.ts', [
  { from: /import \{/g, to: "import { trustFactorRepository } from '../services/db/TrustFactorRepository';\nimport {" }
]);

console.log('Fixed engines3');
