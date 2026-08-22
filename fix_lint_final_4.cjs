const fs = require('fs');

let invEngineFile = 'src/engines/InvitationEngine.ts';
if (fs.existsSync(invEngineFile)) {
  let content = fs.readFileSync(invEngineFile, 'utf8');
  content = content.replace(/Promise<Invitation \| null>/g, "Promise<any | null>");
  content = content.replace(/import \{ UserRole, Invitation \} from '\.\.\/types';/g, "import { UserRole } from '../types';");
  fs.writeFileSync(invEngineFile, content, 'utf8');
}
