import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Extensão da interface do usuário do NextAuth
   */
  interface User {
    id: string;
    isAdmin?: boolean;
  }

  /**
   * Extensão da interface da sessão do NextAuth
   */
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
      discordConnected?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /** Extensão da interface do token JWT */
  interface JWT {
    uid: string;
    isAdmin?: boolean;
    discord_connected?: boolean;
  }
}