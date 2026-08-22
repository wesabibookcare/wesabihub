const fs = require('fs');
const file = 'src/pages/admin/SecurityDashboardPage.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('userRepository')) {
  content = content.replace("import { auditEngine } from '@/src/engines/AuditEngine';", "import { auditEngine } from '@/src/engines/AuditEngine';\nimport { userRepository } from '@/src/services/db/UserRepository';");
}

content = content.replace(/const userRef = doc\(db, 'users', actionUserId\);\n\s*await updateDoc\(userRef, \{\n\s*status: 'SUSPENDED',\n\s*updatedAt: new Date\(\)\.toISOString\(\)\n\s*\}\);/,
  "await userRepository.update(actionUserId, { status: 'SUSPENDED', updatedAt: new Date().toISOString() } as any);");

fs.writeFileSync(file, content);
