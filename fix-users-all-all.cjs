const fs = require('fs');
const file = 'src/pages/admin/UsersPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import \{ collection, getDocs, doc, setDoc, updateDoc, writeBatch \} from 'firebase\/firestore';/, "");
content = content.replace(/import \{ db \} from '\.\.\/\.\.\/lib\/firebase';/, "");

content = content.replace(/const rolesSnap = await getDocs\(collection\(db, 'adminRoles'\)\);[\s\S]*?setUsers\(allUsers\);/g, `setRoles([
        { id: 'SUPER_ADMIN', name: 'Super Admin', permissions: ['*'], description: 'Full access' },
        { id: 'SUPPORT_AGENT', name: 'Support Agent', permissions: ['view_users', 'view_tickets'], description: 'Support access' }
      ] as any);`);

content = content.replace(/const usersSnap = await getDocs\(collection\(db, 'users'\)\);[\s\S]*?setUsers\(usersList\);/g, `const usersList = await userRepository.getAll();
      setUsers(usersList);`);

content = content.replace(/const userRef = doc\(db, 'users', adminId\);/g, "");

content = content.replace(/await updateDoc\(doc\(db, 'users', admin\.uid\), \{[\s\S]*?\}\);/g, `await userRepository.update(admin.uid, {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        adminRole: formData.get('adminRole')
      } as any);`);

content = content.replace(/await deleteDoc\(doc\(db, 'users', admin\.uid\)\);/g, `await userRepository.delete(admin.uid);`);

content = content.replace(/const roleRef = doc\(db, 'adminRoles', roleId\);/g, "");

content = content.replace(/await deleteDoc\(doc\(db, 'adminRoles', role\.id\)\);/g, `// Cannot delete from mock roles
      setRoles(roles.filter(r => r.id !== role.id));`);

content = content.replace(/await updateDoc\(doc\(db, 'users', userItem\.id\), \{ status: lockStatus \}\);/g, `await userRepository.update(userItem.id, { status: lockStatus } as any);`);

// Since there's another block, replace it entirely via dumb string replacement
content = content.replace(/const rolesSnap = await getDocs\(collection\(db, 'adminRoles'\)\);[\s\S]*?\/\/ Fallback dummy data\n\s*setAdmins\(MOCK_ADMINS\);\n\s*setUsers\(MOCK_USERS\);\n\s*\}/g,
  `setRoles(ADMIN_ROLES as any);
      const fetchedUsers = await userRepository.getAll();
      if (fetchedUsers && fetchedUsers.length > 0) {
        const admins = fetchedUsers.filter((u: any) =>
          ['SUPER_ADMIN', 'DISPUTE_ADMIN', 'FINANCE_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN', 'VERIFICATION_ADMIN', 'SECURITY_ADMIN', 'SUPPORT_OFFICER', 'VERIFICATION_OFFICER', 'FINANCE_OFFICER', 'OPERATIONS_MANAGER'].includes(u.role) ||
          u.adminRole
        );
        const allUsers = fetchedUsers.filter((u: any) => !admins.find((a: any) => a.id === u.id));
        setAdmins(admins as any);
        setUsers(allUsers as any);
      } else {
        setAdmins(MOCK_ADMINS as any);
        setUsers(MOCK_USERS as any);
      }`);

fs.writeFileSync(file, content);
