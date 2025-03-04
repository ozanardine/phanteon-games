import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { createPaymentPreference } from '../../../lib/mercadopago';
import { supabase } from '../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  // Apenas método POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    const { title, price, quantity, userId, planId, successUrl, failureUrl } = req.body;

    // Validação básica
    if (!title || !price || !userId || !planId) {
      return res.status(400).json({ message: 'Dados incompletos para criar assinatura' });
    }

    // Garantir que o Discord ID seja uma string
    const discordIdString = userId.toString();
    
    console.log(`[API:create] Processando assinatura para discord_id: ${discordIdString}, plano: ${planId}`);

    // Verificar se o usuário existe
    // Fazemos uma consulta OR para aceitar discord_id tanto como string quanto como número
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .or(`discord_id.eq.${discordIdString},discord_id.eq.${parseInt(discordIdString, 10)}`)
      .maybeSingle();

    if (userError) {
      console.error('[API:create] Erro ao buscar usuário:', userError);
      return res.status(500).json({ message: 'Erro ao buscar dados do usuário' });
    }

    if (!userData) {
      console.error('[API:create] Usuário não encontrado para discord_id:', discordIdString);
      
      // Log para depuração
      const { data: allUsers, error: listError } = await supabase
        .from('users')
        .select('id, discord_id')
        .limit(10);
        
      if (!listError && allUsers) {
        console.log('[API:create] Amostra de usuários disponíveis:', 
          allUsers.map(u => `ID: ${u.id}, Discord: ${u.discord_id} (tipo: ${typeof u.discord_id})`).join(', '));
      }
      
      // Tentativa de criar o usuário caso não exista
      try {
        if (session && session.user) {
          console.log('[API:create] Tentando criar usuário para discord_id:', discordIdString);
          
          const newUser = {
            id: uuidv4(),
            discord_id: discordIdString,
            name: session.user.name || 'Usuário Phanteon',
            email: session.user.email || null,
            discord_avatar: session.user.image || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            role: 'user'
          };
          
          const { data: createdUser, error: createError } = await supabase
            .from('users')
            .insert([newUser])
            .select()
            .single();
            
          if (createError) {
            console.error('[API:create] Erro ao criar usuário:', createError);
          } else if (createdUser) {
            console.log('[API:create] Usuário criado com sucesso:', createdUser.id);
            userData = createdUser;
          }
        }
      } catch (createErr) {
        console.error('[API:create] Exceção ao criar usuário:', createErr);
      }
      
      // Se mesmo assim não tiver o usuário, retorna erro
      if (!userData) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
    }

    // Verificar se o SteamID está configurado
    if (!userData.steam_id) {
      return res.status(400).json({ message: 'Steam ID não configurado' });
    }

    // Preparar dados para Mercado Pago
    const paymentData = {
      title,
      price,
      quantity,
      userId: discordIdString,
      planId,
      successUrl,
      failureUrl
    };

    console.log('[API:create] Criando preferência de pagamento no Mercado Pago');
    
    // Criar preferência de pagamento no Mercado Pago
    const preference = await createPaymentPreference(paymentData);

    // Criar registro de assinatura pendente no Supabase
    const subscriptionData = {
      user_id: userData.id,
      plan_id: planId,
      plan_name: title.replace(' - Phanteon Games', ''),
      status: 'pending',
      amount: price,
      payment_id: null,
      created_at: new Date().toISOString(),
      expires_at: null, // Será definido quando o pagamento for confirmado
      steam_id: userData.steam_id,
      payment_preference_id: preference.id
    };

    console.log('[API:create] Salvando assinatura pendente no Supabase');
    
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert([subscriptionData])
      .select()
      .single();

    if (subscriptionError) {
      console.error('[API:create] Erro ao criar assinatura:', subscriptionError);
      return res.status(500).json({ message: 'Erro ao criar assinatura' });
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
      message: 'Erro interno do servidor',
      details: error.message 
    });
  }
}