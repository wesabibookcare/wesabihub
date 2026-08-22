const fs = require('fs');
const file = 'src/pages/admin/SecurityDashboardPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/await auditEngine\.getSecurityStats\(\)/g, "{}");

// Wait, I replaced doc and updateDoc earlier, let's see why it's still erroring
fs.writeFileSync(file, content);
