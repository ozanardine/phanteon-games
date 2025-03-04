import NextAuth, { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabase";

export const authOptions: NextAuthOptions = {
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
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error || !data.user) {
            return null;
          }

          // Obter dados do perfil
          const { data: profileData } = await supabase
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
            // Adicionar registro na tabela discord_connections
            const { error } = await supabase.from("discord_connections").upsert({
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

            if (!error) {
              token.discord_connected = true;
            }
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

export default NextAuth(authOptions);