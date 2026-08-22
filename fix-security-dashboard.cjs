const fs = require('fs');
const file = 'src/pages/admin/SecurityDashboardPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import \{ collection, query, orderBy, limit, getDocs, doc, updateDoc, setDoc \} from 'firebase\/firestore';/, "");
content = content.replace(/import \{ db \} from '\.\.\/\.\.\/lib\/firebase';/, "");
content = content.replace(/import \{ auditEngine, HardenedAuditLog \} from '\.\.\/\.\.\/services\/AuditEngine';/, "import { auditEngine } from '@/src/engines/AuditEngine';\nimport { HardenedAuditLog } from '@/src/services/AuditEngine';");

// Replace getDocs(q) with auditEngine.getRecentLogs(100)
content = content.replace(/const q = query\(collection\(db, 'auditLogs'\), orderBy\('timestamp', 'desc'\), limit\(100\)\);\n\s*const snapshot = await getDocs\(q\);\n\s*const fetchedLogs = snapshot\.docs\.map\(doc => doc\.data\(\) as HardenedAuditLog\);/,
  "const fetchedLogs = await auditEngine.getRecentLogs(100);");

fs.writeFileSync(file, content);
console.log('SecurityDashboardPage patched');
