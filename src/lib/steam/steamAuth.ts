// src/lib/steam/steamAuth.ts
import { supabase } from '../supabase/client';
import { SteamUser } from '@/types/auth';

const STEAM_API_KEY = process.env.STEAM_API_KEY || '';
const STEAM_REDIRECT_URI = process.env.NEXT_PUBLIC_STEAM_REDIRECT_URI || '';
const STEAM_REALM = process.env.NEXT_PUBLIC_STEAM_REALM || '';

/**
 * Gera a URL para autenticação via OpenID Steam
 */
export const getSteamAuthUrl = (): string => {
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': STEAM_REDIRECT_URI,
    'openid.realm': STEAM_REALM,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });

  return `https://steamcommunity.com/openid/login?${params.toString()}`;
};

/**
 * Valida uma resposta de autenticação OpenID do Steam
 * @param queryParams Parâmetros da URL de callback
 */
export const validateSteamResponse = async (queryParams: Record<string, string>): Promise<string | null> => {
  try {
    // Verificar resposta OpenID
    if (queryParams['openid.mode'] !== 'id_res') {
      return null;
    }

    // Montar parâmetros para validação
    const params = new URLSearchParams();
    for (const key in queryParams) {
      if (key === 'openid.mode') {
        params.append(key, 'check_authentication');
      } else {
        params.append(key, queryParams[key]);
      }
    }

    // Validar autenticação
    const response = await fetch('https://steamcommunity.com/openid/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const responseText = await response.text();
    
    if (!responseText.includes('is_valid:true')) {
      return null;
    }

    // Extrair ID do Steam do claimed_id
    const claimedId = queryParams['openid.claimed_id'];
    if (!claimedId) {
      return null;
    }

    const steamId = claimedId.split('/').pop();
    return steamId || null;
  } catch (error) {
    console.error('Error validating Steam response:', error);
    return null;
  }
};

/**
 * Obtém informações do usuário do Steam API
 * @param steamId ID do Steam
 */
export const getSteamUserInfo = async (steamId: string): Promise<SteamUser | null> => {
  try {
    if (!STEAM_API_KEY) {
      console.error('Steam API key not configured');
      return null;
    }

    const response = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`);
    
    if (!response.ok) {
      throw new Error(`Steam API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.response || !data.response.players || data.response.players.length === 0) {
      return null;
    }

    return data.response.players[0];
  } catch (error) {
    console.error('Error getting Steam user info:', error);
    return null;
  }
};

/**
 * Processa a autenticação do Steam após o retorno do OpenID
 * @param queryParams Parâmetros da URL de callback
 */
export const handleSteamAuth = async (queryParams: Record<string, string>) => {
  try {
    // 1. Validar resposta do Steam e obter steamId
    const steamId = await validateSteamResponse(queryParams);
    
    if (!steamId) {
      throw new Error('Invalid Steam authentication response');
    }

    // 2. Obter informações do usuário Steam
    const steamUser = await getSteamUserInfo(steamId);
    
    if (!steamUser) {
      throw new Error('Failed to get Steam user information');
    }

    // 3. Verificar se o usuário já existe baseado no Steam ID
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('steam_id', steamId)
      .maybeSingle();

    // 4. Obter sessão atual do Supabase
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new Error(`Error getting session: ${sessionError.message}`);
    }

    // 5. Se não houver usuário autenticado, criar ou fazer login
    if (!sessionData.session?.user) {
      if (existingProfile) {
        // Usuário já existe, fazer login
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: existingProfile.email,
          password: `steam_${steamId}`, // Senha especial para contas Steam
        });

        if (authError) {
          // Se não conseguir fazer login, tentar recriar
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: existingProfile.email,
            password: `steam_${steamId}`,
          });

          if (signUpError) {
            throw new Error(`Error recreating Steam user account: ${signUpError.message}`);
          }
        }
      } else {
        // Novo usuário, criar conta
        // Gerar email único baseado no ID do Steam
        const email = `steam_${steamId}@phanteongames.com`;
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password: `steam_${steamId}`, // Senha especial para contas Steam
          options: {
            data: {
              steam_id: steamId,
            }
          }
        });

        if (signUpError) {
          throw new Error(`Error creating Steam user account: ${signUpError.message}`);
        }

        // Criar perfil para o novo usuário
        if (signUpData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: signUpData.user.id,
              email,
              steam_id: steamId,
              first_name: steamUser.personaname, // Usar nome do Steam como primeiro nome
              avatar_url: steamUser.avatarfull,
              created_at: new Date().toISOString()
            });

          if (profileError) {
            throw new Error(`Error creating profile: ${profileError.message}`);
          }
        }
      }

      // Obter a sessão atualizada
      const { data: newSessionData, error: newSessionError } = await supabase.auth.getSession();
      
      if (newSessionError) {
        throw new Error(`Error getting updated session: ${newSessionError.message}`);
      }
      
      if (!newSessionData.session?.user) {
        throw new Error('User authentication failed');
      }
      
      // Atualizar o userId para o usuário recém-autenticado
      const userId = newSessionData.session.user.id;

      // Salvar dados do Steam
      const { error: steamAuthError } = await supabase
        .from('steam_auth')
        .upsert({
          user_id: userId,
          steam_id: steamId,
          steam_username: steamUser.personaname,
          avatar_url: steamUser.avatarfull,
          created_at: new Date().toISOString(),
        });

      if (steamAuthError) {
        throw new Error(`Error saving Steam authentication: ${steamAuthError.message}`);
      }

      // Atualizar o perfil com os dados do Steam
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          steam_id: steamId,
          avatar_url: steamUser.avatarfull,
        })
        .eq('id', userId);

      if (profileUpdateError) {
        throw new Error(`Error updating profile with Steam data: ${profileUpdateError.message}`);
      }

      return {
        success: true,
        steamId,
        steamUsername: steamUser.personaname,
      };
    } else {
      // 6. Usuário já está autenticado, só atualizar as informações do Steam
      const userId = sessionData.session.user.id;

      // Salvar dados do Steam
      const { error: steamAuthError } = await supabase
        .from('steam_auth')
        .upsert({
          user_id: userId,
          steam_id: steamId,
          steam_username: steamUser.personaname,
          avatar_url: steamUser.avatarfull,
          created_at: new Date().toISOString(),
        });

      if (steamAuthError) {
        throw new Error(`Error saving Steam authentication: ${steamAuthError.message}`);
      }

      // Atualizar o perfil com os dados do Steam
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          steam_id: steamId,
          avatar_url: steamUser.avatarfull || null,
        })
        .eq('id', userId);

      if (profileUpdateError) {
        throw new Error(`Error updating profile with Steam data: ${profileUpdateError.message}`);
      }

      return {
        success: true,
        steamId,
        steamUsername: steamUser.personaname,
      };
    }
  } catch (error) {
    console.error('Error in Steam authentication:', error);
    throw error;
  }
};