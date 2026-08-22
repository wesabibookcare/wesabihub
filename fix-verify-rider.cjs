const fs = require('fs');
const file = 'src/pages/public/VerifyRiderPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import \{ db \} from '\.\.\/\.\.\/lib\/firebase';/, "");
content = content.replace(/import \{ doc, getDoc \} from 'firebase\/firestore';/, "");

if (!content.includes('userRepository')) {
  content = content.replace("import { Badge } from '../../components/ui/Badge';", "import { Badge } from '../../components/ui/Badge';\nimport { userRepository } from '@/src/services/db/UserRepository';");
}

content = content.replace(/const docRef = doc\(db, 'users', id\);\n\s*const docSnap = await getDoc\(docRef\);\n\s*if \(docSnap\.exists\(\)\) \{\n\s*const data = docSnap\.data\(\);/,
  "const data = await userRepository.getById(id);\n        if (data) {");

fs.writeFileSync(file, content);
console.log('VerifyRiderPage patched');
