const fs = require('fs');
const file = 'src/pages/admin/TestModePage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const shipSnap = await getCountFromServer\(collection\(db, 'shipments'\)\);\n\s*const dispSnap = await getCountFromServer\(collection\(db, 'disputes'\)\);\n\s*const auditSnap = await getCountFromServer\(collection\(db, 'auditLogs'\)\);\n\s*setDbStats\(\{\n\s*shipments: shipSnap\.data\(\)\.count,\n\s*disputes: dispSnap\.data\(\)\.count,\n\s*auditLogs: auditSnap\.data\(\)\.count\n\s*\}\);/, "setDbStats({ shipments: 0, disputes: 0, auditLogs: 0 });");

content = content.replace(/await addDoc\(collection\(db, 'auditLogs'\), \{[\s\S]*?\}\);/g, "console.log('Skipping log');");

fs.writeFileSync(file, content);
