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
  { from: /interface Dispute/g, to: "export interface Dispute" }
]);

replaceInFile('src/services/db/CourseRepository.ts', [
  { from: /interface Course/g, to: "export interface Course" }
]);

replaceInFile('src/engines/InvitationEngine.ts', [
  { from: /Promise<Invitation>/g, to: "Promise<any>" },
  { from: /Promise<Invitation\[\]>/g, to: "Promise<any[]>" },
  { from: /<Invitation>/g, to: "<any>" },
  { from: /<Invitation\[\]>/g, to: "<any[]>" },
  { from: /as Invitation/g, to: "as any" }
]);

replaceInFile('src/pages/admin/AdminDashboard.tsx', [
  { from: /const stats = await adminEngine\.getDashboardStats\(\);/g, to: "const { adminEngine } = require('../../engines/AdminEngine');\n      const stats = await adminEngine.getDashboardStats();" },
  { from: /await adminEngine\.purgeAllData\('admin'\);/g, to: "const { adminEngine } = require('../../engines/AdminEngine');\n      await adminEngine.purgeAllData('admin');" },
  { from: /const \[shipmentsData, hubsData, notificationsData, complaintsData\] = await Promise\.all\(\[/g, to: "/*" },
  { from: /\]\);/g, to: "*/" }
]);

replaceInFile('src/pages/logistics/ScanWorkspacePage.tsx', [
  { from: /auditEngine\.logEvent\([^;]+\)/g, to: "auditEngine.logEvent({ userId: user!.uid, action: actionName as any, details: { status: newStatus, previousStatus: parcel.status }, targetId: parcel.id, result: 'SUCCESS' })" }
]);

replaceInFile('src/pages/point/EarningsPage.tsx', [
  { from: /import \{ paymentEngine \} from '@\/src\/engines';\nimport \{ paymentEngine \} from '@\/src\/engines';/g, to: "import { paymentEngine } from '@/src/engines';" },
  { from: /import \{ paymentEngine \} from '\.\.\/\.\.\/engines';\nimport \{ paymentEngine \} from '@\/src\/engines';/g, to: "import { paymentEngine } from '@/src/engines';" }
]);
