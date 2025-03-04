import NextAuth from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { syncUserData } from '../../../lib/auth';

export default NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: {
        params: { scope: 'identify email guilds' },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
    updateAge: 24 * 60 * 60, // 1 dia
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Adiciona discord_id no token JWT
      if (account) {
        token.discord_id = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      // Adiciona discord_id na sessão do usuário
      if (token) {
        session.user.discord_id = token.discord_id;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      try {
        console.log('SignIn callback - user data:', { 
          id: account.providerAccountId, 
          email: user.email, 
          name: user.name, 
          image: user.image 
        });
        
        // Sincroniza dados do usuário com o Supabase
        const userData = {
          id: account.providerAccountId,
          email: user.email,
          name: user.name,
          image: user.image,
        };
        
        const syncedUser = await syncUserData(userData);
        
        if (!syncedUser) {
          console.error('Falha ao sincronizar dados do usuário');
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Erro no callback signIn:', error);
        return false;
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
});