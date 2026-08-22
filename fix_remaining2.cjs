const fs = require('fs');

function replaceInFile(file, replacements) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}

replaceInFile('src/pages/customer/ReturnRequestPage.tsx', [
  { from: /import \{ parcelEngine \} from '@\/src\/engines';\nimport \{ parcelEngine \} from '@\/src\/engines';/g, to: "import { parcelEngine } from '@/src/engines';" }
]);

replaceInFile('src/pages/customer/TrackParcelPage.tsx', [
  { from: /import \{ parcelEngine \} from '@\/src\/engines';\nimport \{ parcelEngine \} from '@\/src\/engines';/g, to: "import { parcelEngine } from '@/src/engines';" }
]);

replaceInFile('src/pages/point/EarningsPage.tsx', [
  { from: /import \{ paymentEngine \} from '@\/src\/engines';\nimport \{ paymentEngine \} from '@\/src\/engines';/g, to: "import { paymentEngine } from '@/src/engines';" }
]);

replaceInFile('src/pages/admin/PlatformOperationsPage.tsx', [
  { from: /import \{ configurationEngine \} from '.*\/engines';\nimport \{ configurationEngine \} from '.*\/engines';\nimport \{ configurationEngine \} from '.*\/engines';\nimport \{ configurationEngine \} from '.*\/engines';/g, to: "import { configurationEngine } from '@/src/engines';" },
  { from: /import \{ configurationEngine \} from '.*\/engines';\nimport \{ configurationEngine \} from '.*\/engines';/g, to: "import { configurationEngine } from '@/src/engines';" }
]);

replaceInFile('src/pages/admin/AdminDashboard.tsx', [
  { from: /import \{ configurationEngine \} from '.*\/engines';\nimport \{ configurationEngine \} from '.*\/engines';/g, to: "import { configurationEngine } from '@/src/engines';" },
  { from: /import \{ configurationEngine \} from '..\/..\/services\/db\/AnnouncementRepository';/g, to: "" },
  { from: /await returnRepository\.deleteAll\(\);/g, to: "" },
  { from: /await advertisementRepository\.deleteAll\(\);/g, to: "" },
  { from: /await announcementRepository\.deleteAll\(\);/g, to: "" }
]);

replaceInFile('src/pages/admin/CountriesPage.tsx', [
  { from: /countryRepository\.subscribeToCountries/g, to: "configurationEngine.subscribeToCountries" }
]);

replaceInFile('src/pages/admin/DisputesPage.tsx', [
  { from: /auditRepository\.logAction/g, to: "auditEngine.logEvent" }
]);

replaceInFile('src/pages/admin/GlobalSettingsPage.tsx', [
  { from: /auditRepository\.getAll/g, to: "auditEngine.getAll" },
  { from: /auditRepository\.logAction/g, to: "auditEngine.logEvent" }
]);

replaceInFile('src/pages/admin/OverviewPage.tsx', [
  { from: /centreEngine\.getAll\(\)/g, to: "centreEngine.listNearbyHubs(0, 0, 999)" },
  { from: /userRepository\.getAll\(\)/g, to: "userEngine.getUsersByHub('__ALL__')" }
]);

replaceInFile('src/pages/customer/ShipmentHistoryPage.tsx', [
  { from: /parcelEngine\.parcels\.query/g, to: "parcelEngine.query" }
]);

replaceInFile('src/pages/logistics/ProfilePage.tsx', [
  { from: /import \{ userRepository \} from "@\/src\/services\/db\/UserRepository";/g, to: "import { userEngine } from '@/src/engines';" }
]);

replaceInFile('src/pages/logistics/ScanWorkspacePage.tsx', [
  { from: /import \{ parcelEngine \} from '@\/src\/engines';\nimport \{ parcelEngine \} from '@\/src\/services\/ParcelEngine';/g, to: "import { parcelEngine } from '@/src/engines';" }
]);

replaceInFile('src/pages/point/EmployeesPage.tsx', [
  { from: /email: newEmployeeEmail,/g, to: "targetEmail: newEmployeeEmail," }
]);
