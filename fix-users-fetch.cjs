const fs = require('fs');
const file = 'src/pages/admin/UsersPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const startIdx = content.indexOf('const fetchData = async () => {');
const tryIdx = content.indexOf('try {', startIdx);
const catchIdx = content.indexOf('} catch (err) {', tryIdx);

const newBody = `try {
      setRoles(ADMIN_ROLES);
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
      }
    `;

content = content.substring(0, tryIdx) + newBody + content.substring(catchIdx);

fs.writeFileSync(file, content);
