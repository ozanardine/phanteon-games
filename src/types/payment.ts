// src/types/payment.ts

// Tipos para provedores de pagamento
export type PaymentProvider = 'mercadopago' | 'paypal';
export type SubscriptionStatus = 'active' | 'expired' | 'pending';
export type PaymentStatus = 'succeeded' | 'pending' | 'failed';

// Interface para recursos do VIP
export interface VipFeature {
  name: string;
  included: boolean | string;
  highlight?: boolean;
}

// Interface para plano VIP
export interface VipPlan {
  id: string;
  name: string;
  price: number;
  features: VipFeature[];
  isActive: boolean;
}

// Interface para benefícios VIP no servidor
export interface ServerVipBenefit {
  id: string;
  name: string;
  description: string;
  command?: string;
  cooldown?: number; // em segundos
}

// Interface para assinaturas ativas
export interface Subscription {
  id: string;
  userId: string;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  paymentProvider: PaymentProvider;
  paymentProviderId: string;
  createdAt: Date;
}

// Interface para histórico de pagamento
export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentProvider: PaymentProvider;
  paymentMethod: string;
  invoiceUrl?: string;
  receiptUrl?: string;
  createdAt: Date;
}

// Interface para dados de criação de checkout
export interface CreateCheckoutData {
  provider?: PaymentProvider;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  customerName?: string;
}

// Interface para resposta de criação de checkout
export interface CreateCheckoutResponse {
  success: boolean;
  url?: string;
  error?: string;
}

// Interface para dados de webhook de pagamento
export interface PaymentWebhookData {
  provider: PaymentProvider;
  eventType: string;
  eventId: string;
  paymentId?: string;
  userId?: string;
  status: string;
  amount?: number;
  metadata?: Record<string, any>;
}