import { walletRepository, transactionRepository } from './db/FinancialRepository';
import { withdrawalRepository } from './db/WithdrawalRepository';
import { userRepository } from './db/UserRepository';
import { paymentProtectionRepository } from './db/PaymentProtectionRepository';
import { auditEngine } from '../engines/AuditEngine';
import { notificationEngine } from '../engines/NotificationEngine';
import { configurationEngine } from '../engines/ConfigurationEngine';
import { Transaction, Wallet, WithdrawalRequest } from '../types';
import { where } from 'firebase/firestore';

export const settlementService = {
  /**
   * Weekly/Dynamic Settlement Processing
   * Iterates through pending transactions, validates settlement delays, and releases funds.
   */
  async processSettlement(): Promise<void> {
    const paymentSettings = await configurationEngine.getPaymentSettings();
    const settlementDelaySec = paymentSettings.settlementDelays || 86400; // default 24h
    const now = new Date();

    // Fetch all PENDING credit transactions representing earnings
    const pendingTransactions = await transactionRepository.getAll([
      where('status', '==', 'PENDING'),
      where('type', '==', 'CREDIT')
    ]);

    for (const tx of pendingTransactions) {
      try {
        const txTime = new Date(tx.timestamp);
        const secondsElapsed = (now.getTime() - txTime.getTime()) / 1000;

        if (secondsElapsed >= settlementDelaySec) {
          // Process transition inside atomic operations
          await walletRepository.transaction(async () => {
            const wallet = await walletRepository.getByUserId(tx.userId);
            if (!wallet) return;

            // Update wallet balances securely
            const pendingBal = Math.max(0, (wallet.pendingBalance || 0) - tx.amount);
            const availableBal = (wallet.balance || 0) + tx.amount;
            const newTotalEarned = (wallet.totalEarned || 0) + tx.amount;

            // Keep track of segmented earnings based on transaction category
            let merchantEarnings = wallet.merchantEarnings || 0;
            let centreEarnings = wallet.centreEarnings || 0;
            let dispatchEarnings = wallet.dispatchEarnings || 0;
            let platformEarnings = wallet.platformEarnings || 0;

            if (tx.category === 'SHIPMENT_PAYMENT') {
              merchantEarnings += tx.amount;
            } else if (tx.category === 'COMMISSION') {
              centreEarnings += tx.amount;
            } else if (tx.category === 'PLATFORM_CHARGE') {
              platformEarnings += tx.amount;
            } else if (tx.category === 'PAYOUT') {
              dispatchEarnings += tx.amount;
            }

            await walletRepository.update(wallet.id, {
              balance: availableBal,
              pendingBalance: pendingBal,
              totalEarned: newTotalEarned,
              merchantEarnings,
              centreEarnings,
              dispatchEarnings,
              platformEarnings,
              lastUpdated: new Date().toISOString()
            });

            // Mark transaction as COMPLETED
            await transactionRepository.update(tx.id, {
              status: 'COMPLETED',
              updatedAt: new Date().toISOString()
            });

            // Log secure audit trail
            await auditEngine.logEvent({
              userId: tx.userId,
              action: 'SETTLEMENT_RELEASED_SUCCESS',
              details: {
                transactionId: tx.id,
                amount: tx.amount,
                previousAvailableBalance: wallet.balance,
                newAvailableBalance: availableBal,
                previousPendingBalance: wallet.pendingBalance,
                newPendingBalance: pendingBal,
                category: tx.category,
                referenceId: tx.referenceId
              },
              result: 'SUCCESS'
            });

            // Notify user of settlement completion
            await notificationEngine.send(
              tx.userId,
              'Settlement Funds Available',
              `Your settlement of ₦${tx.amount.toLocaleString()} is now available for withdrawal in your wallet.`,
              'SUCCESS',
              undefined,
              'PAYMENT'
            );
          });
        }
      } catch (txErr) {
        console.error(`Failed to process settlement for transaction ${tx.id}:`, txErr);
        await auditEngine.logEvent({
          userId: tx.userId || 'SYSTEM',
          action: 'SETTLEMENT_RELEASED_FAILURE',
          details: {
            transactionId: tx.id,
            error: txErr instanceof Error ? txErr.message : 'Unknown settlement error'
          },
          result: 'FAILURE'
        });
      }
    }
  },

  /**
   * Request withdrawal from available wallet balance.
   */
  async requestWithdrawal(userId: string, amount: number): Promise<WithdrawalRequest> {
    if (amount <= 0) {
      throw new Error('Withdrawal amount must be greater than zero.');
    }

    const settings = await configurationEngine.getGlobalSettings();
    const paymentSettings = await configurationEngine.getPaymentSettings();
    const minLimit = settings.platformFees?.percentage ? 2000 : 2000; // minimum withdrawal 2k
    const maxLimit = 500000; // maximum withdrawal 500k

    if (amount < minLimit) {
      throw new Error(`Minimum withdrawal limit is ₦${minLimit.toLocaleString()}.`);
    }
    if (amount > maxLimit) {
      throw new Error(`Maximum daily withdrawal limit is ₦${maxLimit.toLocaleString()}.`);
    }

    // Load Wallet
    const wallet = await walletRepository.getByUserId(userId);
    if (!wallet) {
      throw new Error('Wallet record not found. Please contact support.');
    }

    // Check availability
    if (wallet.balance < amount) {
      throw new Error('Insufficient available balance to complete withdrawal.');
    }

    // Check bank configuration requirement
    if (!wallet.bankInfo || !wallet.bankInfo.accountNumber || !wallet.bankInfo.bankName || !wallet.bankInfo.accountName) {
      throw new Error('Please configure and verify your settlement bank account before requesting withdrawal.');
    }

    // KYC Check
    const user = await userRepository.getById(userId);
    if (!user) {
      throw new Error('User account not found.');
    }
    if (user.status === 'SUSPENDED' || user.status === 'BLOCKED') {
      throw new Error('Your user account is restricted from performing financial operations.');
    }
    // Trust score and verification level check
    if (user.verificationStatus?.kyc !== true && user.status !== 'APPROVED' && !user.roles?.includes('SUPER_ADMIN' as any) && user.role !== 'SUPER_ADMIN') {
      throw new Error('Withdrawals require complete profile verification and KYC approval.');
    }

    // Dispute check - Freeze withdrawals if merchant has active disputes open
    const openDisputes = await paymentProtectionRepository.getAll([
      where('merchantId', '==', userId),
      where('status', '==', 'DISPUTE_OPENED')
    ]);
    if (openDisputes.length > 0) {
      throw new Error('Withdrawal request frozen due to active payment protection dispute. Resolve open disputes first.');
    }

    // Double Withdrawal Prevention (Idempotency)
    const existingPending = await withdrawalRepository.getAll([
      where('userId', '==', userId),
      where('status', '==', 'PENDING')
    ]);
    if (existingPending.length > 0) {
      throw new Error('A pending withdrawal is already being processed. Please wait for it to complete.');
    }

    const withdrawalId = `WDL-${Date.now()}`;
    const withdrawal: WithdrawalRequest = {
      id: withdrawalId,
      userId,
      amount,
      currency: wallet.currency || 'NGN',
      status: 'PENDING',
      bankInfo: {
        accountNumber: wallet.bankInfo.accountNumber,
        bankName: wallet.bankInfo.bankName,
        accountName: wallet.bankInfo.accountName
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Atomic Balance Lock and Transaction Creation
    await walletRepository.transaction(async () => {
      // Re-fetch inside transaction for absolute state synchronization
      const currentWallet = await walletRepository.getByUserId(userId);
      if (!currentWallet || currentWallet.balance < amount) {
        throw new Error('State mismatch or insufficient balance detected.');
      }

      const previousBalance = currentWallet.balance;
      const previousPending = currentWallet.pendingBalance || 0;

      // Lock funds in pendingBalance
      await walletRepository.update(currentWallet.id, {
        balance: previousBalance - amount,
        pendingBalance: previousPending + amount,
        lastUpdated: new Date().toISOString()
      });

      // Save Withdrawal request
      await withdrawalRepository.create(withdrawalId, withdrawal);

      // Create PENDING Debit Payout Transaction
      const transactionId = `TX-WDL-${Date.now()}`;
      const transaction: Transaction = {
        id: transactionId,
        walletId: currentWallet.id,
        userId,
        amount,
        type: 'DEBIT',
        category: 'PAYOUT',
        status: 'PENDING',
        referenceId: withdrawalId,
        description: `Withdrawal request to ${withdrawal.bankInfo.bankName} (${withdrawal.bankInfo.accountNumber})`,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await transactionRepository.create(transactionId, transaction);

      // Save Audit log with absolute parameters
      await auditEngine.logEvent({
        userId,
        action: 'WITHDRAWAL_REQUEST_INITIATED',
        details: {
          withdrawalId,
          amount,
          currency: wallet.currency,
          previousBalance,
          newBalance: previousBalance - amount,
          previousPendingBalance: previousPending,
          newPendingBalance: previousPending + amount,
          bankInfo: withdrawal.bankInfo
        },
        result: 'SUCCESS'
      });

      // Send operational alert for super admin approval
      await notificationEngine.sendOperationalAlert(
        'New Withdrawal Request',
        `User ${user.wesabiUsername || user.id} requested withdrawal of ₦${amount.toLocaleString()} to ${withdrawal.bankInfo.bankName}`,
        'HIGH'
      );

      // Send confirmation notification to user
      await notificationEngine.send(
        userId,
        'Withdrawal Requested',
        `Your withdrawal of ₦${amount.toLocaleString()} to ${withdrawal.bankInfo.bankName} has been submitted for approval.`,
        'WARNING',
        undefined,
        'PAYMENT'
      );
    });

    return withdrawal;
  },

  /**
   * Admin approve withdrawal request
   */
  async approveWithdrawal(withdrawalId: string, adminId: string): Promise<void> {
    const withdrawal = await withdrawalRepository.getById(withdrawalId);
    if (!withdrawal) throw new Error('Withdrawal request not found.');
    if (withdrawal.status !== 'PENDING') throw new Error('Withdrawal is not in PENDING state.');

    const wallet = await walletRepository.getByUserId(withdrawal.userId);
    if (!wallet) throw new Error('Wallet not found.');

    const payoutRef = `PO-HUB-${withdrawalId}`;
    const recipientCode = wallet.bankInfo?.recipientCode;

    if (!recipientCode) {
      throw new Error('Hub Owner bank account has not been provider-verified. Recipient details missing.');
    }

    // Execute provider transfer
    let transferStatus: 'SUCCESS' | 'PENDING' | 'FAILED' = 'PENDING';
    let transferCode = '';
    let transferError = '';

    try {
      const { paymentEngine } = await import('../engines/PaymentEngine');
      const transferRes = await paymentEngine.transferFunds({
        amount: withdrawal.amount,
        recipientCode,
        reference: payoutRef,
        reason: `OmorfiHub Hub Owner Payout - ${withdrawalId}`
      });
      transferStatus = transferRes.status;
      transferCode = transferRes.transferCode || '';
    } catch (err: any) {
      console.error(`External bank payout failed for withdrawal ${withdrawalId}:`, err);
      transferStatus = 'FAILED';
      transferError = err.message || 'External bank transfer execution failed';
    }

    if (transferStatus === 'FAILED') {
      throw new Error(`Bank payout transfer failed: ${transferError}. Withdrawal remains pending.`);
    }

    await walletRepository.transaction(async () => {
      // Update withdrawal status
      await withdrawalRepository.update(withdrawalId, {
        status: 'APPROVED',
        transferStatus,
        transferCode,
        payoutRef,
        approvedAt: new Date().toISOString(),
        approvedBy: adminId,
        updatedAt: new Date().toISOString()
      });

      // Deduct from pendingBalance permanently
      const currentPending = wallet.pendingBalance || 0;
      await walletRepository.update(wallet.id, {
        pendingBalance: Math.max(0, currentPending - withdrawal.amount),
        lastUpdated: new Date().toISOString()
      });

      // Update payout transaction to COMPLETED
      const txs = await transactionRepository.getAll([
        where('referenceId', '==', withdrawalId),
        where('category', '==', 'PAYOUT')
      ]);

      for (const tx of txs) {
        await transactionRepository.update(tx.id, {
          status: 'COMPLETED',
          updatedAt: new Date().toISOString()
        });
      }

      // Log successful payout audit record
      await auditEngine.logEvent({
        userId: withdrawal.userId,
        action: 'WITHDRAWAL_APPROVED_BY_ADMIN',
        details: {
          withdrawalId,
          payoutRef,
          approvedBy: adminId,
          amount: withdrawal.amount,
          bankInfo: withdrawal.bankInfo,
          transferStatus,
          transferCode
        },
        result: 'SUCCESS'
      });

      // Notify User
      await notificationEngine.send(
        withdrawal.userId,
        'Withdrawal Approved & Sent',
        `Your withdrawal request of ₦${withdrawal.amount.toLocaleString()} has been approved and sent to your bank account.`,
        'SUCCESS',
        undefined,
        'PAYMENT'
      );
    });
  },

  /**
   * Admin reject withdrawal request
   */
  async rejectWithdrawal(withdrawalId: string, adminId: string, reason: string): Promise<void> {
    const withdrawal = await withdrawalRepository.getById(withdrawalId);
    if (!withdrawal) throw new Error('Withdrawal request not found.');
    if (withdrawal.status !== 'PENDING') throw new Error('Withdrawal is not in PENDING state.');

    await walletRepository.transaction(async () => {
      const wallet = await walletRepository.getByUserId(withdrawal.userId);
      if (!wallet) throw new Error('Wallet not found.');

      // Reject withdrawal
      await withdrawalRepository.update(withdrawalId, {
        status: 'REJECTED',
        reason,
        approvedAt: new Date().toISOString(),
        approvedBy: adminId,
        updatedAt: new Date().toISOString()
      });

      // Return funds from pending to available
      const currentBalance = wallet.balance || 0;
      const currentPending = wallet.pendingBalance || 0;
      await walletRepository.update(wallet.id, {
        balance: currentBalance + withdrawal.amount,
        pendingBalance: Math.max(0, currentPending - withdrawal.amount),
        lastUpdated: new Date().toISOString()
      });

      // Fail corresponding transaction
      const txs = await transactionRepository.getAll([
        where('referenceId', '==', withdrawalId),
        where('category', '==', 'PAYOUT')
      ]);

      for (const tx of txs) {
        await transactionRepository.update(tx.id, {
          status: 'FAILED',
          updatedAt: new Date().toISOString()
        });
      }

      // Log rejection audit record
      await auditEngine.logEvent({
        userId: withdrawal.userId,
        action: 'WITHDRAWAL_REJECTED_BY_ADMIN',
        details: {
          withdrawalId,
          rejectedBy: adminId,
          amount: withdrawal.amount,
          reason
        },
        result: 'SUCCESS'
      });

      // Notify User
      await notificationEngine.send(
        withdrawal.userId,
        'Withdrawal Request Declined',
        `Your withdrawal request of ₦${withdrawal.amount.toLocaleString()} was declined. Reason: ${reason}. Funds returned to your available balance.`,
        'ERROR',
        undefined,
        'PAYMENT'
      );
    });
  }
};
