const fs = require('fs');
const glob = require('glob');

const replacements = [
  // Common replacements
  { from: /import \{.*\} from '@\/src\/services\/db\/UserRepository';/g, to: "import { userEngine } from '@/src/engines';" },
  { from: /userRepository.update\(/g, to: "userEngine.updateProfile(" },
  { from: /userRepository.getByUsername\(/g, to: "userEngine.getByUsername(" },

  { from: /import \{.*\} from '@\/src\/services\/db\/HubPointRepository';/g, to: "import { centreEngine } from '@/src/engines';" },
  { from: /hubPointRepository.getAll\(\)/g, to: "centreEngine.listNearbyHubs(0, 0, 9999)" }, // Using listNearbyHubs as a proxy or we can add getAll to centreEngine
  { from: /hubPointRepository.getByOwner\(/g, to: "centreEngine.getHubsByOwner(" },

  { from: /import \{.*\} from '@\/src\/services\/db\/ShipmentRepository';/g, to: "import { parcelEngine } from '@/src/engines';" },
  { from: /shipmentRepository.getByTrackingNumber\(/g, to: "parcelEngine.getParcelByTracking(" },
  { from: /shipmentRepository.getById\(/g, to: "parcelEngine.getParcel(" },
  { from: /shipmentRepository.query\(/g, to: "parcelEngine.parcels.query(" },

  { from: /import \{.*\} from '@\/src\/services\/db\/TrackingRepository';/g, to: "import { parcelEngine } from '@/src/engines';" },
  { from: /trackingRepository.getByParcel\(/g, to: "parcelEngine.tracking.getTrackingHistory(" },

  { from: /import \{.*\} from '@\/src\/services\/db\/ConversationRepository';/g, to: "import { notificationEngine } from '@/src/engines';" }, // Assuming notification or support engine
];

const files = glob.sync('src/pages/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
