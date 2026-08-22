const fs = require('fs');

let file = 'src/engines/DisputeEngine.ts'; // We can add complaint logic to DisputeEngine or AdminEngine, let's use AdminEngine.
let content = fs.readFileSync('src/engines/AdminEngine.ts', 'utf8');

const methods = `
  subscribeToComplaints(callback: any) {
    const { orderBy } = require('firebase/firestore');
    return complaintRepository.subscribeToQuery([orderBy('createdAt', 'desc')], callback);
  }

  async updateComplaint(id: string, updates: any, adminId: string) {
    await complaintRepository.update(id, updates);
    await auditEngine.logEvent({ userId: adminId, action: 'UPDATE_COMPLAINT' as any, details: { id, updates }, result: 'SUCCESS' });
  }
`;
const insertIndex = content.lastIndexOf('}');
content = content.slice(0, insertIndex) + methods + '\n' + content.slice(insertIndex);
fs.writeFileSync('src/engines/AdminEngine.ts', content, 'utf8');

let page = 'src/pages/admin/ComplaintCentrePage.tsx';
let pContent = fs.readFileSync(page, 'utf8');
pContent = pContent.replace(/import \{ complaintRepository \} from '\.\.\/\.\.\/services\/db\/ComplaintRepository';/g, "import { adminEngine } from '../../engines/AdminEngine';");
pContent = pContent.replace(/const unsubscribe = complaintRepository\.subscribeToQuery\(\[orderBy\('createdAt', 'desc'\)\], \(data\) => \{/g, "const unsubscribe = adminEngine.subscribeToComplaints((data: any) => {");
pContent = pContent.replace(/await complaintRepository\.update\(([^,]+),\s*([^)]+)\)/g, "await adminEngine.updateComplaint($1, $2, 'admin')");

fs.writeFileSync(page, pContent, 'utf8');
