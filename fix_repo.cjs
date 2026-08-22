const fs = require('fs');

let repoFile = 'src/services/db/InvitationRepository.ts';
if (fs.existsSync(repoFile)) {
  let content = fs.readFileSync(repoFile, 'utf8');
  content = content.replace(/export interface StaffInvitation \{[\s\S]*?createdAt: string;\n\}/g, "export interface StaffInvitation extends Record<string, any> {\n  id: string;\n  status: string;\n}");
  // Also we can just change BaseRepository<StaffInvitation> to BaseRepository<any>
  content = content.replace(/BaseRepository<StaffInvitation>/g, "BaseRepository<any>");
  content = content.replace(/FirestoreDataConverter<StaffInvitation>/g, "FirestoreDataConverter<any>");
  content = content.replace(/Promise<StaffInvitation\[\]>/g, "Promise<any[]>");
  content = content.replace(/as StaffInvitation;/g, "as any;");
  content = content.replace(/\(inv: StaffInvitation\)/g, "(inv: any)");
  fs.writeFileSync(repoFile, content, 'utf8');
}
