import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { User, Server, VipPlan } from '@/types/database.types';

// Funções para uso no lado do servidor (API routes, getServerSideProps, etc)

export async function getUserById(userId: string): Promise<User | null> {
  // Validar o userId
  if (!userId || userId === 'undefined' || userId === 'null') {
    console.error('ID de usuário inválido recebido:', userId);
    return null;
  }
  
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  
  return data;
}

export async function getServers(): Promise<Server[]> {
  const { data, error } = await supabaseAdmin
    .from('servers')
    .select('*')
    .order('name');
    
  if (error) {
    console.error('Error fetching servers:', error);
    return [];
  }
  
  return data || [];
}

export async function getVipPlans(): Promise<VipPlan[]> {
  const { data, error } = await supabaseAdmin
    .from('vip_plans')
    .select('*')
    .eq('is_active', true)
    .order('price');
    
  if (error) {
    console.error('Error fetching VIP plans:', error);
    return [];
  }
  
  return data || [];
}

export async function updateUserVipStatus(userId: string, planId: string): Promise<boolean> {
  // Validar os parâmetros
  if (!userId || userId === 'undefined' || userId === 'null') {
    console.error('ID de usuário inválido:', userId);
    return false;
  }
  
  if (!planId || planId === 'undefined' || planId === 'null') {
    console.error('ID de plano inválido:', planId);
    return false;
  }
  
  try {
    // Obter detalhes do plano VIP
    const { data: planData, error: planError } = await supabaseAdmin
      .from('vip_plans')
      .select('*')
      .eq('id', planId)
      .single();
      
    if (planError) throw planError;
    
    // Calcular nova data de expiração
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + planData.duration_days);
    
    // Atualizar status VIP do usuário
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        is_vip: true,
        vip_expires_at: expirationDate.toISOString(),
      })
      .eq('id', userId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating VIP status:', error);
    return false;
  }
}