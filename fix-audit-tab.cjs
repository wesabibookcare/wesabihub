const fs = require('fs');
const file = 'src/components/admin/verification/AuditLogsTab.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import \{ collection, query, orderBy, limit, onSnapshot \} from 'firebase\/firestore';/, "");
content = content.replace(/import \{ db \} from '@\/src\/lib\/firebase';/, "import { auditRepository } from '@/src/services/db/AuditRepository';\nimport { orderBy, limit } from 'firebase/firestore';");

// find useEffect with onSnapshot
// Actually BaseRepository subscribeToQuery exists
content = content.replace(/const q = query\(collection\(db, 'auditLogs'\), orderBy\('timestamp', 'desc'\), limit\(100\)\);\n\s*const unsubscribe = onSnapshot\(q, \(snapshot\) => \{\n\s*const logsData = snapshot\.docs\.map\(doc => \(\{\n\s*id: doc\.id,\n\s*\.\.\.doc\.data\(\)\n\s*\}\)\) as AuditLog\[\];\n\s*setLogs\(logsData\);\n\s*setFilteredLogs\(logsData\);\n\s*setLoading\(false\);\n\s*\}\);/,
  `const unsubscribe = auditRepository.subscribeToQuery([orderBy('timestamp', 'desc'), limit(100)], (data) => {
        setLogs(data as any);
        setFilteredLogs(data as any);
        setLoading(false);
      });`);

fs.writeFileSync(file, content);
console.log('AuditLogsTab patched');
