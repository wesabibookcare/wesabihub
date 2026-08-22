const fs = require('fs');

let file = 'src/pages/admin/OverviewPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { shipmentRepository } from '../../services/db/ShipmentRepository';", "import { adminEngine } from '../../engines/AdminEngine';");
content = content.replace("import { hubPointRepository } from '../../services/db/HubPointRepository';", "");
content = content.replace(/shipmentRepository\.getAll\(\)/g, "adminEngine.getDashboardStats().then(s => s.shipments)");
content = content.replace(/hubPointRepository\.getAll\(\)/g, "adminEngine.getDashboardStats().then(s => s.hubs)");

fs.writeFileSync(file, content, 'utf8');
