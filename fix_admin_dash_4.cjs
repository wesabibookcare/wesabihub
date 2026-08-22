const fs = require('fs');

let file = 'src/pages/admin/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/setNotifications\(\[\*\//g, "setNotifications([]);");

fs.writeFileSync(file, content, 'utf8');
