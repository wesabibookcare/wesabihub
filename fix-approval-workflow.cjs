const fs = require('fs');
const file = 'src/components/admin/verification/ApprovalWorkflowTab.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import \{ writeBatch, doc \} from 'firebase\/firestore';/, "");
content = content.replace(/import \{ db \} from '@\/src\/lib\/firebase';/, "");

// Find and replace batch logic
// Actually, using userRepository.update and roleApplicationRepository.update in parallel is easier and cleaner
// But let's see what the original did
const batchRegex = /const batch = writeBatch\(db\);\n\s*batch\.update\(doc\(db, 'users', selectedApp\.userId\), userUpdate\);\n\s*batch\.update\(doc\(db, 'roleApplications', selectedApp\.id\), appUpdate\);\n\s*await batch\.commit\(\);/;

content = content.replace(batchRegex,
  `await userRepository.update(selectedApp.userId, userUpdate);
      await roleApplicationRepository.update(selectedApp.id, appUpdate);`);

fs.writeFileSync(file, content);
console.log('ApprovalWorkflowTab patched');
