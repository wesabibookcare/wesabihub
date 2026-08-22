const fs = require('fs');
const file = 'src/pages/public/DeveloperPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import \{ doc, getDoc, setDoc, updateDoc, collection, query, where, onSnapshot, getDocs \} from 'firebase\/firestore';/, "");
content = content.replace(/import \{ db \} from '@\/src\/lib\/firebase';/, "");

if (!content.includes('developerProfileRepository')) {
  content = content.replace("import { useAuth } from '@/src/context/AuthContext';", "import { useAuth } from '@/src/context/AuthContext';\nimport { developerProfileRepository } from '@/src/services/db/DeveloperProfileRepository';\nimport { auditEngine } from '@/src/engines/AuditEngine';");
}

// Subscribe
content = content.replace(/const docRef = doc\(db, 'developerProfiles', user\.uid\);\n\s*const unsubscribe = onSnapshot\(docRef, \(doc\) => \{\n\s*if \(doc\.exists\(\)\) \{\n\s*setProfile\(doc\.data\(\) as DeveloperProfile\);\n\s*\}\n\s*\}\);/,
  "const unsubscribe = developerProfileRepository.subscribe(user.uid, (data) => {\n        if (data) setProfile(data);\n      });");

// handleGenerateKeys
content = content.replace(/await setDoc\(doc\(db, 'developerProfiles', user\.uid\), profile\);/, "await developerProfileRepository.create(user.uid, profile);");
content = content.replace(/await setDoc\(doc\(collection\(db, 'auditLogs'\)\), \{[\s\S]*?\}\);/g, "await auditEngine.logEvent({ userId: user.uid, action: 'DEVELOPER_KEYS_GENERATED', details: { message: 'Developer keys generated' }, result: 'SUCCESS' });");

// handleSaveWebhook
content = content.replace(/await updateDoc\(doc\(db, 'developerProfiles', user\.uid\), \{[\s\S]*?\}\);/, "await developerProfileRepository.update(user.uid, { webhookUrl, webhookSecret });");
content = content.replace(/await setDoc\(doc\(collection\(db, 'auditLogs'\)\), \{[\s\S]*?\}\);/, "await auditEngine.logEvent({ userId: user.uid, action: 'WEBHOOK_CONFIGURED', details: { webhookUrl }, result: 'SUCCESS' });");

// handleToggleMode
content = content.replace(/await updateDoc\(doc\(db, 'developerProfiles', user\.uid\), \{\n\s*mode: newMode\n\s*\}\);/, "await developerProfileRepository.update(user.uid, { mode: newMode });");

// handleRegenerateKeys
content = content.replace(/await updateDoc\(doc\(db, 'developerProfiles', user\.uid\), \{\n\s*livePublicKey: `pk_live_\$\{Array\.from\(\{length: 24\}, \(\) => Math\.random\(\)\.toString\(36\)\.charAt\(2\)\)\.join\(''\)\}`,\n\s*liveSecretKey: `sk_live_\$\{Array\.from\(\{length: 32\}, \(\) => Math\.random\(\)\.toString\(36\)\.charAt\(2\)\)\.join\(''\)\}`\n\s*\}\);/, "await developerProfileRepository.update(user.uid, { livePublicKey: `pk_live_${Array.from({length: 24}, () => Math.random().toString(36).charAt(2)).join('')}`, liveSecretKey: `sk_live_${Array.from({length: 32}, () => Math.random().toString(36).charAt(2)).join('')}` });");

fs.writeFileSync(file, content);
console.log('DeveloperPage patched');
