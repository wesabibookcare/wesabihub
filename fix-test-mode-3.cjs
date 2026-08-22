const fs = require('fs');
const file = 'src/pages/admin/TestModePage.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/addDoc\(collection\(db, 'auditLogs'\), \{[\s\S]*?\}\);/g, "console.log('Skipping log');");
fs.writeFileSync(file, content);
