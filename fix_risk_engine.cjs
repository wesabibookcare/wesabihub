const fs = require('fs');
let file = 'src/engines/RiskEngine.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { trustFactorRepository } from '../services/db/TrustFactorRepository';", "import { trustFactorRepository } from '../services/db/TrustFactorRepository';\nimport { rankingFactorRepository } from '../services/db/RankingFactorRepository';");

const methods = `
  async getAllTrustFactors() {
    return trustFactorRepository.getAll();
  }

  async getAllRankingFactors() {
    return rankingFactorRepository.getAll();
  }

  async updateTrustFactor(id: string, updates: any, adminId: string) {
    await trustFactorRepository.update(id, updates);
    const { auditEngine } = require('./AuditEngine');
    await auditEngine.logEvent({ userId: adminId, action: 'UPDATE_TRUST_FACTOR', details: { id, updates }, result: 'SUCCESS' });
  }

  async updateRankingFactor(id: string, updates: any, adminId: string) {
    await rankingFactorRepository.update(id, updates);
    const { auditEngine } = require('./AuditEngine');
    await auditEngine.logEvent({ userId: adminId, action: 'UPDATE_RANKING_FACTOR', details: { id, updates }, result: 'SUCCESS' });
  }
`;
const insertIndex = content.lastIndexOf('}');
content = content.slice(0, insertIndex) + methods + '\n' + content.slice(insertIndex);

fs.writeFileSync(file, content, 'utf8');

// Now update TrustRankingPage
let page = 'src/pages/admin/TrustRankingPage.tsx';
let pContent = fs.readFileSync(page, 'utf8');
pContent = pContent.replace(/import \{ trustFactorRepository \} from '@\/src\/services\/db\/TrustFactorRepository';/, "import { riskEngine } from '@/src/engines';");
pContent = pContent.replace(/import \{ rankingFactorRepository \} from '@\/src\/services\/db\/RankingFactorRepository';/, "");
pContent = pContent.replace(/trustFactorRepository\.getAll\(\)/g, "riskEngine.getAllTrustFactors()");
pContent = pContent.replace(/rankingFactorRepository\.getAll\(\)/g, "riskEngine.getAllRankingFactors()");
pContent = pContent.replace(/trustFactorRepository\.update\(([^,]+),\s*([^)]+)\)/g, "riskEngine.updateTrustFactor($1, $2, 'admin')");
pContent = pContent.replace(/rankingFactorRepository\.update\(([^,]+),\s*([^)]+)\)/g, "riskEngine.updateRankingFactor($1, $2, 'admin')");
fs.writeFileSync(page, pContent, 'utf8');
