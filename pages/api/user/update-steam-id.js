import { getSession } from 'next-auth/react';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    const { steamId } = req.body;
    const discordId = session.user.discord_id;

    // Validar steamId
    if (!steamId || !steamId.match(/^[0-9]{17}$/)) {
      return res.status(400).json({ message: 'Steam ID inválido' });
    }

    // Obter o UUID do usuário
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('discord_id', discordId)
      .single();

    if (userError) {
      console.error('Erro ao buscar usuário:', userError);
      return res.status(500).json({ message: 'Erro ao buscar usuário' });
    }

    // Atualizar o SteamID
    const { error } = await supabaseAdmin
      .from('users')
      .update({ steam_id: steamId })
      .eq('id', userData.id);

    if (error) {
      console.error('Erro ao atualizar SteamID:', error);
      return res.status(500).json({ message: 'Erro ao atualizar SteamID' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro no servidor:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}