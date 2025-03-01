// src/types/auth.ts

// Interfaces para autenticação e perfil de usuário
export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  discordId?: string;
  discordUsername?: string;
  steamId?: string;
  createdAt: Date;
  subscription?: UserSubscription;
}

export interface UserSubscription {
  tier?: string; // Adicionando a propriedade tier que estava faltando
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'unpaid';
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface DiscordAuthData {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface SteamAuthData {
  steamId: string;
  username: string;
  avatarUrl: string;
}

// Tipos para autenticação Discord
export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  email?: string;
  verified?: boolean;
}

export interface DiscordToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

// Tipos para estado de autenticação
export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}

// Tipos para métodos de autenticação
export interface AuthMethods {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

// Interfaces para hooks de autenticação
export interface UseAuthReturn extends AuthState, AuthMethods {
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasActiveSubscription: boolean;
  signInWithDiscord: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
}

// Interfaces para respostas de autenticação
export interface AuthResponse {
  success: boolean;
  user?: UserProfile;
  error?: string;
}

// Interfaces para permissões
export type UserRole = 'user' | 'vip' | 'admin' | 'superadmin';

export interface UserPermissions {
  roles: UserRole[];
  canAccessDashboard: boolean;
  canModifyServer: boolean;
  canManageUsers: boolean;
  canManagePayments: boolean;
}

export interface PasswordResetRequest {
  email: string;
  token: string;
  newPassword: string;
}