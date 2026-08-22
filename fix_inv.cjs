const fs = require('fs');
let invEngineFile = 'src/engines/InvitationEngine.ts';
if (fs.existsSync(invEngineFile)) {
  let content = fs.readFileSync(invEngineFile, 'utf8');
  // It's probably returning StaffInvitation or taking StaffInvitation as param
  content = content.replace(/StaffInvitation/g, "any");
  fs.writeFileSync(invEngineFile, content, 'utf8');
}
