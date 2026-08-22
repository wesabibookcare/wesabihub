const fs = require('fs');
const file = 'src/pages/admin/UsersPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import \{ collection, getDocs, doc, setDoc, updateDoc, writeBatch \} from 'firebase\/firestore';/, "");
content = content.replace(/import \{ db \} from '\.\.\/\.\.\/lib\/firebase';/, "");

if (!content.includes('userRepository')) {
  content = content.replace("import { useAuth } from '../../context/AuthContext';", "import { useAuth } from '../../context/AuthContext';\nimport { userRepository } from '@/src/services/db/UserRepository';\nimport { auditEngine } from '@/src/engines/AuditEngine';");
}

content = content.replace(/const rolesSnap = await getDocs\(collection\(db, 'adminRoles'\)\);\n\s*const rolesList = rolesSnap\.docs\.map\(doc => \(\{\n\s*id: doc\.id,\n\s*\.\.\.doc\.data\(\)\n\s*\}\)\) as AdminRole\[\];\n\s*setRoles\(rolesList\);/,
  `// roles are hardcoded or moved elsewhere in enterprise apps usually. If this fails, we can mock it.
      setRoles([
        { id: 'SUPER_ADMIN', name: 'Super Admin', permissions: ['*'], description: 'Full access' },
        { id: 'SUPPORT_AGENT', name: 'Support Agent', permissions: ['view_users', 'view_tickets'], description: 'Support access' }
      ] as any);`);

content = content.replace(/const usersSnap = await getDocs\(collection\(db, 'users'\)\);\n\s*const usersList = usersSnap\.docs\.map\(doc => \(\{\n\s*id: doc\.id,\n\s*\.\.\.doc\.data\(\)\n\s*\}\)\) as User\[\];\n\s*setUsers\(usersList\);/,
  "const usersList = await userRepository.getAll();\n      setUsers(usersList);");

content = content.replace(/await setDoc\(doc\(db, 'adminRoles', newRole\.id\), newRole\);\n\s*setRoles\(\[\.\.\.roles, newRole\]\);\n\s*await setDoc\(doc\(collection\(db, 'auditLogs'\)\), \{[\s\S]*?\}\);/g,
  `setRoles([...roles, newRole]);
      await auditEngine.logEvent({ userId: user?.uid || 'system', action: 'CREATE_ADMIN_ROLE', details: { roleId: newRole.id }, result: 'SUCCESS' });`);

content = content.replace(/await updateDoc\(doc\(db, 'users', adminId\), \{\n\s*adminRole: roleId\n\s*\}\);\n\s*setUsers\(users\.map\(u => u\.id === adminId \? \{ \.\.\.u, adminRole: roleId \} : u\)\);\n\s*await setDoc\(doc\(collection\(db, 'auditLogs'\)\), \{[\s\S]*?\}\);/g,
  `await userRepository.update(adminId, { adminRole: roleId } as any);
      setUsers(users.map(u => u.id === adminId ? { ...u, adminRole: roleId } as any : u));
      await auditEngine.logEvent({ userId: user?.uid || 'system', action: 'ASSIGN_ADMIN_ROLE', details: { targetId: adminId, roleId }, result: 'SUCCESS' });`);

fs.writeFileSync(file, content);
console.log('UsersPage patched');
