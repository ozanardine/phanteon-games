import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { createPaymentPreference } from '../../../lib/mercadopago';
import { supabaseAdmin } from '../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Mapeamento entre IDs de frontend e UUIDs do banco de dados
const planIdMapping = {
  'vip-basic': '0b81cf06-ed81-49ce-8680-8f9d9edc932e',   // VIP Bronze
  'vip-plus': '3994ff53-f110-4c8f-a492-ad988528006f'     // VIP Prata
};

// Função para obter o UUID do plano a partir do ID do frontend
function getPlanUuid(frontendId) {
  return planIdMapping[frontendId] || frontendId;
}

export default async function handler(req, res) {
  // Apenas método POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ success: false, message: 'Não autenticado' });
    }

    const { title, price, quantity, userId, planId, successUrl, failureUrl } = req.body;

    // Validação básica dos campos obrigatórios
    if (!title || !price || !userId || !planId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados incompletos para criar assinatura. Campos obrigatórios: title, price, userId, planId' 
      });
    }

    // Garantir que o Discord ID seja uma string
    const discordIdString = userId.toString();
    
    console.log(`[API:create] Processando assinatura para discord_id: ${discordIdString}, plano: ${planId}`);

    // Converter o ID do plano do frontend para o UUID do banco de dados
    const databasePlanId = getPlanUuid(planId);
    console.log(`[API:create] Plano ID do frontend: ${planId}, UUID do banco: ${databasePlanId}`);

    // Verificar se o usuário existe - usando let para permitir reatribuição
    let { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('discord_id', discordIdString)
      .maybeSingle();

    if (userError) {
      console.error('[API:create] Erro ao buscar usuário:', userError);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao buscar dados do usuário',
        details: userError.message
      });
    }

    if (!userData) {
      console.error('[API:create] Usuário não encontrado para discord_id:', discordIdString);
      
      // Criação simples do usuário caso não exista
      const newUser = {
        id: uuidv4(),
        discord_id: discordIdString,
        name: session.user.name || 'Usuário Phanteon',
        email: session.user.email,
        discord_avatar: session.user.image,
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: createdUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (createError) {
        console.error('[API:create] Erro ao criar usuário:', createError);
        return res.status(500).json({ 
          success: false, 
          message: 'Erro ao criar usuário',
          details: createError.message
        });
      }

      userData = createdUser;
      console.log(`[API:create] Usuário criado com sucesso, ID: ${userData.id}`);
    }

    // Verificar se o SteamID está configurado
    if (!userData.steam_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'É necessário configurar seu Steam ID antes de assinar um plano VIP'
      });
    }

    // Verificar se o plano existe no banco de dados
    const { data: planData, error: planError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('id', databasePlanId)
      .maybeSingle();

    if (planError || !planData) {
      console.error('[API:create] Erro ao verificar plano:', planError || 'Plano não encontrado');
      return res.status(400).json({ 
        success: false, 
        message: 'Plano não encontrado no banco de dados',
        details: planError ? planError.message : 'ID do plano inválido'
      });
    }

    console.log(`[API:create] Plano encontrado: ${planData.name}, preço: ${planData.price}`);

    // Preparar dados para Mercado Pago
    const paymentData = {
      title,
      price: planData.price, // Usar o preço do banco de dados, mais preciso
      quantity: quantity || 1,
      userId: discordIdString,
      planId,
      successUrl,
      failureUrl
    };

    console.log('[API:create] Criando preferência de pagamento no Mercado Pago');
    
    // Criar preferência de pagamento no Mercado Pago
    const preference = await createPaymentPreference(paymentData);

    // Calcular data de expiração (30 dias a partir de agora)
    const expiresAtDate = new Date();
    expiresAtDate.setDate(expiresAtDate.getDate() + (planData.duration_days || 30));
    
    // Criar registro de assinatura pendente no Supabase
    const subscriptionData = {
      user_id: userData.id,
      plan_id: databasePlanId, // UUID do plano
      plan_name: planData.name, // Nome do plano do banco de dados
      status: 'pending',
      payment_status: 'pending',
      price: parseFloat(planData.price),
      payment_preference_id: preference.id,
      steam_id: userData.steam_id,
      discord_role_assigned: false,
      rust_permission_assigned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: expiresAtDate.toISOString(),
      starts_at: new Date().toISOString(),
      is_active: false
    };

    console.log('[API:create] Salvando assinatura pendente no Supabase');
    
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .insert([subscriptionData])
      .select()
      .single();

    if (subscriptionError) {
      console.error('[API:create] Erro ao criar assinatura:', subscriptionError);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao criar assinatura',
        details: subscriptionError.message
      });
    }

    console.log(`[API:create] Assinatura criada com sucesso, ID: ${subscription.id}`);
    
    // Retorna a URL de pagamento do Mercado Pago
    return res.status(200).json({
      success: true,
      subscription_id: subscription.id,
      init_point: preference.init_point,
    });
  } catch (error) {
    console.error('[API:create] Erro no servidor:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      details: error.message 
    });
  }
}