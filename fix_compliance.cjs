const fs = require('fs');
let file = 'src/engines/ComplianceEngine.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { PolicyVersion, UserConsent } from '../types';\nimport { policyVersionRepository } from '../services/db/PolicyVersionRepository';\nimport { PolicyVersion, UserConsent } from '../types';\nimport { userConsentRepository } from '../services/db/UserConsentRepository';", "import { policyVersionRepository } from '../services/db/PolicyVersionRepository';\nimport { PolicyVersion, UserConsent } from '../types';\nimport { userConsentRepository } from '../services/db/UserConsentRepository';");
fs.writeFileSync(file, content, 'utf8');
