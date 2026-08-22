const fs = require('fs');
const file = 'src/engines/AuditEngine.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('getRecentLogs')) {
  const insertTarget = 'async getAll(conditions?: any[]): Promise<any[]> {';
  const newMethod = `
  async getRecentLogs(limitCount: number = 50): Promise<any[]> {
    const { auditRepository } = require('../services/db/AuditRepository');
    const { orderBy, limit } = require('firebase/firestore');
    return await auditRepository.getAll([orderBy('timestamp', 'desc'), limit(limitCount)]);
  }

  `;
  content = content.replace(insertTarget, newMethod + insertTarget);
  fs.writeFileSync(file, content);
  console.log('AuditEngine patched');
}
