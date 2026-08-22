const fs = require('fs');

function addMethods(file, methodsString) {
  let content = fs.readFileSync(file, 'utf8');
  // insert before last closing brace
  const insertIndex = content.lastIndexOf('}');
  content = content.slice(0, insertIndex) + methodsString + '\n' + content.slice(insertIndex);
  fs.writeFileSync(file, content, 'utf8');
}

addMethods('src/engines/ConfigurationEngine.ts', `
  async getAnnouncements(): Promise<any[]> {
    const { announcementRepository } = require('../services/db/AnnouncementRepository');
    return await announcementRepository.getAll();
  }
  async getAdvertisements(): Promise<any[]> {
    const { advertisementRepository } = require('../services/db/AdvertisementRepository');
    return await advertisementRepository.getAll();
  }
  async getAllDocumentRequirements(): Promise<any[]> {
    const { documentRequirementRepository } = require('../services/db/DocumentRequirementRepository');
    return await documentRequirementRepository.getAll();
  }
  async updateSystemSettings(id: string, data: any): Promise<void> {
    const { systemSettingsRepository } = require('../services/db/SystemSettingsRepository');
    await systemSettingsRepository.update(id, data);
  }
  async createAnnouncement(id: string, data: any): Promise<void> {
    const { announcementRepository } = require('../services/db/AnnouncementRepository');
    await announcementRepository.create(id, data);
  }
  async createAdvertisement(id: string, data: any): Promise<void> {
    const { advertisementRepository } = require('../services/db/AdvertisementRepository');
    await advertisementRepository.create(id, data);
  }
  async deleteAnnouncement(id: string): Promise<void> {
    const { announcementRepository } = require('../services/db/AnnouncementRepository');
    await announcementRepository.softDelete(id);
  }
  async deleteAdvertisement(id: string): Promise<void> {
    const { advertisementRepository } = require('../services/db/AdvertisementRepository');
    await advertisementRepository.softDelete(id);
  }
  async deleteDocumentRequirement(id: string): Promise<void> {
    const { documentRequirementRepository } = require('../services/db/DocumentRequirementRepository');
    await documentRequirementRepository.softDelete(id);
  }
  async updateDocumentRequirement(id: string, data: any): Promise<void> {
    const { documentRequirementRepository } = require('../services/db/DocumentRequirementRepository');
    await documentRequirementRepository.update(id, data);
  }
  async createDocumentRequirement(id: string, data: any): Promise<void> {
    const { documentRequirementRepository } = require('../services/db/DocumentRequirementRepository');
    await documentRequirementRepository.create(id, data);
  }
  async getActiveCountries(): Promise<any[]> {
    const { countryRepository } = require('../services/db/CountryRepository');
    return await countryRepository.getActiveCountries();
  }
`);

addMethods('src/engines/PaymentEngine.ts', `
  async getAllCommissions(): Promise<any[]> {
    const { commissionRecordRepository } = require('../services/db/CommissionRecordRepository');
    return await commissionRecordRepository.getAll();
  }
  async getPaymentMethods(userId: string): Promise<any[]> {
    const { paymentMethodRepository } = require('../services/db/PaymentMethodRepository');
    return await paymentMethodRepository.getByUser(userId);
  }
  async addPaymentMethod(id: string, data: any): Promise<void> {
    const { paymentMethodRepository } = require('../services/db/PaymentMethodRepository');
    await paymentMethodRepository.create(id, data);
  }
  async deletePaymentMethod(id: string): Promise<void> {
    const { paymentMethodRepository } = require('../services/db/PaymentMethodRepository');
    await paymentMethodRepository.delete(id);
  }
  async setDefaultPaymentMethod(userId: string, methodId: string): Promise<void> {
    const { paymentMethodRepository } = require('../services/db/PaymentMethodRepository');
    await paymentMethodRepository.setDefault(userId, methodId);
  }
  async createWallet(userId: string, data: any): Promise<void> {
    const { walletRepository } = require('../services/db/FinancialRepository');
    await walletRepository.create(userId, data);
  }
  async updateWallet(userId: string, data: any): Promise<void> {
    const { walletRepository } = require('../services/db/FinancialRepository');
    await walletRepository.update(userId, data);
  }
  async createTransaction(id: string, data: any): Promise<void> {
    const { transactionRepository } = require('../services/db/FinancialRepository');
    await transactionRepository.create(id, data);
  }
`);

addMethods('src/engines/UserEngine.ts', `
  public get roles() {
    return require('../services/db/RoleApplicationRepository').roleApplicationRepository;
  }
  async getAddresses(userId: string): Promise<any[]> {
    const { addressRepository } = require('../services/db/AddressRepository');
    return await addressRepository.getByUser(userId);
  }
  async updateAddress(id: string, data: any): Promise<void> {
    const { addressRepository } = require('../services/db/AddressRepository');
    await addressRepository.update(id, data);
  }
  async addAddress(id: string, data: any): Promise<void> {
    const { addressRepository } = require('../services/db/AddressRepository');
    await addressRepository.create(id, data);
  }
  async deleteAddress(id: string): Promise<void> {
    const { addressRepository } = require('../services/db/AddressRepository');
    await addressRepository.delete(id);
  }
  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    const { addressRepository } = require('../services/db/AddressRepository');
    await addressRepository.setDefault(userId, addressId);
  }
  async createSupportTicket(id: string, data: any): Promise<void> {
    const { supportTicketRepository } = require('../services/db/SupportTicketRepository');
    await supportTicketRepository.create(id, data);
  }
  async updateProfile(userId: string, data: any): Promise<void> {
    const { userRepository } = require('../services/db/UserRepository');
    await userRepository.update(userId, data);
  }
`);

addMethods('src/engines/InvitationEngine.ts', `
  async getInvitationsByEmail(email: string): Promise<any[]> {
    const { invitationRepository } = require('../services/db/InvitationRepository');
    return await invitationRepository.getByEmail(email);
  }
`);

addMethods('src/engines/ParcelEngine.ts', `
  async getParcelsByRecipient(phone: string): Promise<any[]> {
    const { shipmentRepository } = require('../services/db/ShipmentRepository');
    return await shipmentRepository.getByRecipient(phone);
  }
  async createReturnRequest(data: any): Promise<void> {
    const { returnRepository } = require('../services/db/ReturnRepository');
    await returnRepository.create(data);
  }
  async query(conditions: any[]): Promise<any[]> {
    const { shipmentRepository } = require('../services/db/ShipmentRepository');
    return await shipmentRepository.query(conditions);
  }
  async updateStatus(id: string, status: string): Promise<void> {
    const { shipmentRepository } = require('../services/db/ShipmentRepository');
    await shipmentRepository.update(id, { status });
  }
`);

addMethods('src/engines/NotificationEngine.ts', `
  async getConversations(): Promise<any[]> {
    const { conversationRepository } = require('../services/db/ConversationRepository');
    return await conversationRepository.getAll();
  }
`);
console.log('Fixed engines');
