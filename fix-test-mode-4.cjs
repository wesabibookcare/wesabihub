const fs = require('fs');
const file = 'src/pages/admin/TestModePage.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\/\/ Push simulated audits to real Firestore if in "Test Mode - Live Logger" and DB is online\n\s*if \(dbStatus\.isOnline\) \{[\s\S]*?\/\/ Run a single simulation step/g;

content = content.replace(regex, `// Push simulated audits to real Firestore if in "Test Mode - Live Logger" and DB is online
    if (dbStatus.isOnline) {
      console.log('Skipping log');
    }
  };

  // Run a single simulation step`);

fs.writeFileSync(file, content);
