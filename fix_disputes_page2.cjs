const fs = require('fs');
let file = 'src/engines/DisputeEngine.ts';
let content = fs.readFileSync(file, 'utf8');

const methods = `
  async updateDispute(id: string, data: any) {
    return disputeRepository.update(id, data);
  }

  async getPaymentProtectionByShipmentId(shipmentId: string) {
    return paymentProtectionRepository.getByShipmentId(shipmentId);
  }

  async getPaymentProtectionByParcelId(parcelId: string) {
    return paymentProtectionRepository.getByParcelId(parcelId);
  }

  async updatePaymentProtection(id: string, data: any) {
    return paymentProtectionRepository.update(id, data);
  }
`;
const insertIndex = content.lastIndexOf('}');
content = content.slice(0, insertIndex) + methods + '\n' + content.slice(insertIndex);
fs.writeFileSync(file, content, 'utf8');

// Now update DisputesPage
let page = 'src/pages/admin/DisputesPage.tsx';
let pContent = fs.readFileSync(page, 'utf8');
pContent = pContent.replace(/import \{ disputeRepository \} from '\.\.\/\.\.\/services\/db\/DisputeRepository';\nimport \{ paymentProtectionRepository \} from '\.\.\/\.\.\/services\/db\/PaymentProtectionRepository';/g, "");
pContent = pContent.replace(/disputeRepository\.subscribeToQuery/g, "disputeEngine.subscribeToDisputes");
pContent = pContent.replace(/disputeRepository\.update/g, "disputeEngine.updateDispute");
pContent = pContent.replace(/paymentProtectionRepository\.getByShipmentId/g, "disputeEngine.getPaymentProtectionByShipmentId");
pContent = pContent.replace(/paymentProtectionRepository\.getByParcelId/g, "disputeEngine.getPaymentProtectionByParcelId");
pContent = pContent.replace(/paymentProtectionRepository\.update/g, "disputeEngine.updatePaymentProtection");
fs.writeFileSync(page, pContent, 'utf8');
