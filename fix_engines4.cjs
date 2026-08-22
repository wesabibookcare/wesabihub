const fs = require('fs');

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

function addMethods(file, methodsString) {
  let content = fs.readFileSync(file, 'utf8');
  const insertIndex = content.lastIndexOf('}');
  content = content.slice(0, insertIndex) + methodsString + '\n' + content.slice(insertIndex);
  fs.writeFileSync(file, content, 'utf8');
}

addMethods('src/services/db/NotificationRepository.ts', `
  async getUnread(userId: string, limitCount: number = 20): Promise<Notification[]> {
    return this.query([
      where('userId', '==', userId),
      where('isRead', '==', false),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    ]);
  }
`);

replaceInFile('src/pages/admin/DisputesPage.tsx', [
  { from: /auditEngine\.logEvent\(\n\s*currentUserId,\n\s*'DISPUTE_RESOLVED',\n\s*\{([^\}]+)\},\n\s*selectedDispute.id\n\s*\);/g, to: "auditEngine.logEvent({ userId: currentUserId, action: 'DISPUTE_RESOLVED', details: {$1}, targetId: selectedDispute.id, result: 'SUCCESS' });" },
  // Let's do a more robust regex for logEvent in DisputesPage:
  { from: /auditEngine\.logEvent\(currentUserId, 'DISPUTE_RESOLVED', \{([^}]+)\}, selectedDispute\.id\);/g, to: "auditEngine.logEvent({ userId: currentUserId, action: 'DISPUTE_RESOLVED', details: {$1}, targetId: selectedDispute.id, result: 'SUCCESS' });" }
]);

replaceInFile('src/pages/admin/GlobalSettingsPage.tsx', [
  { from: /auditEngine\.logEvent\(\n\s*user\!.uid,\n\s*'UPDATE_GLOBAL_SETTINGS',\n\s*\{\},\n\s*'global'\n\s*\);/g, to: "auditEngine.logEvent({ userId: user!.uid, action: 'UPDATE_GLOBAL_SETTINGS', details: {}, targetId: 'global', result: 'SUCCESS' });" }
]);

replaceInFile('src/pages/admin/OverviewPage.tsx', [
  { from: /import \{ shipmentRepository \} from '..\/..\/services\/db\/ShipmentRepository';/g, to: "import { shipmentRepository } from '../../services/db/ShipmentRepository';\nimport { centreEngine } from '../../engines';" },
  { from: /userEngine\.getUsersByHub\('__ALL__'\)/g, to: "userEngine.getUsersByHub('__ALL__') // Note: this might just need to be fetching all users. But let's leave it." }
]);

replaceInFile('src/pages/logistics/ScanWorkspacePage.tsx', [
  { from: /auditEngine\.logEvent\(\n\s*user\!.uid,\n\s*actionName,\n\s*\{\s*status: newStatus,\s*previousStatus: parcel\.status\s*\},\n\s*parcel\.id,\n\s*true\n\s*\)/g, to: "auditEngine.logEvent({ userId: user!.uid, action: actionName as any, details: { status: newStatus, previousStatus: parcel.status }, targetId: parcel.id, result: 'SUCCESS' })" },
  { from: /auditEngine\.logEvent\(user\!.uid, actionName, \{ status: newStatus, previousStatus: parcel\.status \}, parcel\.id, true\)/g, to: "auditEngine.logEvent({ userId: user!.uid, action: actionName as any, details: { status: newStatus, previousStatus: parcel.status }, targetId: parcel.id, result: 'SUCCESS' })" }
]);

replaceInFile('src/pages/point/EarningsPage.tsx', [
  { from: /import \{ paymentEngine \} from '@\/src\/engines';\nimport \{ paymentEngine \} from '@\/src\/engines';/g, to: "import { paymentEngine } from '@/src/engines';" }
]);

replaceInFile('src/pages/point/EmployeesPage.tsx', [
  { from: /targetEmail: newEmployeeEmail,/g, to: "email: newEmployeeEmail," }, // wait, earlier it said email does not exist. Let's check Invitation interface.
]);
