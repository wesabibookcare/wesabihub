const fs = require('fs');

let page = 'src/pages/admin/ComplaintCentrePage.tsx';
let pContent = fs.readFileSync(page, 'utf8');

pContent = pContent.replace(/updatedAt: new Date\(, 'admin'\)\.toISOString\(\)\n      \}\);/g, "updatedAt: new Date().toISOString()\n      }, 'admin');");

fs.writeFileSync(page, pContent, 'utf8');
