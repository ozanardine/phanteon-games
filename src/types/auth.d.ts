// src/types/auth.d.ts
import { Session, User } from '@supabase/supabase-js';
import { UserProfile } from '@/lib/supabase';

// Definições de tipo para o contexto de autenticação
// Apenas para referência - não tenta redeclarar implementações existentes
declare module '@/contexts/AuthContext' {
  interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    isLoading: boolean;
    isAdmin: boolean;
    refreshProfile: () => Promise<void>;
  }

  interface AuthProviderProps {
    children: React.ReactNode;
  }
}