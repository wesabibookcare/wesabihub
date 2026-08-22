const fs = require('fs');
const glob = require('glob');

const replacements = [
  // User/Auth
  { from: /import \{.*\} from '.*\/db\/UserRepository';/g, to: "import { userEngine } from '@/src/engines';" },
  { from: /userRepository.getByUsername\(/g, to: "userEngine.getByUsername(" },
  { from: /userRepository.update\(/g, to: "userEngine.updateProfile(" },

  // Role Application
  { from: /import \{.*\} from '.*\/db\/RoleApplicationRepository';/g, to: "import { userEngine } from '@/src/engines';" },
  { from: /roleApplicationRepository.subscribeToQuery\(/g, to: "userEngine.roles.subscribeToQuery(" }, // Make sure to add this or use appropriate method

  // Finance/Wallet
  { from: /import \{.*\} from '.*\/db\/CommissionRecordRepository';/g, to: "import { paymentEngine } from '@/src/engines';\nimport { CommissionRecord } from '@/src/services/db/CommissionRecordRepository';" },
  { from: /commissionRecordRepository.getAll\(\)/g, to: "paymentEngine.getAllCommissions()" },

  { from: /import \{.*\} from '.*\/db\/FinancialRepository';/g, to: "import { paymentEngine } from '@/src/engines';" },
  { from: /walletRepository.getByUserId\(/g, to: "paymentEngine.getWallet(" },
  { from: /walletRepository.create\(/g, to: "paymentEngine.createWallet(" },
  { from: /walletRepository.update\(/g, to: "paymentEngine.updateWallet(" },
  { from: /transactionRepository.getByWallet\(/g, to: "paymentEngine.getTransactions(" },
  { from: /transactionRepository.create\(/g, to: "paymentEngine.createTransaction(" },

  { from: /import \{.*\} from '.*\/db\/PaymentMethodRepository';/g, to: "import { paymentEngine } from '@/src/engines';\nimport { PaymentMethod } from '@/src/services/db/PaymentMethodRepository';" },
  { from: /paymentMethodRepository.getByUser\(/g, to: "paymentEngine.getPaymentMethods(" },
  { from: /paymentMethodRepository.create\(/g, to: "paymentEngine.addPaymentMethod(" },
  { from: /paymentMethodRepository.delete\(/g, to: "paymentEngine.deletePaymentMethod(" },
  { from: /paymentMethodRepository.setDefault\(/g, to: "paymentEngine.setDefaultPaymentMethod(" },

  // Admin Platform Operations
  { from: /import \{.*\} from '.*\/db\/AnnouncementRepository';/g, to: "import { configurationEngine } from '@/src/engines';" },
  { from: /import \{.*\} from '.*\/db\/AdvertisementRepository';/g, to: "import { configurationEngine } from '@/src/engines';" },
  { from: /import \{.*\} from '.*\/db\/SystemSettingsRepository';/g, to: "import { configurationEngine } from '@/src/engines';" },
  { from: /import \{.*\} from '.*\/db\/DocumentRequirementRepository';/g, to: "import { configurationEngine } from '@/src/engines';" },

  { from: /announcementRepository.getAll\(\)/g, to: "configurationEngine.getAnnouncements()" },
  { from: /announcementRepository.create\(/g, to: "configurationEngine.createAnnouncement(" },
  { from: /announcementRepository.softDelete\(/g, to: "configurationEngine.deleteAnnouncement(" },

  { from: /advertisementRepository.getAll\(\)/g, to: "configurationEngine.getAdvertisements()" },
  { from: /advertisementRepository.create\(/g, to: "configurationEngine.createAdvertisement(" },
  { from: /advertisementRepository.softDelete\(/g, to: "configurationEngine.deleteAdvertisement(" },

  { from: /systemSettingsRepository.getGlobalSettings\(\)/g, to: "configurationEngine.getGlobalSettings()" },
  { from: /systemSettingsRepository.update\(/g, to: "configurationEngine.updateSystemSettings(" },
  { from: /systemSettingsRepository.getAll\(\)/g, to: "configurationEngine.getGlobalSettings()" },

  { from: /documentRequirementRepository.getAll\(\)/g, to: "configurationEngine.getAllDocumentRequirements()" },
  { from: /documentRequirementRepository.softDelete\(/g, to: "configurationEngine.deleteDocumentRequirement(" },
  { from: /documentRequirementRepository.update\(/g, to: "configurationEngine.updateDocumentRequirement(" },
  { from: /documentRequirementRepository.create\(/g, to: "configurationEngine.createDocumentRequirement(" },

  // Address
  { from: /import \{.*\} from '.*\/db\/AddressRepository';/g, to: "import { userEngine } from '@/src/engines';" },
  { from: /addressRepository.getByUser\(/g, to: "userEngine.getAddresses(" },
  { from: /addressRepository.update\(/g, to: "userEngine.updateAddress(" },
  { from: /addressRepository.create\(/g, to: "userEngine.addAddress(" },
  { from: /addressRepository.delete\(/g, to: "userEngine.deleteAddress(" },
  { from: /addressRepository.setDefault\(/g, to: "userEngine.setDefaultAddress(" },

  // Audit
  { from: /import \{.*\} from '.*\/db\/AuditRepository';/g, to: "import { auditEngine } from '@/src/engines';" },
  { from: /auditRepository.logAction\(([^,]+), ([^,]+), ([^,]+), ([^\)]+)\)/g, to: "auditEngine.logEvent({ userId: $1, action: $2, details: $3, result: 'SUCCESS', targetId: $4 })" },

  // Returns
  { from: /import \{.*\} from '.*\/db\/ReturnRepository';/g, to: "import { parcelEngine } from '@/src/engines';" },
  { from: /returnRepository.create\(/g, to: "parcelEngine.createReturnRequest(" },

  // Support
  { from: /import \{.*\} from '.*\/db\/SupportTicketRepository';/g, to: "import { userEngine } from '@/src/engines';" }, // Assuming support is under user or configuration
  { from: /supportTicketRepository.create\(/g, to: "userEngine.createSupportTicket(" },

  // Country
  { from: /import \{.*\} from '.*\/db\/CountryRepository';/g, to: "import { configurationEngine } from '@/src/engines';" },
  { from: /countryRepository.getActiveCountries\(\)/g, to: "configurationEngine.getActiveCountries()" },

  // Hub Point
  { from: /hubPointRepository.search\(/g, to: "centreEngine.searchHubs(" },
  { from: /hubPointRepository.searchByLocation\(/g, to: "centreEngine.listNearbyHubs(" },

  // Conversation
  { from: /conversationRepository.getAll\(\)/g, to: "notificationEngine.getConversations()" },

  // Invitation
  { from: /import \{.*\} from '.*\/db\/InvitationRepository';/g, to: "import { invitationEngine } from '@/src/engines';" },
  { from: /invitationRepository.getByEmail\(/g, to: "invitationEngine.getInvitationsByEmail(" },

  // Merchant Business
  { from: /import \{.*\} from '.*\/db\/MerchantBusinessRepository';/g, to: "import { merchantEngine } from '@/src/engines';" },
  { from: /merchantBusinessRepository.getByMerchantId\(/g, to: "merchantEngine.getBusinessesByMerchant(" },

  // Receive Parcel specific
  { from: /shipmentRepository.getByRecipient\(/g, to: "parcelEngine.getParcelsByRecipient(" },
  { from: /shipmentRepository.getByVerificationToken\(/g, to: "parcelEngine.getParcelByToken(" }
];

const files = glob.sync('src/pages/**/*.tsx');
let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
    console.log(`Updated ${file}`);
  }
});
console.log(`Finished processing. Modified ${modifiedCount} files.`);
