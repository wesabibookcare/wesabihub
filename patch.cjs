const fs = require('fs');
let code = fs.readFileSync('src/pages/customer/SettingsPage.tsx', 'utf8');

// Replace custom button toggle with Switch in SettingsPage
code = code.replace(
  /<button\s+onClick=\{\(\) => handlePrefChange\(pref\.id, !\(prefs as any\)\[pref\.id\]\)\}[\s\S]*?<\/button>/g,
  '<Switch checked={!!(prefs as any)[pref.id]} onChange={(e) => handlePrefChange(pref.id, e.target.checked)} />'
);

// We need to import Switch
if (!code.includes("import { Switch }")) {
  code = code.replace("import { Card } from", "import { Switch } from '@/src/components/ui/Switch';\nimport { Card } from");
}

fs.writeFileSync('src/pages/customer/SettingsPage.tsx', code);
