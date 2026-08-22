const fs = require('fs');
const file = 'src/pages/admin/TestModePage.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `const shipSnap = await getCountFromServer(collection(db, 'shipments'));
      const dispSnap = await getCountFromServer(collection(db, 'disputes'));
      const auditSnap = await getCountFromServer(collection(db, 'auditLogs'));

      setDbStats({
        shipments: shipSnap.data().count,
        disputes: dispSnap.data().count,
        auditLogs: auditSnap.data().count
      });`;

const replacement = `setDbStats({ shipments: 0, disputes: 0, auditLogs: 0 });`;

content = content.replace(target, replacement);

// And replace db imports
content = content.replace(/import \{ db \} from '\.\.\/\.\.\/lib\/firebase';/, "");
content = content.replace(/import \{ doc, setDoc, collection, addDoc, getDocs, query, where, orderBy, limit, getCountFromServer \} from 'firebase\/firestore';/, "");

fs.writeFileSync(file, content);
