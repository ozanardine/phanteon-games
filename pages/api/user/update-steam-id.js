import { getServerSession } from "next-auth/react";
import { authOptions } from "../auth/[...nextauth]";
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  // Verifica método
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  try {
    // Obtém a sessão do servidor
    const session = await getServerSession({ req, res, authOptions });
    
    if (!session) {
      console.error('[API:steamID] Sessão não encontrada');
      return res.status(401).json({ success: false, message: 'Não autenticado' });
    }

    if (!session.user?.discord_id) {
      console.error('[API:steamID] Sessão sem discord_id');
      return res.status(400).json({ success: false, message: 'ID de usuário inválido' });
    }

    const { steamId } = req.body;
    const discordId = session.user.discord_id.toString();

    // Validação de Steam ID
    if (!steamId || !steamId.match(/^[0-9]{17}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Steam ID inválido. Deve conter 17 dígitos numéricos.' 
      });
    }

    console.log(`[API:steamID] Atualizando Steam ID para discord_id: ${discordId}`);

    // Busca usuário pelo discord_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('discord_id', discordId)
      .maybeSingle();

    if (userError) {
      console.error('[API:steamID] Erro ao buscar usuário:', userError);
      return res.status(500).json({ success: false, message: 'Erro ao buscar usuário' });
    }

    if (!userData) {
      console.error('[API:steamID] Usuário não encontrado com discord_id:', discordId);
      
      // Vamos tentar criar o usuário se não existir
      console.log('[API:steamID] Tentando criar novo usuário');
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          discord_id: discordId,
          name: session.user.name,
          email: session.user.email,
          discord_avatar: session.user.image,
          steam_id: steamId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
          
      if (createError) {
        console.error('[API:steamID] Erro ao criar usuário:', createError);
        return res.status(500).json({ success: false, message: 'Erro ao criar usuário' });
      }
        
      console.log('[API:steamID] Usuário criado com Steam ID:', newUser.id);
      return res.status(200).json({ success: true });
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
      console.error('[API:steamID] Erro ao atualizar Steam ID:', updateError);
      return res.status(500).json({ success: false, message: 'Erro ao atualizar Steam ID' });
    }

    console.log('[API:steamID] Steam ID atualizado com sucesso para:', userData.id);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[API:steamID] Erro não tratado:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      details: error.message
    });
  }
}