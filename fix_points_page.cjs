const fs = require('fs');

let file = 'src/pages/admin/PointsRatingPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { pointRuleRepository } from '@/src/services/db/PointRuleRepository';", "import { pointsEngine } from '@/src/engines/PointsEngine';");
content = content.replace("import { starThresholdRepository } from '@/src/services/db/StarThresholdRepository';", "");
content = content.replace(/pointRuleRepository\.getAll\(\)/g, "pointsEngine.getAllRules()");
content = content.replace(/starThresholdRepository\.getAll\(\)/g, "pointsEngine.getAllThresholds()");
content = content.replace(/pointRuleRepository\.update\(([^,]+),\s*([^)]+)\)/g, "pointsEngine.updateRule($1, $2, 'admin')");
content = content.replace(/starThresholdRepository\.update\(([^,]+),\s*([^)]+)\)/g, "pointsEngine.updateThreshold($1, $2, 'admin')");
content = content.replace(/starThresholdRepository\.create\(([^,]+),\s*([^)]+)\)/g, "pointsEngine.createThreshold($1, $2, 'admin')");

fs.writeFileSync(file, content, 'utf8');
