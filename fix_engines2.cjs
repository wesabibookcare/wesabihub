const fs = require('fs');

function addMethods(file, methodsString) {
  let content = fs.readFileSync(file, 'utf8');
  // insert before last closing brace
  const insertIndex = content.lastIndexOf('}');
  content = content.slice(0, insertIndex) + methodsString + '\n' + content.slice(insertIndex);
  fs.writeFileSync(file, content, 'utf8');
}

addMethods('src/engines/ConfigurationEngine.ts', `
  subscribeToCountries(callback: (data: any[]) => void): () => void {
    const { countryRepository } = require('../services/db/CountryRepository');
    return countryRepository.subscribeToCountries(callback);
  }
`);

addMethods('src/engines/AuditEngine.ts', `
  async getAll(conditions?: any[]): Promise<any[]> {
    const { auditRepository } = require('../services/db/AuditRepository');
    return await auditRepository.getAll(conditions);
  }
`);

console.log('Fixed engines2');
