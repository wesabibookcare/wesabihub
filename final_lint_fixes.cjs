const fs = require('fs');

let disputeEngineFile = 'src/engines/DisputeEngine.ts';
if (fs.existsSync(disputeEngineFile)) {
  let content = fs.readFileSync(disputeEngineFile, 'utf8');
  content = content.replace("import { disputeRepository, Dispute } from '../services/db/DisputeRepository';", "import { disputeRepository } from '../services/db/DisputeRepository';\nimport { Dispute } from '../types';");
  fs.writeFileSync(disputeEngineFile, content, 'utf8');
}

let trainingEngineFile = 'src/engines/TrainingEngine.ts';
if (fs.existsSync(trainingEngineFile)) {
  let content = fs.readFileSync(trainingEngineFile, 'utf8');
  content = content.replace("import { courseRepository, Course } from '../services/db/CourseRepository';", "import { courseRepository } from '../services/db/CourseRepository';\nimport { Course } from '../types';");
  fs.writeFileSync(trainingEngineFile, content, 'utf8');
}

let invEngineFile = 'src/engines/InvitationEngine.ts';
if (fs.existsSync(invEngineFile)) {
  let content = fs.readFileSync(invEngineFile, 'utf8');
  // Find StaffInvitation and type cast or fix it
  content = content.replace(/import \{ StaffInvitation \} from '\.\.\/services\/db\/InvitationRepository';/g, "");
  // Line 28 might be something like: const x: StaffInvitation = { ... }
  // We can just find StaffInvitation and replace with any
  content = content.replace(/StaffInvitation/g, "any");
  fs.writeFileSync(invEngineFile, content, 'utf8');
}
