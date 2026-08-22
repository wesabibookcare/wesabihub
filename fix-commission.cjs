const fs = require('fs');
const file = 'src/pages/admin/CommissionManagementPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove firestore imports
content = content.replace(/import \{ collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, orderBy, limit \} from 'firebase\/firestore';/, "");
content = content.replace(/import \{ db \} from '\.\.\/\.\.\/lib\/firebase';/, "");

// Add repository and auditEngine imports
content = content.replace("import { cn } from '@/src/lib/utils';", "import { cn } from '@/src/lib/utils';\nimport { commissionRuleRepository } from '@/src/services/db/CommissionRuleRepository';\nimport { auditEngine } from '@/src/engines/AuditEngine';\nimport { useAuth } from '@/src/context/AuthContext';");

// Use repository in fetchRules
content = content.replace(/const q = query\(collection\(db, 'commissionRules'\), orderBy\('version', 'desc'\)\);\n\s*const querySnapshot = await getDocs\(q\);\n\s*const fetchedRules = querySnapshot\.docs\.map\(doc => \(\{\n\s*id: doc\.id,\n\s*\.\.\.doc\.data\(\)\n\s*\}\)\) as CommissionRule\[\];/,
  `const fetchedRules = await commissionRuleRepository.query([]);\nfetchedRules.sort((a, b) => b.version - a.version);`);

// Use repository in handleSaveRule
content = content.replace(/await addDoc\(collection\(db, 'commissionRules'\), ruleData\);/g,
  `await commissionRuleRepository.create(Date.now().toString(), ruleData as any);`);

content = content.replace(/await addDoc\(collection\(db, 'commissionAuditLogs'\), \{[\s\S]*?\}\);/g,
  `await auditEngine.logEvent({
        userId: user?.uid || 'system',
        action: 'CREATE_RULE',
        details: { ruleVersion: version, message: 'New commission rule version created' },
        result: 'SUCCESS'
      });`);

// Update the user variable if not present
if (!content.includes('const { user } = useAuth();')) {
  content = content.replace('const [rules, setRules] = useState<CommissionRule[]>([]);', 'const { user } = useAuth();\n  const [rules, setRules] = useState<CommissionRule[]>([]);');
}

fs.writeFileSync(file, content);
console.log('CommissionManagementPage patched');
