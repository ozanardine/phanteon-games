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
    cardDetails?: {
      lastFourDigits: string;
    };
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

    // Simulação de processamento de pagamento
    // Em um ambiente de produção, aqui seria integrado com um gateway de pagamento real
    
    // Gerar um ID de transação simulado
    const transactionId = `TRANS-${Date.now()}-${planId}`;

    // Registrar a transação no Supabase
    const { error } = await supabase.from("subscriptions").insert({
      transaction_id: transactionId,
      plan_id: planId,
      plan_name: planName,
      amount,
      user_email: payer.email,
      user_name: payer.name,
      status: "active",
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias a partir de hoje
    });

    if (error) {
      console.error("Erro ao salvar assinatura no Supabase:", error);
      return NextResponse.json(
        { message: "Erro ao processar a solicitação" },
        { status: 500 }
      );
    }

    // Retornar confirmação de sucesso
    return NextResponse.json({ 
      success: true,
      transactionId,
      message: "Pagamento processado com sucesso"
    });
  } catch (error) {
    console.error("Erro na rota /api/create-preference:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 