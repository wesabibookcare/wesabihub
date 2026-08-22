const fs = require('fs');

let file = 'src/pages/admin/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace imports
content = content.replace(/import \{ shipmentRepository \} from '\.\.\/\.\.\/services\/db\/ShipmentRepository';\n/, '');
content = content.replace(/import \{ hubPointRepository \} from '\.\.\/\.\.\/services\/db\/HubPointRepository';\n/, '');
content = content.replace(/import \{ disputeRepository \} from '\.\.\/\.\.\/services\/db\/DisputeRepository';\n/, '');
content = content.replace(/import \{ conversationRepository \} from '\.\.\/\.\.\/services\/db\/ConversationRepository';\n/, '');
content = content.replace(/import \{ notificationRepository \} from '\.\.\/\.\.\/services\/db\/NotificationRepository';\n/, '');
content = content.replace(/import \{ complaintRepository \} from '\.\.\/\.\.\/services\/db\/ComplaintRepository';\n/, '');

// Add adminEngine
content = content.replace(/import \{ auditEngine \} from '\.\.\/\.\.\/engines';/, "import { auditEngine } from '../../engines';\nimport { adminEngine } from '../../engines/AdminEngine';");

// Fix fetchData
content = content.replace(/const \[shipmentsData, hubsData, notificationsData, complaintsData\] = await Promise\.all\(\[\s+shipmentRepository\.getAll\(\)\.catch\(\(\) => \[\]\),\s+hubPointRepository\.getAll\(\)\.catch\(\(\) => \[\]\),\s+notificationRepository\.getAll\(\)\.catch\(\(\) => \[\]\),\s+complaintRepository\.getRecentComplaints\(5\)\.catch\(\(\) => \[\]\)\s+\]\);/,
  "const stats = await adminEngine.getDashboardStats();\n      const shipmentsData = stats.shipments;\n      const hubsData = stats.hubs;\n      const notificationsData = stats.notifications;\n      const complaintsData = stats.complaints;");

// Fix purge
content = content.replace(/await shipmentRepository\.deleteAll\(\);\s+await hubPointRepository\.deleteAll\(\);\s+await disputeRepository\.deleteAll\(\);\s+await conversationRepository\.deleteAll\(\);\s+await notificationRepository\.deleteAll\(\);\s+await complaintRepository\.deleteAll\(\);/,
  "await adminEngine.purgeAllData(user!.uid);");

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed AdminDashboard');
