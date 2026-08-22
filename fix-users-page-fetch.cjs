const fs = require('fs');
const file = 'src/pages/admin/UsersPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const rolesSnap = await getDocs\(collection\(db, 'adminRoles'\)\);[\s\S]*?setUsers\(allUsers\);/g;

content = content.replace(regex, `const combinedRoles = [...ADMIN_ROLES];
      setRoles(combinedRoles);

      const allUsers = await userRepository.getAll();
      setUsers(allUsers);`);

fs.writeFileSync(file, content);
