const fs = require('fs');
const file = 'src/pages/admin/CommissionManagementPage.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/createdAt: serverTimestamp\(\)/, "createdAt: new Date().toISOString()");
fs.writeFileSync(file, content);
console.log('Fixed CommissionManagementPage');
