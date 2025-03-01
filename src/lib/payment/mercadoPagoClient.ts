// src/lib/payment/mercadoPagoClient.ts
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

// Initialize MercadoPago client
const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
const client = new MercadoPagoConfig({ accessToken: mpAccessToken });

// Instanciating payment and preference clients
const paymentClient = new Payment(client);
const preferenceClient = new Preference(client);

// Preço fixo do plano VIP
const VIP_PRICE = 29.90;

// Types for functions
interface CreateCheckoutParams {
  userId: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  customerName?: string;
}

/**
 * Creates a payment preference in MercadoPago
 */
export const createPaymentPreference = async ({
  userId,
  successUrl,
  cancelUrl,
  customerEmail,
  customerName,
}: CreateCheckoutParams): Promise<string | null> => {
  if (!mpAccessToken) {
    console.error('MercadoPago not configured');
    return null;
  }

  try {
    // Create a payment preference
    const preferenceData = {
      items: [
        {
          id: `vip-${Date.now()}`,
          title: `Phanteon Games VIP`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: VIP_PRICE,
          description: 'Plano VIP Phanteon Games'
        }
      ],
      payer: {
        email: customerEmail || 'guest@example.com',
        name: customerName || 'Guest',
      },
      external_reference: `${userId}:vip:monthly`,
      back_urls: {
        success: successUrl,
        failure: cancelUrl,
        pending: `${successUrl}?status=pending`,
      },
      auto_return: 'approved',
    };

    const response = await preferenceClient.create({ body: preferenceData });
    
    if (!response.init_point) {
      console.error('MercadoPago response missing init_point:', response);
      return null;
    }
    
    return response.init_point;
  } catch (error) {
    console.error('Error creating payment preference:', error);
    return null;
  }
};

/**
 * Processes a MercadoPago webhook
 */
export const handleMercadoPagoWebhook = async (data: any): Promise<boolean> => {
  if (!mpAccessToken) {
    console.error('MercadoPago not configured');
    return false;
  }

  try {
    // Implement logic to process MercadoPago notifications
    if (data.type === 'payment') {
      const paymentId = data.data.id;
      try {
        // Get payment details
        const payment = await paymentClient.get({ id: paymentId });
        
        // Process payment as needed
        if (payment && payment.status) {
          // Valid payment data
          return true;
        }
      } catch (err) {
        console.error('Error getting payment details:', err);
        return false;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error processing MercadoPago webhook:', error);
    return false;
  }
};

// Adicione export direto para as funções individuais
export { paymentClient, preferenceClient };
export default { createPaymentPreference, handleMercadoPagoWebhook };