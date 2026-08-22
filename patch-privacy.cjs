const fs = require('fs');
let code = fs.readFileSync('src/components/customer/PrivacySecurity.tsx', 'utf8');

code = code.replace(
  '<Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/50">Delete Account</Button>',
  '<Button onClick={() => toast.error("For security reasons, please contact support to delete your account.")} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/50">Delete Account</Button>'
);

fs.writeFileSync('src/components/customer/PrivacySecurity.tsx', code);
