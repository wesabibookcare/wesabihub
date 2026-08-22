const fs = require('fs');

function replaceInFile(file, replacements) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  fs.writeFileSync(file, content, 'utf8');
}

replaceInFile('src/engines/ComplianceEngine.ts', [
  { from: /import \{/g, to: "import { PolicyVersion, UserConsent } from '../types';\nimport {" }
]);

replaceInFile('src/engines/ContentEngine.ts', [
  { from: /return knowledgeRepository\.getByCategory\(category\);/g, to: "return knowledgeRepository.query([{ field: 'category', operator: '==', value: category }]);" },
  { from: /Promise<string>/g, to: "Promise<any>" }
]);

replaceInFile('src/services/db/DisputeRepository.ts', [
  { from: /interface Dispute/g, to: "export interface Dispute" }
]);

replaceInFile('src/services/db/CourseRepository.ts', [
  { from: /interface Course/g, to: "export interface Course" }
]);

replaceInFile('src/pages/admin/AdminDashboard.tsx', [
  { from: /notificationRepository\.getAll\(\)\.catch\(\(\) => \[\]\),/g, to: "" },
  { from: /complaintRepository\.getRecentComplaints\(5\)\.catch\(\(\) => \[\]\)/g, to: "" },
  { from: /await adminEngine\.purgeAllData\(user!\.uid\);/g, to: "await adminEngine.purgeAllData('admin');" },
  { from: /const stats = await adminEngine\.getDashboardStats\(\);/g, to: "const { adminEngine } = require('../../engines/AdminEngine');\n      const stats = await adminEngine.getDashboardStats();" }
]);

replaceInFile('src/pages/admin/GlobalSettingsPage.tsx', [
  { from: /user!\.uid/g, to: "'admin'" }
]);

replaceInFile('src/pages/point/EarningsPage.tsx', [
  { from: /import \{ paymentEngine \} from '@\/src\/engines';\nimport \{ paymentEngine \} from '@\/src\/engines';/g, to: "import { paymentEngine } from '@/src/engines';" }
]);

replaceInFile('src/pages/admin/AdminContentCMSPage.tsx', [
  { from: /const content = await contentEngine\.getPageContent\(page\);/g, to: "const content: any = await contentEngine.getPageContent(page);" }
]);

replaceInFile('src/pages/admin/DisputesPage.tsx', [
  { from: /const unsubscribe = disputeEngine\.subscribeToDisputes\(\[\], \(allDisputes\)/g, to: "const unsubscribe = disputeEngine.subscribeToDisputes((allDisputes: any)" },
  { from: /const unsubscribe = disputeEngine\.subscribeToDisputes\(\(allDisputes\)/g, to: "const unsubscribe = disputeEngine.subscribeToDisputes((allDisputes: any)" }
]);

replaceInFile('src/pages/logistics/ScanWorkspacePage.tsx', [
  { from: /auditEngine\.logEvent\([^;]+\)/g, to: "auditEngine.logEvent({ userId: user!.uid, action: actionName as any, details: { status: newStatus, previousStatus: parcel.status }, targetId: parcel.id, result: 'SUCCESS' })" }
]);
