const fs = require('fs');
const file = 'src/pages/admin/SecurityDashboardPage.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/await auditEngine\.getSecurityStats\(\)/, "{} // await auditEngine.getSecurityStats() is missing");
fs.writeFileSync(file, content);
