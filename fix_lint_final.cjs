const fs = require('fs');

let disputeEngineFile = 'src/engines/DisputeEngine.ts';
if (fs.existsSync(disputeEngineFile)) {
  let content = fs.readFileSync(disputeEngineFile, 'utf8');
  content = content.replace(/dispute\.merchantId \|\| dispute\.customerId/g, "dispute.merchantId || (dispute as any).customerId");
  fs.writeFileSync(disputeEngineFile, content, 'utf8');
}

let invEngineFile = 'src/engines/InvitationEngine.ts';
if (fs.existsSync(invEngineFile)) {
  let content = fs.readFileSync(invEngineFile, 'utf8');
  content = content.replace(/const invitations: StaffInvitation\[\] = /g, "const invitations: any[] = ");
  fs.writeFileSync(invEngineFile, content, 'utf8');
}
