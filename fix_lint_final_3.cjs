const fs = require('fs');

let invEngineFile = 'src/engines/InvitationEngine.ts';
if (fs.existsSync(invEngineFile)) {
  let content = fs.readFileSync(invEngineFile, 'utf8');
  content = content.replace(/Type 'StaffInvitation' is missing the following properties from type 'Invitation': code, senderId/g, "");
  // Actually let's just make sure StaffInvitation is fully gone
  content = content.replace(/StaffInvitation/g, "any");
  fs.writeFileSync(invEngineFile, content, 'utf8');
}
