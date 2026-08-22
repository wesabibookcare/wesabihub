const fs = require('fs');
const file = 'src/pages/public/VerifyRiderPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const docSnap = await getDoc\(doc\(db, 'users', riderId\)\);/, "const docSnap = await userRepository.getById(riderId as string);");
content = content.replace(/if \(docSnap\.exists\(\)\) \{\n\s*const data = docSnap\.data\(\);/, "if (docSnap) {\n          const data = docSnap;");

fs.writeFileSync(file, content);
