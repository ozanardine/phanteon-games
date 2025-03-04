import NextAuth, { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from 'uuid';

// Verifica se as variáveis de ambiente essenciais estão definidas
const checkEnv = () => {
  const requiredEnvs = [
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'NEXTAUTH_SECRET'
  ];
  
  const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
  
  if (missingEnvs.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvs.join(', ')}`);
    
    // Em desenvolvimento, mostra um erro mais detalhado
    if (process.env.NODE_ENV === 'development') {
      throw new Error(`Authentication configuration error: Missing ${missingEnvs.join(', ')}`);
    }
  }
};

// Executa a verificação
checkEnv();

// Log as variáveis para depuração (redacted para segurança)
console.log('AUTH CONFIG:', {
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID ? '✓ Set' : '✗ Missing',
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET ? '✓ Set' : '✗ Missing',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Using default',
  NODE_ENV: process.env.NODE_ENV
});

/**
 * Procura ou cria um usuário no Supabase com base nos dados do Discord
 * Esta função foi corrigida para não usar funções admin
 */
async function findOrCreateSupabaseUser(profile: any, discordId: string) {
  console.log(`Processing Discord login for user: ${profile.email || 'no-email'} (Discord ID: ${discordId})`);
  
  try {
    // 1. Procurar uma conexão Discord existente
    const { data: existingConnection, error: connectionError } = await supabase
      .from("discord_connections")
      .select("user_id")
      .eq("discord_user_id", discordId)
      .maybeSingle();
    
    if (connectionError) {
      console.error("Error searching for Discord connection:", connectionError);
    }
    
    // Se encontramos uma conexão, retornar o UUID do usuário associado
    if (existingConnection?.user_id) {
      console.log(`Found existing user account linked to Discord: ${existingConnection.user_id}`);
      return existingConnection.user_id;
    }
    
    // 2. Se não encontrou por Discord ID, procurar por email (se disponível)
    if (profile.email) {
      // Buscar na tabela de perfis já que não podemos usar admin.getUserByEmail
      const { data: userByEmail, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", profile.email)
        .maybeSingle();
      
      if (profileError) {
        console.error("Error searching user by email:", profileError);
      }
      
      if (userByEmail?.id) {
        const userId = userByEmail.id;
        console.log(`Found existing user by email ${profile.email}: ${userId}`);
        
        // Registrar a conexão Discord com este usuário
        await linkDiscordToUser(userId, discordId, profile);
        
        return userId;
      }
    }
    
    // 3. Se não encontramos o usuário, criar um novo
    console.log("Creating new Supabase user for Discord login");
    
    // Criar senha aleatória segura
    const randomPassword = Array(32).fill(0).map(() => 
      Math.random().toString(36).charAt(2)).join('');
    
    // Usar email do Discord ou gerar um email único
    const email = profile.email || `discord_${discordId}@phanteongames.com`;
    
    // Criar um novo usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: randomPassword,
      options: {
        data: {
          discord_id: discordId,
          username: profile.username || profile.name || email.split('@')[0],
          avatar_url: profile.image
        }
      }
    });
    
    if (authError) {
      console.error("Error creating Supabase user:", authError);
      throw authError;
    }
    
    if (!authData.user) {
      throw new Error("Falha ao criar usuário no Supabase");
    }
    
    const userId = authData.user.id;
    console.log(`Created new Supabase user: ${userId}`);
    
    // Não precisamos atualizar o perfil manualmente, pois o trigger handle_new_user deve fazer isso
    // Se precisarmos garantir, podemos aguardar um pouco e então verificar
    
    // Registrar a conexão Discord
    await linkDiscordToUser(userId, discordId, profile);
    
    return userId;
  } catch (error) {
    console.error("Error in findOrCreateSupabaseUser:", error);
    throw error;
  }
}

/**
 * Cria ou atualiza uma conexão Discord para um usuário
 */
async function linkDiscordToUser(userId: string, discordId: string, profile: any) {
  try {
    const { error } = await supabase
      .from("discord_connections")
      .upsert({
        user_id: userId,
        discord_user_id: discordId,
        discord_username: profile.name || profile.username,
        discord_avatar: profile.image,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, discord_user_id' });

    if (error) {
      console.error("Error linking Discord account:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in linkDiscordToUser:", error);
    return false;
  }
}

/**
 * Verifica e atribui cargo do Discord se o usuário tiver uma assinatura ativa
 */
async function assignDiscordRoleIfSubscribed(userId: string, discordId: string) {
  try {
    // Verificar se há uma assinatura ativa
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();
    
    if (subError) {
      console.error("Error checking subscription:", subError);
      return false;
    }
    
    if (!subscription || !subscription.plan?.discord_role_id) {
      console.log(`No active subscription with Discord role for user ${userId}`);
      return false;
    }
    
    console.log(`Assigning Discord role ${subscription.plan.discord_role_id} to Discord user ${discordId}`);
    
    // Chamar a API do Discord para atribuir o cargo
    try {
      // Verificar se temos todas as variáveis de ambiente necessárias
      if (!process.env.DISCORD_GUILD_ID || !process.env.DISCORD_BOT_TOKEN) {
        console.error("Missing Discord bot configuration");
        return false;
      }
      
      const response = await fetch(
        `https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordId}/roles/${subscription.plan.discord_role_id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json"
          }
        }
      );
      
      // 204 é o código de sucesso para esta operação (No Content)
      if (!response.ok && response.status !== 204) {
        const errorData = await response.text().catch(() => "Unknown error");
        console.error(`Discord API error (${response.status}):`, errorData);
        return false;
      }
      
      // Registrar a atribuição do cargo
      await supabase
        .from("discord_role_logs")
        .insert({
          user_id: userId,
          discord_user_id: discordId,
          discord_role_id: subscription.plan.discord_role_id,
          role_name: subscription.plan.name,
          action: "added",
          reason: "oauth_login"
        });
        
      return true;
    } catch (error) {
      console.error("Error assigning Discord role:", error);
      return false;
    }
  } catch (error) {
    console.error("Error in assignDiscordRoleIfSubscribed:", error);
    return false;
  }
}

/**
 * Busca dados do perfil do usuário do Supabase
 */
async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
      
    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
      authorization: {
        params: { scope: "identify email guilds.join" },
      },
      profile(profile) {
        if (profile.avatar === null) {
          const defaultAvatarNumber = parseInt(profile.discriminator) % 5;
          profile.image_url = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
        } else {
          const format = profile.avatar.startsWith("a_") ? "gif" : "png";
          profile.image_url = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
        }
        
        return {
          id: profile.id,
          name: profile.username,
          email: profile.email,
          image: profile.image_url,
        };
      },
    }),
    CredentialsProvider({
      name: "Supabase",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error || !data.user) {
            console.error("Credentials login error:", error);
            return null;
          }

          // Obter dados do perfil
          const profile = await getUserProfile(data.user.id);

          if (!profile) {
            console.error("Profile not found for user:", data.user.id);
          }

          return {
            id: data.user.id,
            email: data.user.email,
            name: profile?.username || profile?.display_name,
            image: profile?.avatar_url,
            isAdmin: profile?.is_admin || false,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Adiciona dados adicionais ao token JWT
      if (user) {
        token.uid = user.id;
        token.isAdmin = user.isAdmin;
        
        // Se for login do Discord, processar a vinculação
        if (account?.provider === "discord" && account.access_token && profile) {
          try {
            // Encontrar ou criar usuário no Supabase
            const userId = await findOrCreateSupabaseUser(profile, profile.id);
            
            // Atualizar o token com o ID correto do Supabase (UUID)
            token.uid = userId;
            token.discordId = profile.id;
            
            // Registrar/atualizar o token de acesso do Discord
            const tokenExpiresAt = account.expires_at 
              ? new Date(account.expires_at * 1000).toISOString() 
              : new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(); // +6 meses por padrão
              
            const { error: connectionError } = await supabase
              .from("discord_connections")
              .update({
                discord_access_token: account.access_token,
                discord_refresh_token: account.refresh_token || null,
                discord_token_expires_at: tokenExpiresAt,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", userId)
              .eq("discord_user_id", profile.id);

            if (connectionError) {
              console.error("Error updating Discord tokens:", connectionError);
            } else {
              token.discord_connected = true;
              
              // Atribuir cargo no Discord se houver assinatura ativa
              await assignDiscordRoleIfSubscribed(userId, profile.id);
            }
          } catch (error) {
            console.error("Error in Discord login flow:", error);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Transfere dados do token para a sessão
      if (token && session.user) {
        // Garantir que o ID de usuário está no formato UUID correto
        if (typeof token.uid === 'string') {
          session.user.id = token.uid;
        }
        
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.discordConnected = token.discord_connected as boolean;
        
        if (token.discordId) {
          session.user.discordId = token.discordId as string;
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Permite redirecionamentos para URLs dentro do domínio
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, metadata) {
      console.error(`[auth] Error (${code}):`, metadata);
    },
    warn(code) {
      console.warn(`[auth] Warning (${code})`);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[auth] Debug (${code}):`, metadata);
      }
    },
  },
};

export default NextAuth(authOptions);