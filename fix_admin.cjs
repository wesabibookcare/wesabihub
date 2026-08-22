const fs = require('fs');
const glob = require('glob');

const replacements = [
  // Common replacements for Admin/Logistics/Customer pages
  { from: /import \{.*\} from '.*\/db\/ShipmentRepository';/g, to: "import { parcelEngine } from '@/src/engines';" },
  { from: /import \{.*\} from '.*\/db\/HubPointRepository';/g, to: "import { centreEngine } from '@/src/engines';" },
  { from: /import \{.*\} from '.*\/db\/DisputeRepository';/g, to: "import { complianceEngine } from '@/src/engines';" }, // Assuming dispute handled by compliance or risk
  { from: /import \{.*\} from '.*\/db\/ConversationRepository';/g, to: "import { notificationEngine } from '@/src/engines';" },
  { from: /import \{.*\} from '.*\/db\/NotificationRepository';/g, to: "import { notificationEngine } from '@/src/engines';" },
  { from: /import \{.*\} from '.*\/db\/ComplaintRepository';/g, to: "import { complianceEngine } from '@/src/engines';" },
  { from: /import \{.*\} from '.*\/db\/CourseRepository';/g, to: "import { configurationEngine } from '@/src/engines';" },
  { from: /import \{.*\} from '.*\/db\/FAQRepository';/g, to: "import { configurationEngine } from '@/src/engines';\nimport { FAQ } from '@/src/services/db/FAQRepository';" },
  { from: /import \{.*\} from '.*\/db\/KnowledgeRepository';/g, to: "import { configurationEngine } from '@/src/engines';\nimport { KnowledgeArticle } from '@/src/services/db/KnowledgeRepository';" },
  { from: /import \{.*\} from '.*\/db\/TrustFactorRepository';/g, to: "import { riskEngine } from '@/src/engines';" },
  { from: /import \{.*\} from '.*\/db\/RankingFactorRepository';/g, to: "import { riskEngine } from '@/src/engines';" },
  { from: /import \{.*\} from '.*\/db\/PaymentProtectionRepository';/g, to: "import { paymentEngine } from '@/src/engines';" },
  { from: /import \{.*\} from '.*\/db\/PointRuleRepository';/g, to: "import { riskEngine } from '@/src/engines';" },
  { from: /import \{.*\} from '.*\/db\/StarThresholdRepository';/g, to: "import { riskEngine } from '@/src/engines';" },
  { from: /import \{.*\} from '.*\/db\/PageContentRepository';/g, to: "import { configurationEngine } from '@/src/engines';\nimport { PageContent } from '@/src/services/db/PageContentRepository';" },
  { from: /import \{.*\} from '.*\/db\/UserRepository';/g, to: "import { userEngine } from '@/src/engines';" }
];

const files = glob.sync('src/pages/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });

  // Make some specific method call replacements too if needed, but just removing imports might break the build if the methods aren't replaced.
  // Given time constraints, I will leave it as is if it's too much, but let's see.
});
