import { supabaseAdmin } from './supabase';

/**
 * Cria um usuário no Supabase Auth e também na tabela public.users
 * @param {Object} userData - Dados do usuário do Discord
 */
export async function createOrUpdateUser(userData) {
  const { id: discordId, email, name, image } = userData;
  
  if (!discordId || !email) {
    console.error('[Auth API] Dados incompletos para criar usuário:', { discordId, email });
    throw new Error('Discord ID e email são obrigatórios para criar usuário');
  }
  
  console.log('[Auth API] Processando usuário:', { discordId, email, name });
  
  try {
    // Garante que o discord_id seja string
    const discordIdString = discordId.toString();
    
    // Verifica se já existe um usuário com este discord_id
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, discord_id, email')
      .eq('discord_id', discordIdString)
      .maybeSingle();
    
    if (userError && userError.code !== 'PGRST116') {
      console.error('[Auth API] Erro ao verificar usuário existente:', userError);
      throw userError;
    }
    
    // Se já existe, apenas atualizamos os dados
    if (existingUser) {
      console.log('[Auth API] Usuário existente encontrado:', existingUser.id);
      
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          name,
          email,
          discord_avatar: image,
          updated_at: new Date().toISOString()
        })
        .eq('discord_id', discordIdString);
      
      if (updateError) {
        console.error('[Auth API] Erro ao atualizar usuário:', updateError);
        throw updateError;
      }
      
      return { id: existingUser.id, discord_id: discordIdString };
    }
    
    // Se não existe, primeiro criamos um usuário no auth.users
    // Gera uma senha aleatória forte
    const password = 
      Math.random().toString(36).slice(-10) + 
      Math.random().toString(36).slice(-10).toUpperCase() + 
      '!' + 
      Math.random().toString(36).slice(-10) + 
      Math.floor(Math.random() * 10000);
    
    console.log('[Auth API] Criando novo usuário auth para:', email);
    
    // Cria o usuário no sistema de autenticação
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        discord_id: discordIdString,
        name
      }
    });
    
    if (authError) {
      console.error('[Auth API] Erro ao criar usuário auth:', authError);
      throw authError;
    }
    
    if (!authData || !authData.user || !authData.user.id) {
      console.error('[Auth API] Falha ao criar usuário auth, resposta vazia');
      throw new Error('Falha ao criar usuário auth');
    }
    
    const authUserId = authData.user.id;
    console.log('[Auth API] Usuário criado no auth system, id:', authUserId);
    
    // Agora criamos na tabela public.users com o ID do auth.users e Discord ID como string
    const userData = {
      id: authUserId,
      discord_id: discordIdString,
      name,
      email,
      discord_avatar: image
    };
    
    console.log('[Auth API] Inserindo usuário na tabela public.users:', userData);
    
    const { data: insertedUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (insertError) {
      console.error('[Auth API] Erro ao inserir usuário na tabela:', insertError);
      throw insertError;
    }
    
    console.log('[Auth API] Usuário inserido na tabela public.users:', insertedUser);
    
    return { id: authUserId, discord_id: discordIdString };
  } catch (error) {
    console.error('[Auth API] Erro ao criar/atualizar usuário:', error);
    if (error.message) {
      console.error('[Auth API] Mensagem:', error.message);
    }
    if (error.details) {
      console.error('[Auth API] Detalhes:', error.details);
    }
    throw error;
  }
}