import NextAuth from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { supabaseAdmin } from '../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Sincroniza usuário do Discord com o banco de dados Supabase
 * @param {Object} userData - Dados do usuário do Discord
 * @returns {Promise<Object>} - Dados do usuário sincronizado
 */
async function syncUserWithDatabase(userData) {
  if (!userData || !userData.id) {
    console.error('[Auth] Dados de usuário inválidos para sincronização:', userData);
    return null;
  }

  try {
    // Garante que o discord_id seja string
    const discordIdString = userData.id.toString();
    
    console.log('[Auth] Iniciando sincronização para discord_id:', discordIdString);
    
    // Verifica se o usuário já existe no Supabase
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('discord_id', discordIdString)
      .maybeSingle();
      
    // Se ocorrer um erro diferente de "nenhum resultado encontrado"
    if (userError && userError.code !== 'PGRST116') {
      console.error('[Auth] Erro ao verificar usuário existente:', userError);
      throw userError;
    }
    
    // Se já existe, apenas atualizamos os dados
    if (existingUser) {
      console.log('[Auth] Usuário existente encontrado, id:', existingUser.id);
      
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          name: userData.name,
          email: userData.email,
          discord_avatar: userData.image,
          updated_at: new Date().toISOString()
        })
        .eq('discord_id', discordIdString);
      
      if (updateError) {
        console.error('[Auth] Erro ao atualizar usuário:', updateError);
        throw updateError;
      }
      
      return { id: existingUser.id, discord_id: discordIdString };
    }
    
    // Se não existe, precisamos criar um novo
    console.log('[Auth] Usuário não encontrado, criando novo registro');
    
    // Gera um novo UUID para o usuário
    const newUserId = uuidv4();
    
    // Insere o usuário na tabela
    const { data: insertedUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([{
        id: newUserId,
        discord_id: discordIdString,
        name: userData.name,
        email: userData.email,
        discord_avatar: userData.image,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (insertError) {
      console.error('[Auth] Erro ao inserir usuário:', insertError);
      
      // Se o erro for de chave duplicada, tenta recuperar o usuário existente
      if (insertError.code === '23505') {
        console.log('[Auth] Conflito de chave única, tentando recuperar usuário existente');
        
        const { data: recoveredUser, error: recoveryError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('discord_id', discordIdString)
          .maybeSingle();
          
        if (recoveryError || !recoveredUser) {
          console.error('[Auth] Falha na recuperação:', recoveryError);
          throw insertError;
        }
        
        return { id: recoveredUser.id, discord_id: discordIdString };
      }
      
      throw insertError;
    }
    
    console.log('[Auth] Usuário criado com sucesso:', insertedUser.id);
    return { id: insertedUser.id, discord_id: discordIdString };
    
  } catch (error) {
    console.error('[Auth] Erro ao sincronizar usuário:', error);
    return null;
  }
}

export const authOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: {
        params: { scope: 'identify email guilds' },
      },
      profile(profile) {
        if (profile.avatar === null) {
          const defaultAvatarNumber = parseInt(profile.discriminator) % 5;
          profile.image_url = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
        } else {
          const format = profile.avatar.startsWith('a_') ? 'gif' : 'png';
          profile.image_url = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
        }
        
        return {
          id: profile.id,
          name: profile.username || profile.global_name,
          email: profile.email,
          image: profile.image_url,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        // Initial sign in
        token.discord_id = user.id;
        token.access_token = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Adiciona discord_id à sessão
      if (token) {
        session.user.discord_id = token.discord_id;
      }
      return session;
    },
    async signIn({ user, account }) {
      try {
        console.log('[Auth] Usuário autenticado:', user.id, user.name);
        
        // Sincroniza dados do usuário com o Supabase
        const userData = {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
        
        const syncedUser = await syncUserWithDatabase(userData);
        if (!syncedUser) {
          console.error('[Auth] Falha ao sincronizar usuário com banco de dados');
        } else {
          console.log('[Auth] Sincronização bem-sucedida:', syncedUser.id);
        }
        
        return true;
      } catch (error) {
        console.error('[Auth] Erro no callback signIn:', error);
        return true; // Permite login mesmo com erro de sincronização
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);