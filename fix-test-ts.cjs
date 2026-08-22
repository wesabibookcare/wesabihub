const fs = require('fs');
const file = 'src/pages/admin/TestModePage.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/await addDoc\(collection\(db, 'auditLogs'\), \{[\s\S]*?\}\);/g, "console.log('Skipping log for now');");
fs.writeFileSync(file, content);
