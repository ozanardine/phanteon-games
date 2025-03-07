// pages/api/admin/reprocess-webhook.js
import { processPaymentNotification } from '../../../lib/mercadopago';
import { supabaseAdmin } from '../../../lib/supabase';
import { addVipPermissions } from '../../../lib/rust-server';
import { addVipRole } from '../../../lib/discord';

// Chave de acesso para proteção (configurar no .env ou variáveis do Vercel)
const WEBHOOK_REPROCESS_KEY = process.env.WEBHOOK_REPROCESS_KEY;

export default async function handler(req, res) {
  // Apenas método POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  try {
    // Verificação de segurança simplificada (apenas chave no cabeçalho)
    const apiKey = req.headers['x-reprocess-key'];
    if (!apiKey || apiKey !== WEBHOOK_REPROCESS_KEY) {
      return res.status(401).json({ 
        success: false, 
        message: 'Chave de reprocessamento inválida ou ausente',
        expected_header: 'x-reprocess-key'
      });
    }

    // Extrair dados da requisição
    const { paymentId, topic = 'payment' } = req.body;

    if (!paymentId) {
      return res.status(400).json({ success: false, message: 'ID de pagamento não fornecido' });
    }

    console.log(`[Reprocess] Reprocessando ${topic} ID: ${paymentId}`);

    // Processar manualmente a notificação usando a função existente
    const result = await processPaymentNotification(topic, paymentId);

    if (!result.success) {
      console.warn(`[Reprocess] Notificação não processável: ${result.message}`);
      return res.status(400).json({ success: false, message: result.message });
    }

    const { userId, planId, status, amount } = result.data;

    console.log(`[Reprocess] Pagamento aprovado: ID ${paymentId}, Usuário: ${userId}, Plano: ${planId}`);

    // Busca informações do usuário
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .or(`discord_id.eq.${userId},discord_id.eq."${userId}"`)
      .maybeSingle();

    if (userError) {
      console.error('[Reprocess] Erro ao buscar dados do usuário:', userError);
      return res.status(500).json({ success: false, message: 'Erro ao buscar usuário', error: userError.message });
    }

    if (!userData) {
      console.error('[Reprocess] Usuário não encontrado para discord_id:', userId);
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    // Busca a assinatura pendente ou qualquer assinatura recente
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userData.id)
      .or(`status.eq.pending,payment_preference_id.ilike.%${paymentId}%,payment_id.eq.${paymentId}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Calcular data de expiração (30 dias a partir de agora)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const expiresAtISOString = expiresAt.toISOString();

    if (subError) {
      console.error('[Reprocess] Erro ao buscar assinatura pendente:', subError);
      return res.status(500).json({ success: false, message: 'Erro ao buscar assinatura pendente', error: subError.message });
    }

    let subscriptionId;
    let subscriptionOperation;

    if (!subscription) {
      console.log('[Reprocess] Assinatura pendente não encontrada, criando nova assinatura');
      
      // Obter o nome do plano com base no planId
      let planName = planId.replace('vip-', 'VIP ');
      planName = planName.replace('basic', 'Básico').replace('plus', 'Plus').replace('premium', 'Premium');

      // Buscar o ID do plano no banco de dados se planId for um código interno
      let dbPlanId = planId;
      if (planId === 'vip-basic') {
        dbPlanId = '0b81cf06-ed81-49ce-8680-8f9d9edc932e';
      } else if (planId === 'vip-plus') {
        dbPlanId = '3994ff53-f110-4c8f-a492-ad988528006f';
      } else if (planId === 'vip-premium') {
        dbPlanId = '4de1c7bc-fc88-4af8-8f8c-580e34afd227';
      }

      // Criar uma nova assinatura
      const { data: newSubscription, error: createError } = await supabaseAdmin
        .from('subscriptions')
        .insert([{
          user_id: userData.id,
          plan_id: dbPlanId,
          plan_name: planName,
          status: 'active',
          payment_status: 'approved',
          amount: parseFloat(amount) || 0,
          price: parseFloat(amount) || 0,
          payment_id: paymentId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expires_at: expiresAtISOString,
          starts_at: new Date().toISOString(),
          steam_id: userData.steam_id,
          discord_role_assigned: false,
          rust_permission_assigned: false,
          is_active: true
        }])
        .select()
        .single();

      if (createError) {
        console.error('[Reprocess] Erro ao criar nova assinatura:', createError);
        return res.status(500).json({ success: false, message: 'Erro ao criar assinatura', error: createError.message });
      }

      subscriptionId = newSubscription.id;
      subscriptionOperation = "created";
      console.log(`[Reprocess] Nova assinatura criada, ID: ${subscriptionId}`);
    } else {
      // Atualiza a assinatura existente para ativa
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'active',
          payment_status: 'approved',
          payment_id: paymentId,
          updated_at: new Date().toISOString(),
          expires_at: expiresAtISOString,
          is_active: true
        })
        .eq('id', subscription.id);

      if (updateError) {
        console.error('[Reprocess] Erro ao atualizar assinatura:', updateError);
        return res.status(500).json({ success: false, message: 'Erro ao atualizar assinatura', error: updateError.message });
      }

      subscriptionId = subscription.id;
      subscriptionOperation = "updated";
      console.log(`[Reprocess] Assinatura existente atualizada, ID: ${subscriptionId}`);
    }

    // Objeto para armazenar resultados de integrações
    const integrationResults = {
      rust_permissions: false,
      discord_role: false,
      role_updated: false
    };

    // Adiciona permissões VIP no servidor Rust se o SteamID estiver configurado
    if (userData.steam_id) {
      try {
        console.log(`[Reprocess] Adicionando permissões VIP para SteamID: ${userData.steam_id}`);
        const vipAdded = await addVipPermissions(userData.steam_id);
        
        if (!vipAdded) {
          console.error('[Reprocess] Erro ao adicionar permissões VIP no servidor Rust');
        } else {
          console.log('[Reprocess] Permissões VIP adicionadas com sucesso no servidor Rust');
          
          // Atualiza o status no banco de dados
          await supabaseAdmin
            .from('subscriptions')
            .update({ rust_permission_assigned: true })
            .eq('id', subscriptionId);
            
          integrationResults.rust_permissions = true;
        }
      } catch (serverError) {
        console.error('[Reprocess] Exceção ao adicionar permissões VIP:', serverError);
        // Não falha o webhook se a integração com o servidor falhar
      }
    } else {
      console.warn('[Reprocess] Steam ID não configurado, permissões Rust não atribuídas');
    }

    // Adiciona cargo VIP no Discord se o Discord ID estiver disponível
    if (userData.discord_id) {
      try {
        console.log(`[Reprocess] Adicionando cargo VIP no Discord para ID: ${userData.discord_id}`);
        const roleAdded = await addVipRole(userData.discord_id, planId);
        
        if (!roleAdded) {
          console.error('[Reprocess] Erro ao adicionar cargo VIP no Discord');
        } else {
          console.log('[Reprocess] Cargo VIP adicionado com sucesso no Discord');
          
          // Atualiza o status no banco de dados
          await supabaseAdmin
            .from('subscriptions')
            .update({ 
              discord_role_assigned: true,
              discord_user_notified: true
            })
            .eq('id', subscriptionId);
            
          integrationResults.discord_role = true;
        }
      } catch (discordError) {
        console.error('[Reprocess] Exceção ao adicionar cargo Discord:', discordError);
        // Não falha o webhook se a integração com o Discord falhar
      }
    } else {
      console.warn('[Reprocess] Discord ID não encontrado, cargo não atribuído');
    }

    // Atualiza a role do usuário com base no plano contratado
    let newRole = 'user';
    if (planId.includes('vip-plus') || planId.includes('vip_plus')) {
      newRole = 'vip-plus';
    } else if (planId.includes('vip')) {
      newRole = 'vip';
    }

    // Não rebaixa um admin para vip
    if (userData.role !== 'admin') {
      const { error: roleError } = await supabaseAdmin
        .from('users')
        .update({ role: newRole })
        .eq('id', userData.id);
        
      if (roleError) {
        console.error('[Reprocess] Erro ao atualizar role do usuário:', roleError);
      } else {
        console.log(`[Reprocess] Role do usuário atualizada com sucesso para '${newRole}'`);
        integrationResults.role_updated = true;
      }
    } else {
      console.log('[Reprocess] Usuário é admin, role não modificada');
      integrationResults.role_updated = 'skipped';
    }

    // Retorno de sucesso com detalhes do processamento
    return res.status(200).json({ 
      success: true, 
      message: `Pagamento reprocessado com sucesso`,
      details: {
        payment_id: paymentId,
        topic: topic,
        user: {
          id: userData.id,
          discord_id: userData.discord_id,
          steam_id: userData.steam_id || 'não configurado',
          name: userData.name
        },
        subscription: {
          id: subscriptionId,
          operation: subscriptionOperation,
          plan_id: planId,
          expires_at: expiresAtISOString
        },
        integrations: integrationResults
      }
    });
  } catch (error) {
    // Logar erro detalhado e retornar mensagem
    console.error('[Reprocess] Erro ao processar webhook:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao reprocessar notificação',
      error: error.message
    });
  }
}