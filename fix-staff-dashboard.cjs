const fs = require('fs');
const file = 'src/pages/logistics/StaffDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import \{ doc, updateDoc \} from 'firebase\/firestore';/, "");
content = content.replace(/import \{ db \} from '@\/src\/lib\/firebase';/, "");

if (!content.includes('userRepository')) {
  content = content.replace("import { invitationService } from '@/src/services/InvitationService';", "import { invitationService } from '@/src/services/InvitationService';\nimport { userRepository } from '@/src/services/db/UserRepository';");
}

content = content.replace(/await updateDoc\(doc\(db, 'users', user\.uid\), \{\n\s*onboardingComplete: true\n\s*\}\);/, "await userRepository.update(user.uid, { onboardingComplete: true });");

fs.writeFileSync(file, content);
console.log('StaffDashboard patched');
