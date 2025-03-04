import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { supabaseAdmin } from '../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

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
    let { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .or(`discord_id.eq.${discordIdString},discord_id.eq.${parseInt(discordIdString, 10)}`)
      .maybeSingle();

    if (userError) {
      console.error('[API:update-steam-id] Erro ao buscar usuário:', userError);
      return res.status(500).json({ message: 'Erro ao buscar dados do usuário' });
    }

    if (!userData) {
      console.error('[API:update-steam-id] Usuário não encontrado, discord_id:', discordIdString);
      
      // Log para depuração
      const { data: allUsers, error: listError } = await supabaseAdmin
        .from('users')
        .select('id, discord_id')
        .limit(10);
        
      if (!listError && allUsers) {
        console.log('[API:update-steam-id] Amostra de usuários disponíveis:', 
          allUsers.map(u => `ID: ${u.id}, Discord: ${u.discord_id} (tipo: ${typeof u.discord_id})`).join(', '));
      }
      
      // Tentativa de criar o usuário
      console.log(`[API:update-steam-id] Tentando criar usuário para discord_id: ${discordIdString}`);
      
      // Buscar estrutura correta da tabela users dinamicamente
      const { data: tableInfo, error: tableError } = await supabaseAdmin
        .from('users')
        .select('*')
        .limit(1);
        
      let columnsAvailable = [];
      
      if (!tableError && tableInfo && tableInfo.length > 0) {
        columnsAvailable = Object.keys(tableInfo[0]);
        console.log('[API:update-steam-id] Colunas disponíveis na tabela users:', columnsAvailable.join(', '));
      } else {
        console.log('[API:update-steam-id] Não foi possível obter colunas da tabela users, usando conjunto mínimo');
        // Conjunto mínimo esperado
        columnsAvailable = ['id', 'discord_id', 'name', 'email', 'discord_avatar', 'steam_id', 'created_at', 'updated_at'];
      }
      
      // Criar dado do usuário apenas com colunas que existem na tabela
      const newUser = {
        id: uuidv4(),
        discord_id: discordIdString
      };
      
      // Adicionar campos opcionais apenas se existirem na tabela
      if (columnsAvailable.includes('name')) newUser.name = session.user.name || 'Usuário Phanteon';
      if (columnsAvailable.includes('email')) newUser.email = session.user.email || null;
      if (columnsAvailable.includes('discord_avatar')) newUser.discord_avatar = session.user.image || null;
      if (columnsAvailable.includes('steam_id')) newUser.steam_id = steamId;
      if (columnsAvailable.includes('role')) newUser.role = 'user';
      if (columnsAvailable.includes('created_at')) newUser.created_at = new Date().toISOString();
      if (columnsAvailable.includes('updated_at')) newUser.updated_at = new Date().toISOString();
      
      console.log('[API:update-steam-id] Criando novo usuário com campos:', Object.keys(newUser).join(', '));
        
      const { data: createdUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert(newUser)
        .select()
        .single();
        
      if (createError) {
        console.error(`[API:update-steam-id] Erro ao criar usuário:`, createError);
        console.error('[API:update-steam-id] Objeto do usuário tentado:', JSON.stringify(newUser, null, 2));
        
        return res.status(500).json({ 
          success: false, 
          message: `Erro ao criar usuário: ${createError.message}`
        });
      } else if (createdUser) {
        console.log(`[API:update-steam-id] Usuário criado com sucesso: ${createdUser.id}`);
        userData = createdUser;
      } else {
        // Se não conseguiu criar usuário e também não houve erro
        console.error(`[API:update-steam-id] Situação inesperada: nem erro nem usuário criado`);
        return res.status(500).json({ 
          success: false, 
          message: 'Erro desconhecido ao criar usuário'
        });
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