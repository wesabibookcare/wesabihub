const fs = require('fs');
let file = 'src/pages/logistics/ScanWorkspacePage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("auditEngine.logEvent({ userId: user!.uid, action: actionName as any, details: { status: newStatus, previousStatus: parcel.status }, targetId: parcel.id, result: 'SUCCESS' })",
  "auditEngine.logEvent({ userId: user!.uid, action: actionName as any, details: { status: newStatus, previousStatus: parcel.status }, targetId: parcel.id, result: 'SUCCESS' });");

fs.writeFileSync(file, content, 'utf8');
