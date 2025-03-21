// pages/api/rewards/pending.js - API para verificar recompensas pendentes
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { supabaseAdmin } from '../../../lib/supabase';
import { getUserByDiscordId } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ success: false, message: 'Não autenticado' });
    }

    // Garantir que o Discord ID seja uma string
    const discordIdString = session.user.discord_id.toString();

    // Buscar o usuário pelo Discord ID
    const userData = await getUserByDiscordId(discordIdString);
    
    if (!userData) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }

    // Verificar se o usuário tem um Steam ID configurado
    if (!userData.steam_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Steam ID não configurado. Configure seu Steam ID para acessar recompensas diárias.' 
      });
    }

    // Buscar recompensas pendentes
    const { data: pendingRewards, error } = await supabaseAdmin
      .from('pending_rewards')
      .select('*')
      .eq('steam_id', userData.steam_id)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      pendingRewards: pendingRewards || []
    });
  } catch (error) {
    console.error('[API:pending-rewards] Erro:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar recompensas pendentes',
      details: error.message 
    });
  }
}