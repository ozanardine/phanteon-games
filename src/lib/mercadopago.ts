// src/lib/mercadopago.ts
// Este arquivo trata da integração com a API do Mercado Pago
// Você precisará instalar o SDK do Mercado Pago: npm install mercadopago

import { SubscriptionPlan, UserProfile } from './supabase';

// Tipo para preferência de pagamento
export interface PaymentPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

/**
 * Cria uma preferência de pagamento para assinatura
 * Esta função será chamada pelo nosso backend
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
    const response = await fetch('/api/payments/create-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId: plan.id,
        subscriptionId: subscriptionId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao criar preferência de pagamento');
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
      throw new Error(errorData.message || 'Erro ao verificar status do pagamento');
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
}> {
  try {
    const response = await fetch('/api/subscriptions/cancel', {
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
      throw new Error(errorData.message || 'Erro ao cancelar assinatura');
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Erro desconhecido'),
    };
  }
}