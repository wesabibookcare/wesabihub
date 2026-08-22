const fs = require('fs');

function replaceInFile(file, replacements) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  fs.writeFileSync(file, content, 'utf8');
}

replaceInFile('src/services/db/DisputeRepository.ts', [
  { from: /interface Dispute \{/g, to: "export interface Dispute {" }
]);

replaceInFile('src/services/db/CourseRepository.ts', [
  { from: /interface Course \{/g, to: "export interface Course {" }
]);

replaceInFile('src/engines/InvitationEngine.ts', [
  { from: /Partial<Invitation>/g, to: "any" }
]);

replaceInFile('src/pages/point/EarningsPage.tsx', [
  { from: /import \{ paymentEngine \} from '@\/src\/engines';\nimport \{ paymentEngine \} from '@\/src\/engines';/g, to: "import { paymentEngine } from '@/src/engines';" }
]);
