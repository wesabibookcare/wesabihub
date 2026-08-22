const fs = require('fs');
const file = 'src/pages/admin/GlobalSettingsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import \{ orderBy, limit \} from 'firebase\/firestore';/, "");
content = content.replace(/auditEngine\.getAll\(\[orderBy\('timestamp', 'desc'\), limit\(50\)\]\)/g, "auditEngine.getRecentLogs(50)");

fs.writeFileSync(file, content);
console.log('GlobalSettingsPage patched');
