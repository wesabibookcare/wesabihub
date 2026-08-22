const fs = require('fs');
let code = fs.readFileSync('src/engines/UserEngine.ts', 'utf8');
code = code.replace(
  'await addressRepository.create(id, data);',
  `try { await addressRepository.create(id, data); } catch (e) { console.error('addAddress error:', e); throw e; }`
);
fs.writeFileSync('src/engines/UserEngine.ts', code);
