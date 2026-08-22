const fs = require('fs');
let file = 'src/engines/ComplianceEngine.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace("import { PolicyVersion, UserConsent } from '../types';\nimport { PolicyVersion, UserConsent } from '../types';\n", "import { PolicyVersion, UserConsent } from '../types';\n");
content = content.replace("import { PolicyVersion, UserConsent } from '../types';\nimport {", "import {");
fs.writeFileSync(file, content, 'utf8');
