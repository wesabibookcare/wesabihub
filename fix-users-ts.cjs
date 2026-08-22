const fs = require('fs');
const file = 'src/pages/admin/UsersPage.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/import \{ auditEngine \} from '\.\.\/\.\.\/services\/AuditEngine';/, "");
fs.writeFileSync(file, content);
