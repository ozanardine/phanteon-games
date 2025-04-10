import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Tipo para o corpo da requisição
interface RequestBody {
  planId: string;
  planName: string;
  amount: number;
  payer: {
    name: string;
    email: string;
  };
}

// Integração com o Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

// Cliente Supabase para acesso server-side
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    // Extrair dados do corpo da requisição
    const body: RequestBody = await request.json();
    const { planId, planName, amount, payer } = body;

    // Validar dados recebidos
    if (!planId || !planName || !amount || !payer.email) {
      return NextResponse.json(
        { message: "Dados incompletos" },
        { status: 400 }
      );
    }

    // Em produção, aqui seria implementada a integração com a API do Mercado Pago
    // Exemplo de como seria o código real:
    
    /*
    import { MercadoPagoConfig, Preference } from "mercadopago";
    
    const mercadoPagoAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN as string;
    const client = new MercadoPagoConfig({ accessToken: mercadoPagoAccessToken });
    const preference = new Preference(client);
    
    const preferenceData = {
      items: [
        {
          id: planId,
          title: `Plano VIP ${planName} - Phanter Ops`,
          description: `Assinatura mensal do plano VIP ${planName}`,
          quantity: 1,
          unit_price: amount,
          currency_id: "BRL",
        },
      ],
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_SITE_URL}/pagamento/sucesso`,
        failure: `${process.env.NEXT_PUBLIC_SITE_URL}/pagamento/falha`,
        pending: `${process.env.NEXT_PUBLIC_SITE_URL}/pagamento/pendente`,
      },
      auto_return: "approved",
      payer: {
        name: payer.name,
        email: payer.email,
      },
      metadata: {
        planId,
        userId: "ID do usuário seria armazenado aqui",
      },
      notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment-webhook`,
    };
    
    const result = await preference.create({ body: preferenceData });
    */

    // Para desenvolvimento, geramos um ID falso
    const preferenceId = `TEST-${Date.now()}-${planId}`;

    // Registramos a preferência no Supabase para fins de histórico
    const { error } = await supabase.from("payment_preferences").insert({
      preference_id: preferenceId,
      plan_id: planId,
      plan_name: planName,
      amount,
      payer_email: payer.email,
      payer_name: payer.name,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Erro ao salvar preferência no Supabase:", error);
      return NextResponse.json(
        { message: "Erro ao processar a solicitação" },
        { status: 500 }
      );
    }

    // Retornar o ID da preferência gerada
    return NextResponse.json({ id: preferenceId });
  } catch (error) {
    console.error("Erro na rota /api/create-preference:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 