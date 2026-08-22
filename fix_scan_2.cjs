const fs = require('fs');
let file = 'src/pages/logistics/ScanWorkspacePage.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/await parcelEngine\.updateStatus\(\n\s*scannedParcel\.id,\n\s*suggestedAction\.nextStatus,\n\s*user\.id,\n\s*'HUB_FACILITY',\n\s*`Logistics \$\{suggestedAction\.code\.toLowerCase\(\)\} confirmed by \$\{user\.displayName\}`\n\s*\);/g,
  "await parcelEngine.updateStatus(scannedParcel.id, suggestedAction.nextStatus);");
fs.writeFileSync(file, content, 'utf8');
