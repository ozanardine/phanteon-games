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
      
      return {
        ...existingUser,
        name: userData.name,
        email: userData.email,
        discord_avatar: userData.image,
      };
    }
    
    // Se não existe, criamos um novo
    console.log('[Auth] Usuário não encontrado, criando novo registro');
    
    // Buscar estrutura correta da tabela users dinamicamente
    console.log('[Auth] Buscando estrutura da tabela users');
    
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1);
      
    let columnsAvailable = [];
    
    if (!tableError && tableInfo && tableInfo.length > 0) {
      columnsAvailable = Object.keys(tableInfo[0]);
      console.log('[Auth] Colunas disponíveis na tabela users:', columnsAvailable.join(', '));
    } else {
      console.log('[Auth] Não foi possível obter colunas da tabela users, usando conjunto mínimo');
      // Conjunto mínimo esperado
      columnsAvailable = ['id', 'discord_id', 'name', 'email', 'discord_avatar', 'created_at', 'updated_at'];
    }
    
    // Criar dado do usuário apenas com colunas que existem na tabela
    const newUser = {
      id: uuidv4(),
      discord_id: discordIdString  // Garante que é salvo como string
    };
    
    // Adicionar campos opcionais apenas se existirem na tabela
    if (columnsAvailable.includes('name')) newUser.name = userData.name;
    if (columnsAvailable.includes('email')) newUser.email = userData.email;
    if (columnsAvailable.includes('discord_avatar')) newUser.discord_avatar = userData.image;
    if (columnsAvailable.includes('role')) newUser.role = 'user'; 
    if (columnsAvailable.includes('created_at')) newUser.created_at = new Date().toISOString();
    if (columnsAvailable.includes('updated_at')) newUser.updated_at = new Date().toISOString();
    
    console.log('[Auth] Criando novo usuário com campos:', Object.keys(newUser).join(', '));
    
    // Inserir no Supabase
    const { data: insertedUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert(newUser)
      .select()
      .single();
    
    if (insertError) {
      console.error('[Auth] Erro ao inserir usuário:', insertError);
      console.error('[Auth] Objeto do usuário tentado:', JSON.stringify(newUser, null, 2));
      
      throw insertError;
    }
    
    console.log('[Auth] Novo usuário criado com sucesso:', insertedUser.id);
    return insertedUser;
  } catch (error) {
    console.error('[Auth] Exceção ao sincronizar usuário:', error);
    throw error;
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
          // Adicionar explicitamente o username do Discord
          discord_username: profile.username,
          // Nome global/de exibição (disponível nas contas mais recentes)
          discord_global_name: profile.global_name
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
        // Adicionar campos de username
        token.discord_username = user.discord_username;
        token.discord_global_name = user.discord_global_name;
      }
      return token;
    },
    async session({ session, token }) {
      // Adiciona discord_id à sessão
      if (token) {
        session.user.discord_id = token.discord_id;
        // Adicionar campos de username à sessão
        session.user.discord_username = token.discord_username;
        session.user.discord_global_name = token.discord_global_name;
        
        // Buscar role do usuário no Supabase
        try {
          // Garantir que o Discord ID seja uma string
          const discordIdString = token.discord_id.toString();
          
          console.log(`[Auth:session] Buscando role para usuário: ${discordIdString}`);
          
          const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('discord_id', discordIdString)
            .maybeSingle();
            
          if (userError) {
            console.error('[Auth:session] Erro ao buscar role:', userError);
          } else if (userData) {
            console.log(`[Auth:session] Role encontrada: ${userData.role}`);
            // Adicionar role à sessão
            session.user.role = userData.role;
          } else {
            console.log('[Auth:session] Usuário não encontrado, definindo role padrão');
            session.user.role = 'user';
          }
        } catch (error) {
          console.error('[Auth:session] Erro ao buscar role do usuário:', error);
          session.user.role = 'user'; // Fallback para role padrão
        }
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