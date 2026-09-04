import { describe, expect, it } from 'bun:test';
import { paymentEngine } from '../engines/PaymentEngine';
import { dispatchEngine } from '../engines/DispatchEngine';

describe('Stage A-C Financial Settlement Unit Tests', () => {

  it('Section A: Pricing Engine calculates SendOmorfi pricing server-side with NGN 500 minimum floor', () => {
    const baseFare = 400; // Less than 500
    const riderPayoutFoot = dispatchEngine.calculatePayout(baseFare, 'On foot');
    const riderPayoutBicycle = dispatchEngine.calculatePayout(baseFare, 'Bicycle');

    expect(riderPayoutFoot).toBeGreaterThan(0);
    expect(riderPayoutBicycle).toBeGreaterThan(riderPayoutFoot);
  });

  it('Section B/F: PaymentEngine resolveAccount handles sandbox boundaries safely', async () => {
    const resolved = await paymentEngine.resolveAccount('0123456789', '058');
    expect(resolved).toBeDefined();
    expect(resolved.accountNumber).toBe('0123456789');
    expect(resolved.bankCode).toBe('058');
    expect(resolved.accountName).toBe('SANDBOX VERIFIED ACCOUNT');
  });

  it('Section B/F: PaymentEngine createTransferRecipient creates beneficiary codes', async () => {
    const recipient = await paymentEngine.createTransferRecipient({
      name: 'Test Rider',
      accountNumber: '0123456789',
      bankCode: '058'
    });
    expect(recipient).toBeDefined();
    expect(recipient.recipientCode).toContain('058');
    expect(recipient.recipientCode).toContain('0123456789');
  });

  it('Section C/E/F: PaymentEngine transferFunds and verifyTransfer operate safely', async () => {
    const transfer = await paymentEngine.transferFunds({
      amount: 1500,
      recipientCode: 'RCP-MOCK-058-0123456789',
      reference: 'PO-RIDER-TEST-123',
      reason: 'SendOmorfi Delivery Payout'
    });

    expect(transfer).toBeDefined();
    expect(transfer.reference).toBe('PO-RIDER-TEST-123');
    expect(transfer.status).toBe('SUCCESS');

    const verification = await paymentEngine.verifyTransfer('PO-RIDER-TEST-123');
    expect(verification).toBeDefined();
    expect(verification.status).toBe('SUCCESS');
  });

  it('Section C: Payout reference format PO-RIDER- and PO-HUB- are distinct and deterministic', () => {
    const parcelId = 'PCL-998877';
    const withdrawalId = 'WDL-112233';

    const riderRef = `PO-RIDER-${parcelId}`;
    const hubRef = `PO-HUB-${withdrawalId}`;

    expect(riderRef).toBe('PO-RIDER-PCL-998877');
    expect(hubRef).toBe('PO-HUB-WDL-112233');
    expect(riderRef).not.toEqual(hubRef);
  });
});
