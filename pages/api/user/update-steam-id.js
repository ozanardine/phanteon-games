import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  // Verifica método
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    // Garantir que o Discord ID seja uma string
    const discordIdString = session.user.discord_id.toString();

    const { steamId } = req.body;

    // Validação de Steam ID
    if (!steamId || !steamId.match(/^[0-9]{17}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Steam ID inválido. Deve conter 17 dígitos numéricos.' 
      });
    }

    console.log(`[API:update-steam-id] Atualizando Steam ID para usuário: ${discordIdString}`);

    // Buscar o usuário no Supabase pelo discord_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('discord_id', discordIdString)
      .maybeSingle();

    if (userError) {
      console.error('[API:update-steam-id] Erro ao buscar usuário:', userError);
      return res.status(500).json({ message: 'Erro ao buscar dados do usuário' });
    }

    if (!userData) {
      console.error('[API:update-steam-id] Usuário não encontrado, discord_id:', discordIdString);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Atualiza o Steam ID para o usuário encontrado
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        steam_id: steamId,
        updated_at: new Date().toISOString()
      })
      .eq('id', userData.id);

    if (updateError) {
      console.error('[API:update-steam-id] Erro ao atualizar Steam ID:', updateError);
      return res.status(500).json({ success: false, message: 'Erro ao atualizar Steam ID' });
    }

    console.log('[API:update-steam-id] Steam ID atualizado com sucesso para:', userData.id);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[API:update-steam-id] Erro não tratado:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      details: error.message
    });
  }
}