const fs = require('fs');
const file = 'src/pages/dispatch/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import \{ doc, getDoc, updateDoc, setDoc, onSnapshot, arrayUnion, serverTimestamp, collection \} from 'firebase\/firestore';/, "");
content = content.replace(/import \{ db \} from '\.\.\/\.\.\/lib\/firebase';/, "");

if (!content.includes('userRepository')) {
  content = content.replace("import { Card } from '../../components/ui/Card';", "import { Card } from '../../components/ui/Card';\nimport { userRepository } from '@/src/services/db/UserRepository';");
}

// 1. Subscription
content = content.replace(/const userDocRef = doc\(db, 'users', user\.id\);\n\s*const unsubscribe = onSnapshot\(userDocRef, async \(snap\) => \{\n\s*if \(snap\.exists\(\)\) \{\n\s*const data = snap\.data\(\);/,
  `const unsubscribe = userRepository.subscribe(user.id, async (data) => {
      if (data) {`);

// 2. Complete Course
content = content.replace(/const userDocRef = doc\(db, 'users', user\.id\);\n\s*const updatedProgress = riderProfile\.completedCourses \|\| \[\];/,
  `const updatedProgress = riderProfile.completedCourses || [];`);
content = content.replace(/await updateDoc\(userDocRef, \{\n\s*completedCourses: \[\.\.\.updatedProgress, courseId\],\n\s*trustScore: \(riderProfile\.trustScore \|\| 100\) \+ trustBonus\n\s*\}\);/,
  `await userRepository.update(user.id, {
        completedCourses: [...updatedProgress, courseId],
        trustScore: (riderProfile.trustScore || 100) + trustBonus
      } as any);`);

// 3. Sign Agreement
content = content.replace(/const userDocRef = doc\(db, 'users', user\.id\);\n\s*await updateDoc\(userDocRef, \{\n\s*agreementSigned: true,\n\s*agreementVersion: 'v2\.4\.0',\n\s*agreementSignedAt: new Date\(\)\.toISOString\(\),\n\s*agreementSignature: consentSignature\n\s*\}\);/,
  `await userRepository.update(user.id, {
        agreementSigned: true,
        agreementVersion: 'v2.4.0',
        agreementSignedAt: new Date().toISOString(),
        agreementSignature: consentSignature
      } as any);`);

// 4. Adjust Trust Score
content = content.replace(/const userDocRef = doc\(db, 'users', user\.id\);/, "");
content = content.replace(/await updateDoc\(userDocRef, \{\n\s*trustScore: newScore,\n\s*trustTier: determineTier\(newScore, currentTrips\),\n\s*lastTrustEvent: new Date\(\)\.toISOString\(\)\n\s*\}\);/,
  `await userRepository.update(user.id, {
        trustScore: newScore,
        trustTier: determineTier(newScore, currentTrips),
        lastTrustEvent: new Date().toISOString()
      } as any);`);

// 5. Payment Wallet Funding
content = content.replace(/const userDocRef = doc\(db, 'users', user\.id\);\n\s*const amountNum = parseFloat\(flutterwaveAmount\);\n\s*const currentAvailable = riderProfile\.availableBalance \|\| 0;\n\s*await updateDoc\(userDocRef, \{\n\s*availableBalance: currentAvailable \+ amountNum\n\s*\}\);/,
  `const amountNum = parseFloat(flutterwaveAmount);
      const currentAvailable = riderProfile.availableBalance || 0;
      await userRepository.update(user.id, {
        availableBalance: currentAvailable + amountNum
      } as any);`);

// 6. Withdraw Wallet
content = content.replace(/const userDocRef = doc\(db, 'users', user\.id\);\n\s*await updateDoc\(userDocRef, \{\n\s*availableBalance: currentAvailable - amount,\n\s*pendingBalance: \(riderProfile\.pendingBalance \|\| 0\) \+ amount\n\s*\}\);/,
  `await userRepository.update(user.id, {
        availableBalance: currentAvailable - amount,
        pendingBalance: (riderProfile.pendingBalance || 0) + amount
      } as any);`);

fs.writeFileSync(file, content);
console.log('Dispatch Dashboard patched');
