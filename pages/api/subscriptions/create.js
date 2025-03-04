import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { createPaymentPreference } from '../../../lib/mercadopago';
import { supabaseAdmin } from '../../../lib/supabase';
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
    let { data: userData, error: userError } = await supabaseAdmin
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
      const { data: allUsers, error: listError } = await supabaseAdmin
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
          
          // Buscar estrutura correta da tabela users dinamicamente
          const { data: tableInfo, error: tableError } = await supabaseAdmin
            .from('users')
            .select('*')
            .limit(1);
            
          let columnsAvailable = [];
          
          if (!tableError && tableInfo && tableInfo.length > 0) {
            columnsAvailable = Object.keys(tableInfo[0]);
            console.log('[API:create] Colunas disponíveis na tabela users:', columnsAvailable.join(', '));
          } else {
            console.log('[API:create] Não foi possível obter colunas da tabela users, usando conjunto mínimo');
            // Conjunto mínimo esperado
            columnsAvailable = ['id', 'discord_id', 'name', 'email', 'discord_avatar', 'created_at', 'updated_at'];
          }
          
          // Criar dado do usuário apenas com colunas que existem na tabela
          const newUser = {
            id: uuidv4(),
            discord_id: discordIdString
          };
          
          // Adicionar campos opcionais apenas se existirem na tabela
          if (columnsAvailable.includes('name')) newUser.name = session.user.name || 'Usuário Phanteon';
          if (columnsAvailable.includes('email')) newUser.email = session.user.email || null;
          if (columnsAvailable.includes('discord_avatar')) newUser.discord_avatar = session.user.image || null;
          if (columnsAvailable.includes('role')) newUser.role = 'user'; 
          if (columnsAvailable.includes('created_at')) newUser.created_at = new Date().toISOString();
          if (columnsAvailable.includes('updated_at')) newUser.updated_at = new Date().toISOString();
          
          console.log('[API:create] Criando novo usuário com campos:', Object.keys(newUser).join(', '));
          
          const { data: createdUser, error: createError } = await supabaseAdmin
            .from('users')
            .insert(newUser)
            .select()
            .single();
            
          if (createError) {
            console.error('[API:create] Erro ao criar usuário:', createError);
            console.error('[API:create] Objeto do usuário tentado:', JSON.stringify(newUser, null, 2));
            
            return res.status(500).json({ 
              success: false, 
              message: `Erro ao criar usuário: ${createError.message}`,
              details: createError 
            });
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

    // Verificar as colunas disponíveis na tabela subscriptions
    const { data: subscriptionColumns, error: columnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'subscriptions');
      
    if (columnsError) {
      console.error('[API:create] Erro ao verificar colunas da tabela subscriptions:', columnsError);
      return res.status(500).json({ message: 'Erro ao verificar estrutura do banco de dados' });
    }
    
    // Converter lista de objetos em array de nomes de colunas
    const availableColumns = subscriptionColumns.map(col => col.column_name);
    console.log('[API:create] Colunas disponíveis na tabela subscriptions:', availableColumns.join(', '));

    // Criar registro de assinatura pendente no Supabase
    const subscriptionData = {
      user_id: userData.id,
      plan_id: planId,
      status: 'pending',
      payment_id: null,
      created_at: new Date().toISOString(),
      steam_id: userData.steam_id,
      payment_preference_id: preference.id
    };
    
    // Adicionar campos opcionais apenas se existirem na tabela
    if (availableColumns.includes('plan_name')) {
      subscriptionData.plan_name = title.replace(' - Phanteon Games', '');
    }
    
    if (availableColumns.includes('amount')) {
      subscriptionData.amount = price;
    }
    
    if (availableColumns.includes('price')) {
      subscriptionData.price = price;
    }
    
    if (availableColumns.includes('expires_at')) {
      subscriptionData.expires_at = null; // Será definido quando o pagamento for confirmado
    }
    
    console.log('[API:create] Salvando assinatura pendente com campos:', Object.keys(subscriptionData).join(', '));

    console.log('[API:create] Salvando assinatura pendente no Supabase');
    
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .insert([subscriptionData])
      .select()
      .single();

    if (subscriptionError) {
      console.error('[API:create] Erro ao criar assinatura:', subscriptionError);
      return res.status(500).json({ message: 'Erro ao criar assinatura' });
    }

    console.log(`[API:create] Assinatura criada com sucesso, ID: ${subscription.id}`);
    
    // Atualizar a role do usuário com base no plano contratado
    if (title.toLowerCase().includes('vip-plus') || title.toLowerCase().includes('vip plus')) {
      console.log(`[API:create] Atualizando role do usuário para 'vip-plus'`);
      
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ role: 'vip-plus' })
        .eq('id', userData.id);
        
      if (updateError) {
        console.error('[API:create] Erro ao atualizar role do usuário:', updateError);
      } else {
        console.log(`[API:create] Role do usuário atualizada com sucesso para 'vip-plus'`);
      }
    } else if (title.toLowerCase().includes('vip')) {
      console.log(`[API:create] Atualizando role do usuário para 'vip'`);
      
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ role: 'vip' })
        .eq('id', userData.id);
        
      if (updateError) {
        console.error('[API:create] Erro ao atualizar role do usuário:', updateError);
      } else {
        console.log(`[API:create] Role do usuário atualizada com sucesso para 'vip'`);
      }
    }
    
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