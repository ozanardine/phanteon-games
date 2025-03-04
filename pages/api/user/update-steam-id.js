import { unstable_getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  // Verifica método
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  try {
    // Obtém a sessão do servidor (mais confiável que getSession para APIs)
    const session = await unstable_getServerSession(req, res, authOptions);
    
    if (!session) {
      console.error('API: Sessão não encontrada');
      return res.status(401).json({ success: false, message: 'Não autenticado' });
    }

    if (!session.user?.discord_id) {
      console.error('API: Sessão sem discord_id');
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

    console.log(`API: Atualizando Steam ID para discord_id: ${discordId}`);

    // Busca usuário pelo discord_id
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('discord_id', discordId)
      .maybeSingle();

    if (userError) {
      console.error('API: Erro ao buscar usuário:', userError);
      return res.status(500).json({ success: false, message: 'Erro ao buscar usuário' });
    }

    if (!userData) {
      console.error('API: Usuário não encontrado com discord_id:', discordId);
      
      // Tentativa de recuperação - criar o usuário se não existir
      try {
        const { data: insertedUser, error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            discord_id: discordId,
            name: session.user.name,
            email: session.user.email,
            steam_id: steamId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (insertError) {
          console.error('API: Erro ao criar usuário:', insertError);
          return res.status(500).json({ success: false, message: 'Erro ao criar usuário' });
        }
        
        console.log('API: Usuário criado com sucesso:', insertedUser.id);
        return res.status(200).json({ success: true });
      } catch (createError) {
        console.error('API: Exceção ao criar usuário:', createError);
        return res.status(500).json({ success: false, message: 'Erro ao processar solicitação' });
      }
    }

    // Atualiza o Steam ID para o usuário encontrado
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        steam_id: steamId,
        updated_at: new Date().toISOString()
      })
      .eq('id', userData.id);

    if (updateError) {
      console.error('API: Erro ao atualizar Steam ID:', updateError);
      return res.status(500).json({ success: false, message: 'Erro ao atualizar Steam ID' });
    }

    console.log('API: Steam ID atualizado com sucesso para:', userData.id);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('API: Erro não tratado:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
}