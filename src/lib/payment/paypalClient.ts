// src/lib/payment/paypalClient.ts

// PayPal configuration and credentials
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// VIP price in USD (for PayPal)
const VIP_PRICE_USD = 5.99;

// Mapping of plan ID in PayPal
const PAYPAL_PLAN_ID = process.env.PAYPAL_VIP_PLAN_ID;

// Parameter types
interface CreateSubscriptionParams {
  billingCycle?: 'monthly'; // Simplificado para apenas mensal
  userId: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}

/**
 * Gets access token for PayPal API
 */
async function getAccessToken(): Promise<string> {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error('PayPal credentials not configured');
    }

    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`PayPal auth failed: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting PayPal access token:', error);
    throw error;
  }
}

/**
 * Creates a PayPal subscription
 */
export async function createSubscription({
  userId,
  successUrl,
  cancelUrl,
}: CreateSubscriptionParams): Promise<string | null> {
  try {
    // Check if credentials are configured
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      console.error('PayPal credentials not configured');
      return null;
    }

    // Get access token
    const accessToken = await getAccessToken();

    // Get plan ID
    const planId = PAYPAL_PLAN_ID;
    if (!planId) {
      throw new Error(`VIP plan ID not configured`);
    }

    // Create subscription
    const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `sub_${userId}_${Date.now()}`, // Prevent duplicate requests
      },
      body: JSON.stringify({
        plan_id: planId,
        application_context: {
          brand_name: 'Phanteon Games',
          locale: 'pt-BR',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
          },
          return_url: successUrl,
          cancel_url: cancelUrl,
        },
        custom_id: userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Error in PayPal response:', errorData);
      throw new Error(`Error creating subscription: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    // Extract and return approval URL
    const approvalUrl = data.links.find((link: any) => link.rel === 'approve')?.href;
    if (!approvalUrl) {
      throw new Error('Approval URL not found in PayPal response');
    }
    return approvalUrl;
  } catch (error) {
    console.error('Error creating PayPal subscription:', error);
    return null;
  }
}

/**
 * Creates a one-time payment with PayPal (for non-subscription models)
 */
export async function createPayment({
  userId,
  successUrl,
  cancelUrl,
}: CreateSubscriptionParams): Promise<string | null> {
  try {
    // Check if credentials are configured
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      console.error('PayPal credentials not configured');
      return null;
    }

    // Get access token
    const accessToken = await getAccessToken();

    // Create payment order
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `pay_${userId}_${Date.now()}`, // Prevent duplicate requests
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: VIP_PRICE_USD.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: 'USD',
                  value: VIP_PRICE_USD.toFixed(2),
                },
              },
            },
            description: `Phanteon Games VIP`,
            custom_id: `${userId}:vip`,
            items: [
              {
                name: `VIP`,
                description: `Phanteon Games VIP subscription`,
                quantity: '1',
                unit_amount: {
                  currency_code: 'USD',
                  value: VIP_PRICE_USD.toFixed(2),
                },
                category: 'DIGITAL_GOODS',
              },
            ],
          },
        ],
        application_context: {
          brand_name: 'Phanteon Games',
          locale: 'pt-BR',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: successUrl,
          cancel_url: cancelUrl,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Error in PayPal response:', errorData);
      throw new Error(`Error creating payment: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    // Extract and return approval URL
    const approvalUrl = data.links.find((link: any) => link.rel === 'approve')?.href;
    if (!approvalUrl) {
      throw new Error('Approval URL not found in PayPal response');
    }
    return approvalUrl;
  } catch (error) {
    console.error('Error creating PayPal payment:', error);
    return null;
  }
}

/**
 * Verifies and captures an approved payment
 */
export async function capturePayment(orderId: string): Promise<boolean> {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `cap_${orderId}_${Date.now()}`, // Prevent duplicate captures
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Error capturing payment:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error capturing payment:', error);
    return false;
  }
}

/**
 * Cancels a PayPal subscription
 */
export async function cancelSubscription(subscriptionId: string, reason: string = 'Canceled by user'): Promise<boolean> {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        reason: reason,
      }),
    });

    return response.status === 204; // PayPal returns 204 No Content for successful cancellation
  } catch (error) {
    console.error('Error canceling PayPal subscription:', error);
    return false;
  }
}

/**
 * Processes a PayPal webhook
 */
export async function verifyWebhookSignature(
  payload: any,
  headers: Record<string, string>
): Promise<boolean> {
  try {
    const accessToken = await getAccessToken();
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    if (!webhookId) {
      console.error('PayPal webhook ID not configured');
      return false;
    }

    const response = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        webhook_id: webhookId,
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_event: payload,
      }),
    });

    if (!response.ok) {
      console.error('Error verifying webhook signature:', await response.text());
      return false;
    }

    const data = await response.json();
    return data.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}