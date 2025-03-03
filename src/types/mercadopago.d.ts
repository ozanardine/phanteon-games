// Declaração de tipos para o pacote mercadopago
declare module 'mercadopago' {
    // Interface básica para a função configure
    interface ConfigureOptions {
      access_token: string;
      [key: string]: any;
    }
  
    // Interface para representar a resposta de uma operação
    interface MercadoPagoResponse<T> {
      body: T;
      status: number;
      response?: any;
      [key: string]: any;
    }
  
    // Interfaces para pagamentos
    interface PaymentResponse {
      id: string;
      status: string;
      status_detail: string;
      transaction_amount: number;
      currency_id: string;
      external_reference?: string;
      payer?: {
        id?: string;
        email?: string;
        [key: string]: any;
      };
      [key: string]: any;
    }
  
    // Interfaces para preferências
    interface PreferenceItem {
      id?: string;
      title: string;
      description?: string;
      picture_url?: string;
      category_id?: string;
      quantity: number;
      currency_id: string;
      unit_price: number;
      [key: string]: any;
    }
  
    interface PreferenceOptions {
      items: PreferenceItem[];
      payer?: {
        name?: string;
        email?: string;
        id?: string;
        [key: string]: any;
      };
      external_reference?: string;
      back_urls?: {
        success?: string;
        failure?: string;
        pending?: string;
      };
      auto_return?: string;
      notification_url?: string;
      payment_methods?: {
        excluded_payment_types?: { id: string }[];
        excluded_payment_methods?: { id: string }[];
        installments?: number;
        [key: string]: any;
      };
      statement_descriptor?: string;
      metadata?: any;
      binary_mode?: boolean;
      [key: string]: any;
    }
  
    interface PreferenceResponse {
      id: string;
      init_point: string;
      sandbox_init_point: string;
      [key: string]: any;
    }
  
    // Interfaces para assinaturas recorrentes (preapproval)
    interface PreapprovalOptions {
      payer_email: string;
      back_url?: string;
      reason: string;
      external_reference: string;
      notification_url?: string;
      auto_recurring: {
        frequency: number;
        frequency_type: string;
        transaction_amount: number;
        currency_id: string;
        [key: string]: any;
      };
      status?: string;
      card_token_id?: string | null;
      [key: string]: any;
    }
  
    interface PreapprovalUpdateOptions {
      id: string;
      status: string;
      [key: string]: any;
    }
  
    // Módulos e funções
    interface PaymentModule {
      get(paymentId: string | number): Promise<MercadoPagoResponse<PaymentResponse>>;
      create(data: any): Promise<MercadoPagoResponse<PaymentResponse>>;
      search(options: any): Promise<MercadoPagoResponse<any>>;
      update(id: string | number, data: any): Promise<MercadoPagoResponse<any>>;
      [key: string]: any;
    }
  
    interface PreferencesModule {
      create(options: PreferenceOptions): Promise<MercadoPagoResponse<PreferenceResponse>>;
      get(id: string): Promise<MercadoPagoResponse<any>>;
      update(id: string, options: any): Promise<MercadoPagoResponse<any>>;
      [key: string]: any;
    }
  
    interface PreapprovalModule {
      create(options: PreapprovalOptions): Promise<MercadoPagoResponse<any>>;
      get(id: string): Promise<MercadoPagoResponse<any>>;
      update(options: PreapprovalUpdateOptions): Promise<MercadoPagoResponse<any>>;
      search(options: any): Promise<MercadoPagoResponse<any>>;
      [key: string]: any;
    }
  
    // API Principal
    interface MercadoPagoAPI {
      configure(options: ConfigureOptions): void;
      payment: PaymentModule;
      preferences: PreferencesModule;
      preapproval: PreapprovalModule;
      [key: string]: any;
    }
  
    const mercadopago: MercadoPagoAPI;
    export = mercadopago;
  }