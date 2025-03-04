import NextAuth from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { syncUserData } from '../../../lib/auth';

// Improved NextAuth configuration with better session handling
export default NextAuth({
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/',
    error: '/', // Error code passed in query string as ?error=
  },
  callbacks: {
    async jwt({ token, account, profile, user }) {
      // Initial sign in
      if (account && user) {
        console.log('[NextAuth] JWT Callback - Initial sign in:', { 
          id: user.id,
          name: user.name,
          account_type: account.type
        });
        
        return {
          ...token,
          discord_id: user.id,
          access_token: account.access_token,
          token_type: account.token_type,
          expires_at: account.expires_at,
        };
      }
      
      // Subsequent calls
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.discord_id = token.discord_id;
        session.user.access_token = token.access_token;
        session.user.token_type = token.token_type;
        session.error = token.error;
        
        console.log('[NextAuth] Session Callback:', { 
          user: session.user.name,
          discord_id: session.user.discord_id,
          has_token: !!session.user.access_token
        });
      }
      
      return session;
    },
    async signIn({ user, account, profile }) {
      try {
        console.log('[NextAuth] SignIn callback - user data:', { 
          id: user.id, 
          email: user.email, 
          name: user.name
        });
        
        // Sincroniza dados do usuário com o Supabase
        const userData = {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
        
        const syncedUser = await syncUserData(userData);
        
        if (!syncedUser) {
          console.error('[NextAuth] Falha ao sincronizar dados do usuário');
          return false;
        }
        
        console.log('[NextAuth] Usuário sincronizado com sucesso:', syncedUser);
        return true;
      } catch (error) {
        console.error('[NextAuth] Erro no callback signIn:', error);
        return false;
      }
    },
  },
  events: {
    async signIn(message) {
      console.log('[NextAuth] Successful sign in event', { user: message.user.name });
    },
    async signOut(message) {
      console.log('[NextAuth] Sign out event', { session: message.session });
    },
    async session(message) {
      console.log('[NextAuth] Session accessed', { user: message.session?.user?.name });
    },
    async error(message) {
      console.error('[NextAuth] Error event', message);
    }
  },
  logger: {
    error(code, metadata) {
      console.error(`[NextAuth][Error][${code}]`, metadata);
    },
    warn(code, metadata) {
      console.warn(`[NextAuth][Warning][${code}]`, metadata);
    },
    debug(code, metadata) {
      console.log(`[NextAuth][Debug][${code}]`, metadata);
    }
  },
  debug: process.env.NODE_ENV === 'development',
});