import { useSession, signIn, signOut } from "next-auth/react";
import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { 
  loginWithCredentials, 
  loginWithDiscord, 
  registerUser, 
  logout,
  requestPasswordReset,
  updateUserPassword,
  updateUserProfile,
  checkDiscordConnection,
  unlinkDiscordAccount
} from "@/lib/auth";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  const login = useCallback(async (email: string, password: string, redirectTo?: string) => {
    setLoading(true);
    try {
      const result = await loginWithCredentials(email, password);
      
      if (result.success) {
        if (redirectTo) {
          router.push(redirectTo);
        }
        return { success: true };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      console.error("Login error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro ao fazer login" 
      };
    } finally {
      setLoading(false);
    }
  }, [router]);

  const signUpUser = useCallback(async (email: string, password: string, username: string) => {
    setLoading(true);
    try {
      const result = await registerUser(email, password, username);
      return result;
    } catch (error) {
      console.error("Sign up error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro ao criar conta" 
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const logoutUser = useCallback(async (redirectTo = "/") => {
    setLoading(true);
    try {
      await logout();
      router.push(redirectTo);
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro ao fazer logout" 
      };
    } finally {
      setLoading(false);
    }
  }, [router]);

  const connectDiscord = useCallback(async (redirectUrl?: string) => {
    setLoading(true);
    try {
      await loginWithDiscord(redirectUrl);
      return { success: true };
    } catch (error) {
      console.error("Connect Discord error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro ao conectar Discord" 
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnectDiscord = useCallback(async () => {
    setLoading(true);
    try {
      const result = await unlinkDiscordAccount();
      return result;
    } catch (error) {
      console.error("Disconnect Discord error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro ao desconectar Discord" 
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    try {
      const result = await requestPasswordReset(email);
      return result;
    } catch (error) {
      console.error("Reset password error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro ao solicitar redefinição de senha" 
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    setLoading(true);
    try {
      const result = await updateUserPassword(password);
      return result;
    } catch (error) {
      console.error("Update password error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro ao atualizar senha" 
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (profileData: any) => {
    setLoading(true);
    try {
      const result = await updateUserProfile(profileData);
      return result;
    } catch (error) {
      console.error("Update profile error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro ao atualizar perfil" 
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const checkDiscord = useCallback(async () => {
    try {
      const result = await checkDiscordConnection();
      return result;
    } catch (error) {
      console.error("Check Discord error:", error);
      return { connected: false };
    }
  }, []);

  return {
    session,
    user: session?.user,
    isAuthenticated,
    isLoading: isLoading || loading,
    isAdmin: session?.user?.isAdmin || false,
    login,
    signUp: signUpUser,
    logout: logoutUser,
    connectDiscord,
    disconnectDiscord,
    resetPassword,
    updatePassword,
    updateProfile,
    checkDiscord,
  };
}