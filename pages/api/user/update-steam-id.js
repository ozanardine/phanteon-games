import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  // Verifica método
  if (req.method !== 'POST') {
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
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('discord_id', discordIdString)
      .maybeSingle();

    if (userError) {
      console.error('[API:update-steam-id] Erro ao buscar usuário:', userError);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao buscar dados do usuário',
        details: userError.message
      });
    }

    if (!userData) {
      console.log(`[API:update-steam-id] Usuário não encontrado para discord_id: ${discordIdString}`);
      
      // Verificar se o usuário existe na tabela auth.users (auth system)
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      let authUserId = null;
      
      if (authUsers && authUsers.users) {
        // Procurar usuário pelo metadata do discord_id
        const existingAuthUser = authUsers.users.find(u => 
          u.user_metadata && u.user_metadata.discord_id === discordIdString
        );
        
        if (existingAuthUser) {
          authUserId = existingAuthUser.id;
          console.log(`[API:update-steam-id] Usuário encontrado no auth system, ID: ${authUserId}`);
        }
      }
      
      if (!authUserId) {
        console.error('[API:update-steam-id] Usuário não encontrado no auth system. Não é possível criar usuário.');
        return res.status(400).json({ 
          success: false, 
          message: 'Usuário não encontrado. Por favor, faça login novamente antes de configurar o Steam ID.',
        });
      }
      
      // Criar o usuário na tabela public.users com o ID do auth.users
      const newUser = {
        id: authUserId, // Usar o ID existente do auth.users
        discord_id: discordIdString,
        name: session.user.name || 'Usuário Phanteon',
        email: session.user.email,
        discord_avatar: session.user.image,
        steam_id: steamId,
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: createdUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (createError) {
        console.error('[API:update-steam-id] Erro ao criar usuário:', createError);
        return res.status(500).json({ 
          success: false, 
          message: 'Erro ao criar usuário',
          details: createError.message
        });
      }
      
      console.log(`[API:update-steam-id] Usuário criado com sucesso: ${createdUser.id}`);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Usuário criado e Steam ID configurado com sucesso'
      });
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
      console.error('[API:update-steam-id] Erro ao atualizar Steam ID:', updateError);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao atualizar Steam ID',
        details: updateError.message
      });
    }

    console.log('[API:update-steam-id] Steam ID atualizado com sucesso para:', userData.id);
    return res.status(200).json({ 
      success: true,
      message: 'Steam ID atualizado com sucesso' 
    });
  } catch (error) {
    console.error('[API:update-steam-id] Erro não tratado:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      details: error.message
    });
  }
}