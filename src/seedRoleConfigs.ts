import { roleApplicationConfigRepository } from './services/db/RoleApplicationConfigRepository';
import { RoleApplicationConfig } from './types';

export const seedRoleApplicationConfigs = async () => {
  const configs: Partial<RoleApplicationConfig>[] = [
    {
      role: 'LOGISTICS_COMPANY',
      fields: [
        { name: 'companyName', label: 'Company Name', type: 'text', required: true },
        { name: 'cacDocument', label: 'CAC Registration Documents', type: 'file', required: true },
        { name: 'tinNumber', label: 'Tax Identification Number (TIN)', type: 'text', required: true },
        { name: 'proofOfAddress', label: 'Proof of Business Address', type: 'file', required: true },
      ]
    },
    {
      role: 'FLEET_MANAGER',
      fields: [
        { name: 'validId', label: 'Valid ID (NIN or Driver\'s License)', type: 'file', required: true },
        { name: 'facialVerification', label: 'Face Photo', type: 'file', required: true },
      ]
    },
    {
      role: 'DRIVER',
      fields: [
        { name: 'driversLicense', label: 'Valid Driver\'s License', type: 'file', required: true },
        { name: 'nin', label: 'National ID (NIN)', type: 'file', required: true },
        { name: 'facialVerification', label: 'Face Photo', type: 'file', required: true },
        { name: 'thumbPrint', label: 'Thumb Print Scan', type: 'file', required: true },
      ]
    },
    {
      role: 'DISPATCH_RIDER',
      fields: [
        { name: 'permit', label: 'Rider\'s Permit / Driver\'s License', type: 'file', required: true },
        { name: 'nin', label: 'NIN or Voter\'s Card', type: 'file', required: true },
        { name: 'facePhoto', label: 'Facial Verification', type: 'file', required: true },
        { name: 'thumbPrint', label: 'Thumb Print Scan', type: 'file', required: true },
        { name: 'homeAddress', label: 'Home Address', type: 'text', required: true },
        { name: 'utilityBill', label: 'Utility Bill (NEPA/Water/Waste)', type: 'file', required: true },
      ]
    },
    {
      role: 'DISPATCH_COMPANY',
      fields: [
        { name: 'businessPapers', label: 'Business Registration Papers', type: 'file', required: true },
        { name: 'techDetails', label: 'Technical Implementation Details', type: 'text', required: true },
      ]
    }
  ];

  for (const config of configs) {
    const existing = await roleApplicationConfigRepository.getByRole(config.role!);
    if (!existing) {
      await roleApplicationConfigRepository.create(`CONFIG-${config.role}`, config as RoleApplicationConfig);
    }
  }
};
