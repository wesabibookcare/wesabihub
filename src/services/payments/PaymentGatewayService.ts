import { PaymentGateway, PaymentInitiationData, PaymentResponse, PaymentVerificationResponse } from '../../types';
import { FlutterwaveProvider } from './FlutterwaveProvider';
import { PaystackProvider } from './PaystackProvider';
import { configurationEngine } from '../../engines/ConfigurationEngine';

export class PaymentGatewayService {
  private providers: Record<string, PaymentGateway>;

  constructor() {
    this.providers = {
      FLUTTERWAVE: new FlutterwaveProvider(),
      PAYSTACK: new PaystackProvider(),
    };
  }

  private async getProvider(): Promise<PaymentGateway> {
    const settings = await configurationEngine.getGlobalSettings();
    const providerName = settings.paymentConfig?.primaryProvider || 'FLUTTERWAVE';
    return this.providers[providerName] || this.providers['FLUTTERWAVE'];
  }

  public getProviderByName(name: string): PaymentGateway {
    return this.providers[name] || this.providers['FLUTTERWAVE'];
  }

  private async getFailoverProvider(): Promise<PaymentGateway> {
    const settings = await configurationEngine.getGlobalSettings();
    const providerName = settings.paymentConfig?.backupProvider || 'PAYSTACK';
    return this.providers[providerName] || this.providers['PAYSTACK'];
  }

  async initiatePayment(data: PaymentInitiationData): Promise<PaymentResponse> {
    const provider = await this.getProvider();
    try {
      return await provider.initiatePayment(data);
    } catch (error) {
      const failover = await this.getFailoverProvider();
      return await failover.initiatePayment(data);
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerificationResponse> {
    // This needs to know which provider to use.
    // Usually, the reference is prefixed or stored in metadata.
    // For now, try primary then failover.
    const provider = await this.getProvider();
    try {
      return await provider.verifyPayment(reference);
    } catch (error) {
      const failover = await this.getFailoverProvider();
      return await failover.verifyPayment(reference);
    }
  }
}

export const paymentGatewayService = new PaymentGatewayService();
