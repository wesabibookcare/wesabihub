const fs = require('fs');
const file = 'src/pages/admin/UsersPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const rolesSnap = await getDocs\(collection\(db, 'adminRoles'\)\);[\s\S]*?setRoles\(rolesList\);/g, `setRoles([
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

fs.writeFileSync(file, content);
