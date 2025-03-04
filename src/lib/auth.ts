import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getSession, signIn, signOut } from "next-auth/react";
import { supabase } from "./supabase";

/**
 * Obtém a sessão do usuário no servidor
 */
export async function getServerAuthSession() {
  return getServerSession(authOptions);
}

/**
 * Obtém a sessão do usuário no cliente
 */
export async function getClientAuthSession() {
  return getSession();
}

/**
 * Faz login com email e senha
 */
export async function loginWithCredentials(email: string, password: string) {
  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    
    return { success: !result?.error, error: result?.error };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Falha na autenticação" };
  }
}

/**
 * Faz login com Discord
 */
export async function loginWithDiscord(redirectUrl?: string) {
  try {
    await signIn("discord", { callbackUrl: redirectUrl || window.location.origin });
    return { success: true };
  } catch (error) {
    console.error("Discord login error:", error);
    return { success: false, error: "Falha na autenticação com Discord" };
  }
}

/**
 * Desvincula a conta do Discord
 */
export async function unlinkDiscordAccount() {
  try {
    const response = await fetch("/api/auth/discord/unlink", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao desvincular conta do Discord");
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao desvincular Discord:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    };
  }
}

/**
 * Cria uma nova conta de usuário
 */
export async function registerUser(email: string, password: string, username: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });
    
    if (error) throw error;
    
    // Se o registro for bem-sucedido, fazer login
    if (data.user) {
      return { success: true, user: data.user };
    }
    
    return { success: false, error: "Erro desconhecido no registro" };
  } catch (error) {
    console.error("Registration error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro no registro" 
    };
  }
}

/**
 * Faz logout do usuário
 */
export async function logout() {
  try {
    await signOut({ callbackUrl: "/" });
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error: "Erro ao fazer logout" };
  }
}

/**
 * Obtém dados do perfil do usuário atual
 */
export async function getCurrentProfile() {
  try {
    const session = await getClientAuthSession();
    
    if (!session?.user) {
      return { profile: null, error: "Usuário não autenticado" };
    }
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    
    if (error) throw error;
    
    return { profile: data, error: null };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return { 
      profile: null, 
      error: error instanceof Error ? error.message : "Erro ao buscar perfil" 
    };
  }
}

/**
 * Atualiza o perfil do usuário
 */
export async function updateUserProfile(profileData: any) {
  try {
    const session = await getClientAuthSession();
    
    if (!session?.user) {
      return { success: false, error: "Usuário não autenticado" };
    }
    
    const { data, error } = await supabase
      .from("profiles")
      .update(profileData)
      .eq("id", session.user.id)
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, profile: data };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro ao atualizar perfil" 
    };
  }
}

/**
 * Solicita redefinição de senha
 */
export async function requestPasswordReset(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error("Password reset request error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro ao solicitar redefinição de senha" 
    };
  }
}

/**
 * Atualiza a senha do usuário
 */
export async function updateUserPassword(password: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password,
    });
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error("Password update error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro ao atualizar senha" 
    };
  }
}

/**
 * Verifica se o usuário tem uma conexão com o Discord
 */
export async function checkDiscordConnection() {
  try {
    const session = await getClientAuthSession();
    
    if (!session?.user) {
      return { connected: false };
    }
    
    // O status do Discord já está disponível na sessão graças ao callback
    if (session.user.discordConnected) {
      return { connected: true };
    }
    
    // Caso não esteja na sessão, buscar do banco
    const { data } = await supabase
      .from("discord_connections")
      .select("discord_username, discord_avatar")
      .eq("user_id", session.user.id)
      .single();
    
    return { 
      connected: !!data, 
      username: data?.discord_username,
      avatar: data?.discord_avatar
    };
  } catch (error) {
    console.error("Error checking Discord connection:", error);
    return { connected: false };
  }
}