import { getSession } from 'next-auth/react';
import { getUserByDiscordId, supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const session = await getSession({ req });
    
    if (!session) {
      console.error('[API] Sessão não encontrada');
      return res.status(401).json({ message: 'Não autenticado' });
    }

    if (!session.user?.discord_id) {
      console.error('[API] Sessão sem discord_id');
      return res.status(400).json({ message: 'ID de usuário inválido' });
    }

    console.log('[API] Sessão encontrada, discord_id:', session.user.discord_id);

    const { steamId } = req.body;
    const discordId = session.user.discord_id.toString();

    // Validar steamId
    if (!steamId || !steamId.match(/^[0-9]{17}$/)) {
      return res.status(400).json({ message: 'Steam ID inválido' });
    }

    // Buscar usuário diretamente por discord_id
    const userData = await getUserByDiscordId(discordId);

    if (!userData) {
      console.error('[API] Usuário não encontrado com discord_id:', discordId);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    console.log('[API] Usuário encontrado, id:', userData.id);

    // Atualizar o SteamID
    const { error } = await supabaseAdmin
      .from('users')
      .update({ steam_id: steamId })
      .eq('id', userData.id);

    if (error) {
      console.error('[API] Erro ao atualizar SteamID:', error);
      return res.status(500).json({ message: 'Erro ao atualizar SteamID' });
    }

    console.log('[API] SteamID atualizado com sucesso para o usuário:', userData.id);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[API] Erro no servidor:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}