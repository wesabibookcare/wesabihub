# WeSabiHub Security Specification

## Data Invariants

1. **User Identity**: Users can only create or update their own profile documents.
2. **Role Integrity**: Users cannot set or change their own `role` or `status` (except during initial registration for role, but status is managed by system/admins).
3. **Shipment Ownership**: Only the sender, recipient, or authorized center staff/admins can read shipment details. Only the sender can create a shipment.
4. **Financial Security**: Wallets can only be read by the owner. Only the system/admin can modify wallet balances.
5. **Center Management**: Hub owners can only manage their own centers and their own staff.
6. **Logistics Integrity**: Logistics owners can only manage their own company and their own drivers.
7. **Audit Immutability**: Audit logs are create-only and immutable.
8. **Verification Control**: Verification requests are managed by Verification Officers and Admins.
9. **Commission Integrity**: Commission rules can only be managed by SUPER_ADMIN. Commission records are read-only for all and system-generated.

## The Dirty Dozen (Malicious Payloads)

1. **Self-Promotion**: A CUSTOMER attempts to update their own profile to `role: 'SUPER_ADMIN'`.
2. **Unauthorized Payout**: A MERCHANT attempts to update their `wallet.balance` directly.
3. **Shipment Hijack**: A DRIVER attempts to read a shipment they are not assigned to.
4. **Data Injection**: An unauthenticated user attempts to create a document in `auditLogs` with 1MB of junk data.
5. **Status Shortcut**: A CUSTOMER attempts to update a shipment status directly to `COMPLETED` without point staff verification.
6. **Orphaned Shipment**: A user attempts to create a shipment with a non-existent `originCenterId`.
7. **Identity Spoofing**: User A attempts to create a shipment with `senderId: 'UserB'`.
8. **Center Poaching**: Hub Owner A attempts to add a staff member to Hub Owner B's center.
9. **Logistics Leak**: Logistics Owner A attempts to list drivers from Logistics Company B.
10. **Notification Spam**: A user attempts to create a notification for another user.
11. **Commission Sabotage**: A non-admin attempts to create or update `commissionRules`.
12. **Revenue Stealing**: A HUB_OWNER attempts to modify a `commissionRecord` to increase their share.

## Test Runner (firestore.rules.test.ts)

Below is the complete testing suite utilizing the `@firebase/rules-unit-testing` framework. This suite loads the security rules and submits all 12 malicious payloads to verify they are securely rejected with a `PERMISSION_DENIED` error.

```typescript
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

let testEnv: RulesTestEnvironment;

describe('WeSabiHub Zero-Trust Security Rules Audit', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'wesabihub-security-hardening-test',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8')
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  // 1. Self-Promotion
  test('Malicious Payload 1: User should fail to register/create an account with SUPER_ADMIN role', async () => {
    const context = testEnv.authenticatedContext('user_malicious', { email_verified: true });
    const db = context.firestore();
    const userRef = doc(db, 'users/user_malicious');

    // Attempt to register/create as SUPER_ADMIN
    await assertFails(setDoc(userRef, {
      uid: 'user_malicious',
      email: 'malicious@wesabihub.com',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE'
    }));
  });

  test('Malicious Payload 1b: Existing CUSTOMER should fail to self-promote to SUPER_ADMIN via update', async () => {
    const context = testEnv.authenticatedContext('user_customer', { email_verified: true });
    const db = context.firestore();
    const userRef = doc(db, 'users/user_customer');

    // Attempt to escalate role via update
    await assertFails(updateDoc(userRef, { role: 'SUPER_ADMIN' }));
  });

  // 2. Unauthorized Wallet Update
  test('Malicious Payload 2: MERCHANT should fail to update their own wallet balance directly', async () => {
    const context = testEnv.authenticatedContext('user_merchant', { email_verified: true });
    const db = context.firestore();
    const walletRef = doc(db, 'wallets/user_merchant');

    await assertFails(setDoc(walletRef, { balance: 9999999, uid: 'user_merchant' }));
  });

  // 3. Unauthorized Shipment Read
  test('Malicious Payload 3: Unassociated user should fail to read restricted shipment details', async () => {
    // Setup existing private shipment
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'shipments/shp_private'), {
        id: 'shp_private',
        senderId: 'user_customer_a',
        status: 'AWAITING_PAYMENT'
      });
    });

    const context = testEnv.authenticatedContext('user_customer_b', { email_verified: true });
    const db = context.firestore();
    const shipmentRef = doc(db, 'shipments/shp_private');

    await assertFails(getDoc(shipmentRef));
  });

  // 4. Unauthenticated Data Injection
  test('Malicious Payload 4: Unauthenticated user should fail to inject junk logs', async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    const logRef = doc(db, 'auditLogs/malicious_log');

    await assertFails(setDoc(logRef, {
      userId: 'anonymous',
      action: 'JUNK_DATA',
      timestamp: new Date().toISOString()
    }));
  });

  // 5. Status Shortcut
  test('Malicious Payload 5: CUSTOMER should fail to bypass status lifecycle gates', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'shipments/shp_1'), {
        id: 'shp_1',
        senderId: 'user_customer',
        status: 'AWAITING_PAYMENT'
      });
    });

    const context = testEnv.authenticatedContext('user_customer', { email_verified: true });
    const db = context.firestore();
    const shipmentRef = doc(db, 'shipments/shp_1');

    await assertFails(updateDoc(shipmentRef, { status: 'COMPLETED' }));
  });

  // 6. Orphaned Shipment (Invalid Center reference)
  test('Malicious Payload 6: Creating shipment referencing non-existent origin center fails', async () => {
    const context = testEnv.authenticatedContext('user_customer', { email_verified: true });
    const db = context.firestore();
    const shipmentRef = doc(db, 'shipments/shp_invalid_ref');

    await assertFails(setDoc(shipmentRef, {
      id: 'shp_invalid_ref',
      senderId: 'user_customer',
      originCenterId: 'non_existent_center_id',
      status: 'DRAFT',
      trackingNumber: 'TRK123456789'
    }));
  });

  // 7. Identity Spoofing
  test('Malicious Payload 7: User A should fail to spoof senderId as User B', async () => {
    const context = testEnv.authenticatedContext('user_a', { email_verified: true });
    const db = context.firestore();
    const shipmentRef = doc(db, 'shipments/shp_spoof');

    await assertFails(setDoc(shipmentRef, {
      id: 'shp_spoof',
      senderId: 'user_b',
      status: 'DRAFT',
      trackingNumber: 'TRK987654321'
    }));
  });

  // 8. Center Poaching
  test('Malicious Payload 8: Hub Owner A cannot manage employees of Hub Owner B', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'wesabiHubPoints/center_b'), {
        id: 'center_b',
        ownerId: 'owner_b',
        status: 'ACTIVE'
      });
    });

    const context = testEnv.authenticatedContext('owner_a', { email_verified: true });
    const db = context.firestore();
    const empRef = doc(db, 'pointEmployees/emp_poached');

    await assertFails(setDoc(empRef, {
      id: 'emp_poached',
      pointId: 'center_b',
      userId: 'poached_staff'
    }));
  });

  // 9. Logistics Info Leaking
  test('Malicious Payload 9: Logistics Owner A cannot access driver roster of Logistics Company B', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'drivers/driver_b'), {
        uid: 'driver_b',
        logisticsCompanyId: 'comp_b'
      });
    });

    const context = testEnv.authenticatedContext('owner_a', { email_verified: true });
    const db = context.firestore();
    const driverRef = doc(db, 'drivers/driver_b');

    await assertFails(getDoc(driverRef));
  });

  // 10. Notification Spamming
  test('Malicious Payload 10: User should fail to insert notification documents for other users', async () => {
    const context = testEnv.authenticatedContext('user_spammer', { email_verified: true });
    const db = context.firestore();
    const noteRef = doc(db, 'notifications/spam_notification');

    await assertFails(setDoc(noteRef, {
      userId: 'victim_user',
      title: 'Spam Alert',
      body: 'Get rich quick'
    }));
  });

  // 11. Commission Sabotage
  test('Malicious Payload 11: Non-admin should fail to alter global commission rules', async () => {
    const context = testEnv.authenticatedContext('user_customer', { email_verified: true });
    const db = context.firestore();
    const ruleRef = doc(db, 'commissionRules/sabotage_rule');

    await assertFails(setDoc(ruleRef, {
      platformPercentage: 0,
      centrePercentage: 100,
      isActive: true
    }));
  });

  // 12. Revenue Stealing
  test('Malicious Payload 12: Hub Owner should fail to modify system commission records', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'commissionRecords/record_1'), {
        shipmentId: 'shp_1',
        totalFee: 1000,
        platformAmount: 400,
        centreAmount: 600,
        centreId: 'center_a'
      });
    });

    const context = testEnv.authenticatedContext('owner_a', { email_verified: true });
    const db = context.firestore();
    const recordRef = doc(db, 'commissionRecords/record_1');

    await assertFails(updateDoc(recordRef, {
      centreAmount: 900,
      platformAmount: 100
    }));
  });
});
```
