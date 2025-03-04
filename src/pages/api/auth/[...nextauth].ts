import NextAuth, { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import { supabase } from "@/lib/supabase";

// Para uso com o evento signIn
import { createClient } from "@supabase/supabase-js";

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  }),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
      authorization: {
        params: { scope: "identify guilds.join email" },
      },
      profile(profile) {
        return {
          id: profile.id,
          name: profile.username,
          email: profile.email,
          image: profile.avatar 
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` 
            : null,
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
          const adminClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || "",
            {
              auth: {
                autoRefreshToken: false,
                persistSession: false,
              },
            }
          );

          const { data, error } = await adminClient.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error || !data.user) {
            return null;
          }

          // Obter dados do perfil
          const { data: profileData } = await adminClient
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

          return {
            id: data.user.id,
            email: data.user.email,
            name: profileData?.username || profileData?.display_name,
            image: profileData?.avatar_url,
            isAdmin: profileData?.is_admin || false,
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
        
        // Se for login do Discord, vincular conta
        if (account?.provider === "discord" && account.access_token) {
          try {
            const adminClient = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL || "",
              process.env.SUPABASE_SERVICE_ROLE_KEY || ""
            );
            
            // Adicionar registro na tabela discord_connections
            await adminClient.from("discord_connections").upsert({
              user_id: user.id,
              discord_user_id: profile?.id,
              discord_username: profile?.username,
              discord_avatar: profile?.avatar ? 
                `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null,
              discord_access_token: account.access_token,
              discord_refresh_token: account.refresh_token,
              discord_token_expires_at: account.expires_at 
                ? new Date(account.expires_at * 1000).toISOString() 
                : null,
              updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" });
            
            // Atribuir cargo Discord para usuários com assinatura ativa
            await assignDiscordRoleIfSubscribed(
              adminClient, 
              user.id, 
              profile?.id as string
            );

            token.discord_connected = true;
          } catch (error) {
            console.error("Error linking Discord account:", error);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Transfere dados do token para a sessão
      if (token && session.user) {
        session.user.id = token.uid as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.discordConnected = token.discord_connected as boolean;
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
};

// Função auxiliar para atribuir cargo VIP no Discord
async function assignDiscordRoleIfSubscribed(supabaseAdmin, userId, discordUserId) {
  try {
    // Verificar assinatura ativa
    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("*, plan:subscription_plans(*)")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (!subscription?.plan?.discord_role_id) {
      return; // Sem assinatura ativa ou sem role definida
    }

    // Adicionar o usuário ao servidor Discord e atribuir cargo VIP
    await fetch(
      `https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordUserId}/roles/${subscription.plan.discord_role_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
      }
    );

    // Registrar adição de cargo
    await supabaseAdmin
      .from("discord_role_logs")
      .insert({
        user_id: userId,
        discord_user_id: discordUserId,
        discord_role_id: subscription.plan.discord_role_id,
        role_name: subscription.plan.name,
        action: "added",
        reason: "active_subscription"
      });
  } catch (error) {
    console.error("Erro ao atribuir cargo VIP no Discord:", error);
  }
}

export default NextAuth(authOptions);