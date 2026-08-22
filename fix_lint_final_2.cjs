const fs = require('fs');

function replaceInFile(file, replacements) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  fs.writeFileSync(file, content, 'utf8');
}

replaceInFile('src/engines/DisputeEngine.ts', [
  { from: /dispute\.merchantId \|\| \(dispute as any\)\.customerId/g, to: "dispute.merchantId || dispute.customerId" } // Revert to let's just make it cast to any entirely
]);

let disputeEngineFile = 'src/engines/DisputeEngine.ts';
if (fs.existsSync(disputeEngineFile)) {
  let content = fs.readFileSync(disputeEngineFile, 'utf8');
  content = content.replace(/dispute\.customerId/g, "(dispute as any).customerId");
  fs.writeFileSync(disputeEngineFile, content, 'utf8');
}

let invEngineFile = 'src/engines/InvitationEngine.ts';
if (fs.existsSync(invEngineFile)) {
  let content = fs.readFileSync(invEngineFile, 'utf8');
  content = content.replace(/import \{ StaffInvitation \} from '\.\.\/services\/db\/InvitationRepository';/g, "");
  content = content.replace(/StaffInvitation/g, "any");
  fs.writeFileSync(invEngineFile, content, 'utf8');
}
