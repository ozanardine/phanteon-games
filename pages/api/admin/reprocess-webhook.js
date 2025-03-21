// pages/api/admin/reprocess-webhook.js
import { processPaymentNotification } from '../../../lib/mercadopago';
import { supabaseAdmin } from '../../../lib/supabase';
import { addVipPermissions } from '../../../lib/rust-server';
import { addVipRole } from '../../../lib/discord';

// Chave de acesso para proteção
const WEBHOOK_REPROCESS_KEY = process.env.WEBHOOK_REPROCESS_KEY;

export default async function handler(req, res) {
    // Apenas método POST é permitido
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Método não permitido' });
    }
  
    try {
      // Verificação de segurança simplificada
      const apiKey = req.headers['x-reprocess-key'];
      if (!apiKey || apiKey !== WEBHOOK_REPROCESS_KEY) {
        return res.status(401).json({ 
          success: false, 
          message: 'Chave de reprocessamento inválida ou ausente',
          expected_header: 'x-reprocess-key'
        });
      }
  
      // Extrair dados da requisição
      const { 
        paymentId, 
        topic = 'payment',
        userId: manualUserId,        // Permitir forçar um userId específico
        planId: manualPlanId,        // Permitir forçar um planId específico
        allowDuplicates = false      // Controlar se permite duplicatas
      } = req.body;
  
      if (!paymentId) {
        return res.status(400).json({ success: false, message: 'ID de pagamento não fornecido' });
      }
  
      console.log(`[Reprocess] Reprocessando ${topic} ID: ${paymentId}`);
  
      // Verifica primeiro se já existe uma assinatura com este ID de pagamento
      if (!allowDuplicates) {
        const { data: existingPayment, error: searchError } = await supabaseAdmin
          .from('subscriptions')
          .select('id, payment_id, status, expires_at, user_id, plan_id, plan_name')
          .eq('payment_id', paymentId)
          .maybeSingle();
  
        if (!searchError && existingPayment) {
          console.log(`[Reprocess] Pagamento já processado anteriormente, ID assinatura: ${existingPayment.id}`);
          
          // Se encontrou, atualiza expiração e status se necessário
          let needsUpdate = false;
          let updateData = {};
          
          // Verificar se está expirado e deve ser renovado
          const now = new Date();
          const expiresAt = new Date(existingPayment.expires_at);
          
          if (expiresAt < now || existingPayment.status !== 'active') {
            // Se expirado ou não ativo, atualiza
            const newExpiresAt = new Date();
            newExpiresAt.setDate(now.getDate() + 30);
            
            updateData = {
              status: 'active',
              payment_status: 'approved',
              updated_at: now.toISOString(),
              expires_at: newExpiresAt.toISOString(),
              is_active: true
            };
            
            needsUpdate = true;
          }
          
          if (needsUpdate) {
            const { error: updateError } = await supabaseAdmin
              .from('subscriptions')
              .update(updateData)
              .eq('id', existingPayment.id);
              
            if (updateError) {
              console.error('[Reprocess] Erro ao atualizar assinatura existente:', updateError);
              return res.status(500).json({ 
                success: false, 
                message: 'Erro ao atualizar assinatura existente',
                error: updateError.message
              });
            }
            
            console.log(`[Reprocess] Assinatura existente atualizada: ${existingPayment.id}`);
          }
          
          // Continuar com a ativação de benefícios para o usuário existente
          const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', existingPayment.user_id)
            .single();
            
          if (userError || !userData) {
            return res.status(404).json({ 
              success: false, 
              message: 'Usuário da assinatura existente não encontrado',
              subscription_id: existingPayment.id
            });
          }
  
          // Determinar qual planId usar para as ativações
          let planIdToUse = manualPlanId;
          
          // Se não temos um planId manual, tente derivar do banco
          if (!planIdToUse) {
            // Mapear o UUID do plano para o código front-end
            if (existingPayment.plan_id === '3994ff53-f110-4c8f-a492-ad988528006f') {
              planIdToUse = 'vip-plus';
            } else if (existingPayment.plan_id === '0b81cf06-ed81-49ce-8680-8f9d9edc932e') {
              planIdToUse = 'vip-basic';
            } else {
              // Fallback baseado no nome do plano
              if (existingPayment.plan_name && existingPayment.plan_name.toLowerCase().includes('plus')) {
                planIdToUse = 'vip-plus';
              } else {
                planIdToUse = 'vip-basic'; // Valor padrão
              }
            }
          }
  
          // Objeto para resultados de integrações
          const integrationResults = {
            rust_permissions: false,
            discord_role: false,
            role_updated: false
          };
  
          // Adicionar permissões VIP no Rust
          if (userData.steam_id) {
            try {
              console.log(`[Reprocess] Adicionando permissões VIP para SteamID: ${userData.steam_id}`);
              const vipAdded = await addVipPermissions(userData.steam_id);
              
              if (vipAdded) {
                await supabaseAdmin
                  .from('subscriptions')
                  .update({ rust_permission_assigned: true })
                  .eq('id', existingPayment.id);
                  
                integrationResults.rust_permissions = true;
              }
            } catch (error) {
              console.error('[Reprocess] Erro ao adicionar permissões Rust:', error);
            }
          }
  
          // Adicionar cargo VIP no Discord
          if (userData.discord_id) {
            try {
              console.log(`[Reprocess] Adicionando cargo VIP no Discord para ID: ${userData.discord_id}`);
              const roleAdded = await addVipRole(userData.discord_id, planIdToUse);
              
              if (roleAdded) {
                await supabaseAdmin
                  .from('subscriptions')
                  .update({ 
                    discord_role_assigned: true,
                    discord_user_notified: true
                  })
                  .eq('id', existingPayment.id);
                  
                integrationResults.discord_role = true;
              }
            } catch (error) {
              console.error('[Reprocess] Erro ao adicionar cargo Discord:', error);
            }
          }
  
          // Atualizar role do usuário
          let newRole = 'user';
          if (planIdToUse.includes('vip-plus') || planIdToUse.includes('vip_plus')) {
            newRole = 'vip-plus';
          } else if (planIdToUse.includes('vip')) {
            newRole = 'vip';
          }
  
          // Não rebaixar admin
          if (userData.role !== 'admin') {
            const { error: roleError } = await supabaseAdmin
              .from('users')
              .update({ role: newRole })
              .eq('id', userData.id);
              
            integrationResults.role_updated = !roleError;
          } else {
            integrationResults.role_updated = 'skipped';
          }
  
          return res.status(200).json({
            success: true,
            message: 'Assinatura existente encontrada e processada',
            details: {
              payment_id: paymentId,
              subscription_id: existingPayment.id,
              updated: needsUpdate,
              user: {
                id: userData.id,
                discord_id: userData.discord_id,
                steam_id: userData.steam_id || 'não configurado',
                name: userData.name
              },
              plan: {
                id: planIdToUse,
                name: existingPayment.plan_name
              },
              integrations: integrationResults
            }
          });
        }
      }
  
      // Se chegou aqui, não encontrou assinatura existente ou permitiu duplicatas
      // Processar manualmente a notificação
      let result;
      try {
        result = await processPaymentNotification(topic, paymentId);
      } catch (processError) {
        console.error('[Reprocess] Erro ao processar notificação:', processError);
        
        // Se não temos dados manuais, não podemos continuar
        if (!manualUserId || !manualPlanId) {
          return res.status(400).json({
            success: false,
            message: 'Falha ao processar notificação e não foram fornecidos dados manuais',
            error: processError.message,
            solution: 'Forneça manualmente userId e planId para prosseguir'
          });
        }
        
        // Continuar com dados manuais
        console.log(`[Reprocess] Usando dados manuais após falha: userId=${manualUserId}, planId=${manualPlanId}`);
        result = { success: false, data: null };
      }
      
      // Verificar resultado do processamento
      if (!result || !result.success || !result.data) {
        // Se falhar e não temos dados manuais, não podemos continuar
        if (!manualUserId || !manualPlanId) {
          return res.status(400).json({
            success: false,
            message: 'Falha ao obter dados do pagamento',
            details: result ? result.message : 'Dados de retorno inválidos',
            solution: 'Forneça manualmente userId e planId para prosseguir'
          });
        }
        
        // Continuar com dados manuais
        console.log(`[Reprocess] Usando dados manuais: userId=${manualUserId}, planId=${manualPlanId}`);
      }
  
      // Extrair dados ou usar manuais
      const userId = result && result.data && result.data.userId ? result.data.userId : manualUserId;
      const planId = result && result.data && result.data.planId ? result.data.planId : manualPlanId;
      const amount = result && result.data && result.data.amount ? result.data.amount : 0;
  
      if (!userId || !planId) {
        return res.status(400).json({
          success: false,
          message: 'Dados insuficientes para processamento',
          details: 'Não foi possível obter userId e planId da notificação',
          solution: 'Forneça manualmente userId e planId para prosseguir'
        });
      }
  
      console.log(`[Reprocess] Processando pagamento para: Usuário ${userId}, Plano ${planId}`);
  
      // Buscar dados do usuário
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
        return res.status(404).json({ success: false, message: 'Usuário não encontrado', discord_id: userId });
      }
  
      // Calcular data de expiração (30 dias a partir de agora)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      const expiresAtISOString = expiresAt.toISOString();
  
      // Obter nome do plano com base no planId
      let planName = planId.replace('vip-', 'VIP ');
      planName = planName.replace('basic', 'Básico').replace('plus', 'Plus');
  
      // Buscar o ID do plano no banco
      let dbPlanId = planId;
      if (planId === 'vip-basic') {
        dbPlanId = '0b81cf06-ed81-49ce-8680-8f9d9edc932e';
      } else if (planId === 'vip-plus') {
        dbPlanId = '3994ff53-f110-4c8f-a492-ad988528006f';
      }
  
      // Criar nova assinatura
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
  
      const subscriptionId = newSubscription.id;
      console.log(`[Reprocess] Nova assinatura criada, ID: ${subscriptionId}`);
  
      // Objeto para resultados de integrações
      const integrationResults = {
        rust_permissions: false,
        discord_role: false,
        role_updated: false
      };
  
      // Adicionar permissões VIP no Rust
      if (userData.steam_id) {
        try {
          console.log(`[Reprocess] Adicionando permissões VIP para SteamID: ${userData.steam_id}`);
          const vipAdded = await addVipPermissions(userData.steam_id);
          
          if (vipAdded) {
            await supabaseAdmin
              .from('subscriptions')
              .update({ rust_permission_assigned: true })
              .eq('id', subscriptionId);
              
            integrationResults.rust_permissions = true;
          }
        } catch (rustError) {
          console.error('[Reprocess] Erro ao adicionar permissões Rust:', rustError);
        }
      } else {
        console.warn('[Reprocess] Steam ID não configurado, permissões Rust não atribuídas');
      }
  
      // Adicionar cargo VIP no Discord
      if (userData.discord_id) {
        try {
          console.log(`[Reprocess] Adicionando cargo VIP no Discord para ID: ${userData.discord_id}`);
          const roleAdded = await addVipRole(userData.discord_id, planId);
          
          if (roleAdded) {
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
          console.error('[Reprocess] Erro ao adicionar cargo Discord:', discordError);
        }
      } else {
        console.warn('[Reprocess] Discord ID não encontrado, cargo não atribuído');
      }
  
      // Atualizar role do usuário
      let newRole = 'user';
      if (planId.includes('vip-plus') || planId.includes('vip_plus')) {
        newRole = 'vip-plus';
      } else if (planId.includes('vip')) {
        newRole = 'vip';
      }
  
      // Não rebaixar admin
      if (userData.role !== 'admin') {
        const { error: roleError } = await supabaseAdmin
          .from('users')
          .update({ role: newRole })
          .eq('id', userData.id);
          
        if (roleError) {
          console.error('[Reprocess] Erro ao atualizar role do usuário:', roleError);
        } else {
          console.log(`[Reprocess] Role do usuário atualizada para '${newRole}'`);
          integrationResults.role_updated = true;
        }
      } else {
        console.log('[Reprocess] Usuário é admin, role não modificada');
        integrationResults.role_updated = 'skipped';
      }
  
      // Retorno de sucesso
      return res.status(200).json({ 
        success: true, 
        message: 'Pagamento processado com sucesso',
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
            operation: "created",
            plan_id: planId,
            plan_name: planName,
            expires_at: expiresAtISOString
          },
          integrations: integrationResults
        }
      });
    } catch (error) {
      console.error('[Reprocess] Erro não tratado:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao reprocessar notificação',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }