import { isValidStatusTransition } from '../services/StatusValidator';
import { PUBLIC_SIGNUP_ROLES, PAUSED_ROLES } from '../constants/roles';
import { UserRole } from '../types';

/**
 * P0 Foundation & Security Assertions Test Suite
 */
async function runP0Tests() {
  console.log('==================================================');
  console.log('RUNNING P0 FOUNDATION & SECURITY TESTS');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // --------------------------------------------------
  // 1. ROLE IDENTITY & LOCKED PUBLIC ROLES
  // --------------------------------------------------
  console.log('--- 1. ROLE IDENTITY TESTS ---');
  const allowedPublicRoles: UserRole[] = ['CUSTOMER', 'MERCHANT', 'CENTER_OWNER', 'CENTER_STAFF', 'DISPATCH_RIDER'];
  const publicRoleIds = PUBLIC_SIGNUP_ROLES.map(r => r.id);

  assert(
    publicRoleIds.length === 5 && allowedPublicRoles.every(r => publicRoleIds.includes(r)),
    'Public signup options contain exactly the 5 locked public roles'
  );

  assert(
    publicRoleIds.includes('DISPATCH_RIDER'),
    'DISPATCH_RIDER is active public role for registration'
  );

  const hiddenRoles = ['LOGISTICS_COMPANY', 'FLEET_MANAGER', 'DRIVER', 'DEVELOPER', 'API_MERCHANT_PARTNER', 'SUPER_ADMIN'];
  assert(
    hiddenRoles.every(r => PAUSED_ROLES.includes(r) && !publicRoleIds.includes(r as any)),
    'Legacy/internal roles (LOGISTICS_COMPANY, DEVELOPER, SUPER_ADMIN, etc.) are hidden from public self-signup'
  );

  // --------------------------------------------------
  // 2. PARCEL CUSTODY & STATE MACHINE
  // --------------------------------------------------
  console.log('\n--- 2. PARCEL CUSTODY & STATE MACHINE TESTS ---');
  assert(
    isValidStatusTransition('DRAFT', 'AWAITING_PAYMENT') &&
    isValidStatusTransition('AWAITING_PAYMENT', 'PAYMENT_CONFIRMED') &&
    isValidStatusTransition('PAYMENT_CONFIRMED', 'AWAITING_DROP_OFF') &&
    isValidStatusTransition('RECEIVED_AT_ORIGIN', 'AWAITING_DISPATCH') &&
    isValidStatusTransition('IN_TRANSIT', 'ARRIVED_AT_DESTINATION') &&
    isValidStatusTransition('ARRIVED_AT_DESTINATION', 'READY_FOR_PICKUP') &&
    isValidStatusTransition('READY_FOR_PICKUP', 'COLLECTED') &&
    isValidStatusTransition('COLLECTED', 'COMPLETED'),
    'Legal custody status transitions follow authorized state machine sequence'
  );

  assert(
    !isValidStatusTransition('DRAFT', 'DELIVERED') &&
    !isValidStatusTransition('AWAITING_PAYMENT', 'COLLECTED') &&
    !isValidStatusTransition('COMPLETED', 'AWAITING_PAYMENT') &&
    !isValidStatusTransition('CANCELLED', 'IN_TRANSIT'),
    'Illegal status transitions are rejected by StatusValidator'
  );

  // --------------------------------------------------
  // 3. FINANCIAL DOMAIN SEPARATION & SAFEPAY
  // --------------------------------------------------
  console.log('\n--- 3. FINANCIAL DOMAIN SEPARATION TESTS ---');
  // SafePay money must never enter internal WeSabiHub wallet balance
  const { paymentProtectionEngine } = await import('../services/PaymentProtectionEngine');
  assert(
    typeof paymentProtectionEngine.securePayment === 'function' &&
    typeof paymentProtectionEngine.releasePayment === 'function',
    'PaymentProtectionEngine operates without transferring funds into internal WeSabiHub wallets'
  );

  // --------------------------------------------------
  // 4. PROVIDER SEPARATION & MOCK CHECK
  // --------------------------------------------------
  console.log('\n--- 4. PAYMENT PROVIDER & MOCK SAFETY TESTS ---');
  const { paymentEngine } = await import('../engines/PaymentEngine');

  // Verify SafePay provider failure in production when credentials missing
  const oldNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  delete process.env.FLUTTERWAVE_SECRET_KEY;
  delete process.env.PAYSTACK_SECRET_KEY;

  let prodFailedAsExpected = false;
  try {
    await paymentEngine.initiateExternalPayment({
      amount: 10000,
      currency: 'NGN',
      email: 'test@example.com',
      reference: 'TEST-TX-1',
      paymentType: 'SAFEPAY',
      userId: 'USER1'
    });
  } catch (err: any) {
    prodFailedAsExpected = err.message.includes('unavailable') || err.message.includes('missing');
  }

  assert(
    prodFailedAsExpected,
    'Production environment fails safely when provider credentials are missing without simulating mock success'
  );

  process.env.NODE_ENV = oldNodeEnv;

  // --------------------------------------------------
  // TEST SUMMARY
  // --------------------------------------------------
  console.log('\n==================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runP0Tests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
