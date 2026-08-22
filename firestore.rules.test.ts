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

  // PHASE A2: User Profile Field Restrictions
  test('PHASE A2-1: User can update safe profile fields (displayName, phoneNumber)', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users/user_normal'), {
        uid: 'user_normal',
        email: 'user@example.com',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        displayName: 'Original Name',
        phoneNumber: '1234567890'
      });
    });

    const context = testEnv.authenticatedContext('user_normal', { email_verified: true });
    const db = context.firestore();
    const userRef = doc(db, 'users/user_normal');

    // Should succeed: updating safe fields
    await assertSucceeds(updateDoc(userRef, {
      displayName: 'Updated Name',
      phoneNumber: '+9876543210'
    }));
  });

  test('PHASE A2-2: User CANNOT update role field', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users/user_normal'), {
        uid: 'user_normal',
        email: 'user@example.com',
        role: 'CUSTOMER',
        status: 'ACTIVE'
      });
    });

    const context = testEnv.authenticatedContext('user_normal', { email_verified: true });
    const db = context.firestore();
    const userRef = doc(db, 'users/user_normal');

    // Should fail: attempting to change role
    await assertFails(updateDoc(userRef, { role: 'SUPER_ADMIN' }));
  });

  test('PHASE A2-3: User CANNOT update status field', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users/user_suspended'), {
        uid: 'user_suspended',
        email: 'user@example.com',
        role: 'CUSTOMER',
        status: 'SUSPENDED'
      });
    });

    const context = testEnv.authenticatedContext('user_suspended', { email_verified: true });
    const db = context.firestore();
    const userRef = doc(db, 'users/user_suspended');

    // Should fail: attempting to change status from SUSPENDED to ACTIVE
    await assertFails(updateDoc(userRef, { status: 'ACTIVE' }));
  });

  test('PHASE A2-4: User CANNOT add roles field via update', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users/user_normal'), {
        uid: 'user_normal',
        email: 'user@example.com',
        role: 'CUSTOMER',
        status: 'ACTIVE'
      });
    });

    const context = testEnv.authenticatedContext('user_normal', { email_verified: true });
    const db = context.firestore();
    const userRef = doc(db, 'users/user_normal');

    // Should fail: attempting to add roles array with SUPER_ADMIN
    await assertFails(updateDoc(userRef, {
      roles: ['SUPER_ADMIN']
    }));
  });

  // PHASE A2: System Settings Protection
  test('PHASE A2-5: Unauthenticated user CANNOT write to systemSettings', async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    const settingsRef = doc(db, 'systemSettings/global');

    await assertFails(setDoc(settingsRef, { maliciousFlag: true }));
  });

  test('PHASE A2-6: Normal user CANNOT write to systemSettings', async () => {
    const context = testEnv.authenticatedContext('user_normal', { email_verified: true });
    const db = context.firestore();
    const settingsRef = doc(db, 'systemSettings/global');

    await assertFails(setDoc(settingsRef, { setting: 'value' }));
  });

  // PHASE A2: Audit Logs Protection
  test('PHASE A2-7: Unauthenticated user CANNOT create auditLogs', async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    const logRef = doc(db, 'auditLogs/fake_log');

    await assertFails(setDoc(logRef, {
      userId: 'spoofed_admin',
      action: 'FAKE_ACTION',
      timestamp: new Date().toISOString()
    }));
  });

  test('PHASE A2-8: Authenticated user CANNOT create auditLogs', async () => {
    const context = testEnv.authenticatedContext('user_normal', { email_verified: true });
    const db = context.firestore();
    const logRef = doc(db, 'auditLogs/fake_log');

    await assertFails(setDoc(logRef, {
      userId: 'spoofed_actor',
      action: 'FAKE_ACTION',
      timestamp: new Date().toISOString()
    }));
  });

  // PHASE A2: Financial Data Protection
  test('PHASE A2-9: User CANNOT create receipts via client', async () => {
    const context = testEnv.authenticatedContext('user_normal', { email_verified: true });
    const db = context.firestore();
    const receiptRef = doc(db, 'receipts/fake_receipt');

    await assertFails(setDoc(receiptRef, {
      userId: 'user_normal',
      amount: 5000,
      status: 'SUCCESS'
    }));
  });

  test('PHASE A2-10: User CANNOT create platform_payments directly', async () => {
    const context = testEnv.authenticatedContext('user_normal', { email_verified: true });
    const db = context.firestore();
    const paymentRef = doc(db, 'platform_payments/fake_payment');

    await assertFails(setDoc(paymentRef, {
      userId: 'user_normal',
      amount: 5000,
      status: 'SUCCESS'
    }));
  });

  test('PHASE A2-11: User CANNOT directly modify withdrawalRequests', async () => {
    const context = testEnv.authenticatedContext('user_normal', { email_verified: true });
    const db = context.firestore();
    const withdrawalRef = doc(db, 'withdrawalRequests/fake_withdrawal');

    await assertFails(setDoc(withdrawalRef, {
      userId: 'user_normal',
      amount: 5000,
      status: 'APPROVED'
    }));
  });

  // PHASE A2: Points/Trust Protection
  test('PHASE A2-12: User CANNOT modify wesabiHubPoints', async () => {
    const context = testEnv.authenticatedContext('user_normal', { email_verified: true });
    const db = context.firestore();
    const pointsRef = doc(db, 'wesabiHubPoints/hub_123');

    await assertFails(updateDoc(pointsRef, { points: 999999999 }));
  });

  test('PHASE A2-13: User CANNOT create auditLog entries in wesabiPointAuditLogs', async () => {
    const context = testEnv.authenticatedContext('user_normal', { email_verified: true });
    const db = context.firestore();
    const auditRef = doc(db, 'wesabiPointAuditLogs/fake_audit');

    await assertFails(setDoc(auditRef, {
      userId: 'user_normal',
      action: 'FRAUDULENT_POINTS',
      points: 999999
    }));
  });

  // PHASE A2: Exceptions Protection
  test('PHASE A2-14: User CANNOT create exceptions via client (must use server endpoint)', async () => {
    const context = testEnv.authenticatedContext('user_normal', { email_verified: true });
    const db = context.firestore();
    const exceptionRef = doc(db, 'exceptions/fake_exception');

    await assertFails(setDoc(exceptionRef, {
      userId: 'user_normal',
      type: 'FRAUDULENT_TRANSACTION',
      priority: 'Critical'
    }));
  });

  // PHASE A2: Knowledge Review Protection
  test('PHASE A2-15: User CANNOT approve knowledgeReviewRequests via client', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'knowledgeReviewRequests/req_1'), {
        id: 'req_1',
        submittedBy: 'user_a',
        status: 'PENDING_REVIEW'
      });
    });

    const context = testEnv.authenticatedContext('user_normal', { email_verified: true });
    const db = context.firestore();
    const reviewRef = doc(db, 'knowledgeReviewRequests/req_1');

    // Should fail: normal user cannot update status (must be done by knowledge-admin via server)
    await assertFails(updateDoc(reviewRef, { status: 'APPROVED' }));
  });

  // PHASE A2: Ratings Protection
  test('PHASE A2-16: User A CANNOT modify ratings created by User B', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'wesabiRatings/rating_1'), {
        id: 'rating_1',
        ratedBy: 'user_a',
        score: 5,
        comment: 'Excellent service'
      });
    });

    const context = testEnv.authenticatedContext('user_b', { email_verified: true });
    const db = context.firestore();
    const ratingRef = doc(db, 'wesabiRatings/rating_1');

    // Should fail: user_b cannot modify user_a's rating
    await assertFails(updateDoc(ratingRef, { score: 1, comment: 'Bad service' }));
  });

  // PHASE A2: Operational Notifications
  test('PHASE A2-17: User CANNOT create operational_notifications', async () => {
    const context = testEnv.authenticatedContext('user_normal', { email_verified: true });
    const db = context.firestore();
    const notificationRef = doc(db, 'operational_notifications/fake_notification');

    await assertFails(setDoc(notificationRef, {
      title: 'System Alert',
      message: 'Something happened'
    }));
  });

  // PHASE A2: Policy Versions
  test('PHASE A2-18: User CANNOT modify policyVersions', async () => {
    const context = testEnv.authenticatedContext('user_normal', { email_verified: true });
    const db = context.firestore();
    const policyRef = doc(db, 'policyVersions/policy_1');

    await assertFails(setDoc(policyRef, {
      version: '2.0',
      content: 'malicious policy'
    }));
  });
});
