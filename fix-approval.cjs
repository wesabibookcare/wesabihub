const fs = require('fs');
const file = 'src/components/admin/verification/ApprovalWorkflowTab.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const batch = writeBatch\(db\);\n\s*profileChanges\.forEach\(change => \{\n\s*if \(change\.id\) \{\n\s*batch\.update\(doc\(db, 'profile_changes', change\.id\), \{ status: 'SEEN' \}\);\n\s*\}\n\s*\}\);\n\s*await batch\.commit\(\);/;

content = content.replace(regex, `await Promise.all(profileChanges.map(change => {
        if (change.id) {
           return profileUpdateAuditService.markChangeAsSeen(change.id);
        }
      }));`);

fs.writeFileSync(file, content);
console.log('ApprovalWorkflowTab fixed');
