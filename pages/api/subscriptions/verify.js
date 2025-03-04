import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  // Aceita apenas método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Verificação de autenticação
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    // Garantir que o Discord ID seja uma string
    const discordIdString = session.user.discord_id.toString();
    
    console.log(`[API:verify] Verificando assinaturas para usuário: ${discordIdString}`);

    // Buscar usuário no Supabase pelo discord_id
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .or(`discord_id.eq.${discordIdString},discord_id.eq.${parseInt(discordIdString, 10)}`)
      .maybeSingle();

    if (userError) {
      console.error('[API:verify] Erro ao buscar usuário:', userError);
      return res.status(500).json({ message: 'Erro ao buscar dados do usuário' });
    }

    if (!userData) {
      console.error('[API:verify] Usuário não encontrado, discord_id:', discordIdString);
      
      // Log para depuração
      const { data: allUsers, error: listError } = await supabaseAdmin
        .from('users')
        .select('id, discord_id')
        .limit(10);
        
      if (!listError && allUsers) {
        console.log('[API:verify] Amostra de usuários disponíveis:', 
          allUsers.map(u => `ID: ${u.id}, Discord: ${u.discord_id} (tipo: ${typeof u.discord_id})`).join(', '));
      }
      
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Buscar assinaturas ativas do usuário
    const { data: subscriptions, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('*, plans:plan_id(name)')
      .eq('user_id', userData.id)
      .eq('status', 'active')
      .order('expires_at', { ascending: false });

    if (subscriptionError) {
      console.error('[API:verify] Erro ao buscar assinaturas:', subscriptionError);
      return res.status(500).json({ message: 'Erro ao verificar assinaturas' });
    }

    // Verifica se há assinaturas ativas
    const hasActiveSubscription = subscriptions && subscriptions.length > 0;
    const currentSubscription = hasActiveSubscription ? subscriptions[0] : null;

    console.log(`[API:verify] Usuário ${discordIdString} tem assinatura ativa: ${hasActiveSubscription}`);
    
    // Atualiza a role do usuário se necessário
    if (hasActiveSubscription && userData.role !== 'admin') {
      // Determinar a nova role com base no plano
      let newRole = 'user';
      const planName = currentSubscription.plans?.name?.toLowerCase() || '';
      
      if (planName.includes('vip-plus')) {
        newRole = 'vip-plus';
      } else if (planName.includes('vip')) {
        newRole = 'vip';
      }
      
      // Atualizar a role do usuário apenas se for diferente da atual
      if (userData.role !== newRole) {
        console.log(`[API:verify] Atualizando role do usuário de '${userData.role}' para '${newRole}'`);
        
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ role: newRole })
          .eq('id', userData.id);
          
        if (updateError) {
          console.error('[API:verify] Erro ao atualizar role do usuário:', updateError);
        } else {
          console.log(`[API:verify] Role do usuário atualizada com sucesso para '${newRole}'`);
          // Atualiza o objeto userData para a resposta
          userData.role = newRole;
        }
      }
    } else if (!hasActiveSubscription && (userData.role === 'vip' || userData.role === 'vip-plus')) {
      // Se não tiver assinatura ativa e a role for VIP, volta para usuário normal
      console.log(`[API:verify] Usuário não tem assinatura ativa, revertendo role de '${userData.role}' para 'user'`);
      
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ role: 'user' })
        .eq('id', userData.id);
        
      if (updateError) {
        console.error('[API:verify] Erro ao reverter role do usuário:', updateError);
      } else {
        console.log(`[API:verify] Role do usuário revertida para 'user'`);
        // Atualiza o objeto userData para a resposta
        userData.role = 'user';
      }
    }

    // Retorna o status da assinatura e dados da assinatura ativa (se houver)
    return res.status(200).json({
      active: hasActiveSubscription,
      subscription: currentSubscription,
      subscriptions: subscriptions || [],
      user: {
        id: userData.id,
        role: userData.role
      }
    });
  } catch (error) {
    console.error('[API:verify] Erro no servidor:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}