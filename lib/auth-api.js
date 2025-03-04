import { supabaseAdmin } from './supabase';

/**
 * Cria um usuário no Supabase Auth e também na tabela public.users
 * @param {Object} userData - Dados do usuário do Discord
 */
export async function createOrUpdateUser(userData) {
  const { id: discordId, email, name, image } = userData;
  
  console.log('Processando usuário:', { discordId, email, name });
  
  try {
    // Verifica se já existe um usuário com este discord_id
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, discord_id, email')
      .eq('discord_id', discordId)
      .maybeSingle();
    
    // Se já existe, apenas atualizamos os dados
    if (existingUser) {
      console.log('Usuário existente encontrado:', existingUser.id);
      
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          name,
          email,
          discord_avatar: image,
          updated_at: new Date()
        })
        .eq('id', existingUser.id);
      
      if (updateError) throw updateError;
      
      return { id: existingUser.id, discord_id: discordId };
    }
    
    // Se não existe, primeiro criamos no auth.users
    console.log('Criando novo usuário no sistema de autenticação');
    
    // Verifica se já existe um usuário com este email no auth
    const { data: { users: authUsers } = {}, error: authListError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authListError) {
      console.error('Erro ao listar usuários auth:', authListError);
      throw authListError;
    }
    
    const existingAuthUser = authUsers.find(user => user.email === email);
    let authUserId;
    
    if (existingAuthUser) {
      console.log('Usuário existente encontrado no auth.users:', existingAuthUser.id);
      authUserId = existingAuthUser.id;
    } else {
      // Gera uma senha aleatória segura
      const password = 
        Math.random().toString(36).slice(-10) + 
        Math.random().toString(36).slice(-10).toUpperCase() + 
        '!' + 
        Math.random().toString(36).slice(-10);
      
      // Cria o usuário no sistema de autenticação
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          discord_id: discordId,
          name
        }
      });
      
      if (authError) throw authError;
      
      authUserId = authData.user.id;
      console.log('Usuário criado no auth system, id:', authUserId);
    }
    
    // Agora criamos na tabela public.users com o ID do auth.users
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUserId,
        discord_id: discordId,
        name,
        email,
        discord_avatar: image
      });
    
    if (insertError) throw insertError;
    
    return { id: authUserId, discord_id: discordId };
  } catch (error) {
    console.error('Erro ao criar/atualizar usuário:', error);
    console.error('Detalhes do erro:', JSON.stringify(error));
    throw error;
  }
}