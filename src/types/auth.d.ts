import { Session, User } from '@supabase/supabase-js';
import { UserProfile } from '@/lib/supabase';

// Definições de tipo para o contexto de autenticação
declare module '@/contexts/AuthContext' {
  export type AuthContextType = {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    isLoading: boolean;
    isAdmin: boolean;
    refreshProfile: () => Promise<void>;
  };

  export const useAuth: () => AuthContextType;
  
  export interface AuthProviderProps {
    children: React.ReactNode;
  }
  
  export const AuthProvider: React.FC<AuthProviderProps>;
}