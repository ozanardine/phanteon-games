import { SubscriptionPlan, UserProfile } from './supabase';

// Tipo para preferência de pagamento
export interface PaymentPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

// Determinar ambiente
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Cria uma preferência de pagamento para assinatura
 */
export async function createPaymentPreference(
  plan: SubscriptionPlan,
  user: UserProfile,
  subscriptionId: number
): Promise<{
  preference: PaymentPreference | null;
  error: Error | null;
}> {
  try {
    console.log(`Criando preferência de pagamento em ambiente ${isProduction ? 'PRODUÇÃO' : 'SANDBOX'}`);
    
    const response = await fetch('/api/payments/create-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId: plan.id,
        subscriptionId: subscriptionId,
        environment: isProduction ? 'production' : 'sandbox'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao criar preferência de pagamento');
    }

    const preference = await response.json();
    return { preference, error: null };
  } catch (error) {
    console.error('Error creating payment preference:', error);
    return {
      preference: null,
      error: error instanceof Error ? error : new Error('Erro desconhecido'),
    };
  }
}

/**
 * Verifica o status de um pagamento
 */
export async function checkPaymentStatus(paymentId: string): Promise<{
  status: string | null;
  error: Error | null;
}> {
  try {
    const response = await fetch(`/api/payments/check-status?payment_id=${paymentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao verificar status do pagamento');
    }

    const data = await response.json();
    return { status: data.status, error: null };
  } catch (error) {
    console.error('Error checking payment status:', error);
    return {
      status: null,
      error: error instanceof Error ? error : new Error('Erro desconhecido'),
    };
  }
}

/**
 * Cancela uma assinatura ativa
 */
export async function cancelSubscription(subscriptionId: number): Promise<{
  success: boolean;
  error: Error | null;
  retainUntil?: string;
}> {
  try {
    const response = await fetch('/api/subscriptions/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId,
        reason: 'user_requested', // razão opcional
        removeImmediately: false // manter benefícios até o fim do período por padrão
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao cancelar assinatura');
    }

    const data = await response.json();
    return { 
      success: data.success, 
      error: null,
      retainUntil: data.retainUntil 
    };
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Erro desconhecido'),
    };
  }
}

/**
 * Cria uma assinatura recorrente via API de pré-aprovação do Mercado Pago
 */
export async function createRecurringSubscription(
  plan: SubscriptionPlan,
  user: UserProfile,
  subscriptionId: number
): Promise<{
  subscription: any | null;
  error: Error | null;
}> {
  try {
    console.log(`Criando assinatura recorrente em ambiente ${isProduction ? 'PRODUÇÃO' : 'SANDBOX'}`);
    
    const response = await fetch('/api/payments/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId: plan.id,
        subscriptionId: subscriptionId,
        environment: isProduction ? 'production' : 'sandbox'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao criar assinatura recorrente');
    }

    const subscription = await response.json();
    return { subscription, error: null };
  } catch (error) {
    console.error('Error creating recurring subscription:', error);
    return {
      subscription: null,
      error: error instanceof Error ? error : new Error('Erro desconhecido'),
    };
  }
}

/**
 * Atualiza o método de pagamento de uma assinatura
 */
export async function updatePaymentMethod(subscriptionId: number): Promise<{
  success: boolean;
  error: Error | null;
  updateUrl?: string;
}> {
  try {
    const response = await fetch('/api/subscriptions/update-payment-method', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao atualizar método de pagamento');
    }

    const data = await response.json();
    return { 
      success: data.success, 
      error: null,
      updateUrl: data.updateUrl
    };
  } catch (error) {
    console.error('Error updating payment method:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Erro desconhecido'),
    };
  }
}