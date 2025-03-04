import NextAuth from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { supabaseAdmin } from '../../../lib/supabase';

async function syncUserWithDatabase(userData) {
  if (!userData || !userData.id) {
    console.error('Dados de usuário inválidos para sincronização:', userData);
    return null;
  }

  try {
    const discordIdString = userData.id.toString();
    
    // Verifica se o usuário já existe
    const { data: existingUser, error: queryError } = await supabaseAdmin
      .from('users')
      .select('id, discord_id, email')
      .eq('discord_id', discordIdString)
      .maybeSingle();
    
    if (queryError) {
      console.error('Erro ao buscar usuário:', queryError);
      return null;
    }
    
    // Se já existe, atualiza os dados
    if (existingUser) {
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          name: userData.name,
          email: userData.email,
          discord_avatar: userData.image,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id);
      
      if (updateError) {
        console.error('Erro ao atualizar usuário:', updateError);
        return null;
      }
      
      return { id: existingUser.id, discord_id: discordIdString };
    }
    
    // Se não existe, tenta criar novo usuário auth
    let authUserId;
    
    try {
      // Cria o usuário no sistema de autenticação
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: Math.random().toString(36).slice(-16) + Math.random().toString(36).toUpperCase().slice(-8) + '!',
        email_confirm: true,
        user_metadata: {
          discord_id: discordIdString,
          name: userData.name
        }
      });
      
      if (error) throw error;
      authUserId = data.user.id;
    } catch (authError) {
      console.error('Erro ao criar usuário auth:', authError);
      
      // Tenta encontrar o usuário pelo email
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({
        limit: 50,
        page: 1
      });
      
      const existingAuthUser = users.find(u => u.email === userData.email);
      if (!existingAuthUser) {
        return null;
      }
      
      authUserId = existingAuthUser.id;
    }
    
    // Cria o registro na tabela users
    const { data: insertedUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUserId,
        discord_id: discordIdString,
        name: userData.name,
        email: userData.email,
        discord_avatar: userData.image,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Erro ao inserir usuário:', insertError);
      return null;
    }
    
    return { id: insertedUser.id, discord_id: discordIdString };
  } catch (error) {
    console.error('Erro ao sincronizar usuário:', error);
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
        // Sincroniza dados do usuário com o Supabase
        const userData = {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
        
        const syncedUser = await syncUserWithDatabase(userData);
        if (!syncedUser) {
          console.error('Falha ao sincronizar usuário com banco de dados');
        }
        
        return true;
      } catch (error) {
        console.error('Erro no callback signIn:', error);
        return true; // Permite login mesmo com erro de sincronização
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);