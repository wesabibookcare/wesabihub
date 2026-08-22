const fs = require('fs');
let code = fs.readFileSync('src/engines/IntegrationEngine.ts', 'utf8');
code = code.replace(
  'await webhookLogRepository.create(`LOG-${Date.now()}`, {\\n      userId,',
  'await webhookLogRepository.create(`LOG-${Date.now()}`, {\\n      id: crypto.randomUUID(), userId,'
);
code = code.replace(
  'await webhookLogRepository.create(`LOG-${Date.now()}`, {\n      userId,',
  'await webhookLogRepository.create(`LOG-${Date.now()}`, {\n      id: crypto.randomUUID(),\n      userId,'
);
fs.writeFileSync('src/engines/IntegrationEngine.ts', code);
