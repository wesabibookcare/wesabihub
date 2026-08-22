const fs = require('fs');

// Dispatch Dashboard
let file = 'src/pages/dispatch/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/trustLevel: 'BRONZE'/g, "trustTier: 'BRONZE'");
content = content.replace(/dispatchId: 'DISP-000'/g, "");
fs.writeFileSync(file, content);

// Developer Page
file = 'src/pages/public/DeveloperPage.tsx';
content = fs.readFileSync(file, 'utf8');
content = content.replace(/status: 'ACTIVE',/, "status: 'APPROVED',");
content = content.replace(/webhookSecret: '',/, "");
fs.writeFileSync(file, content);

// Verify Rider
file = 'src/pages/public/VerifyRiderPage.tsx';
content = fs.readFileSync(file, 'utf8');
content = content.replace(/import \{ doc, getDoc \} from 'firebase\/firestore';/, "");
content = content.replace(/const docRef = doc\(db, 'users', id\);\n\s*const docSnap = await getDoc\(docRef\);\n\s*if \(docSnap\.exists\(\)\) \{/, "const docSnap = await userRepository.getById(id);\n if (docSnap) {");
fs.writeFileSync(file, content);
