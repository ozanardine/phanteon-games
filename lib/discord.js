/**
 * Funções para interagir com a API do Discord
 * Utiliza Bot Token para gerenciar roles dos usuários
 */

const DISCORD_API_ENDPOINT = 'https://discord.com/api/v10';
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID;

// Mapeamento de planos para IDs de roles
const DISCORD_VIP_ROLES = {
  'vip-basic': process.env.DISCORD_VIP_BASIC_ROLE_ID,
  'vip-plus': process.env.DISCORD_VIP_PLUS_ROLE_ID
};

/**
 * Adiciona cargo VIP para um usuário no Discord
 * @param {string} discordUserId - ID do usuário no Discord
 * @param {string} planId - ID do plano VIP ('vip-basic' ou 'vip-plus')
 * @returns {Promise<boolean>} - Sucesso da operação
 */
export async function addVipRole(discordUserId, planId = 'vip-basic') {
  if (!discordUserId) {
    console.error('[Discord] ID de usuário inválido');
    return false;
  }

  try {
    console.log(`[Discord] Adicionando cargo VIP (${planId}) para usuário: ${discordUserId}`);
    
    // Validar configuração
    if (!DISCORD_BOT_TOKEN || !DISCORD_SERVER_ID) {
      console.error('[Discord] Configuração de integração Discord incompleta');
      return false;
    }

    // Obter o ID do cargo com base no plano
    const roleId = DISCORD_VIP_ROLES[planId] || DISCORD_VIP_ROLES['vip-basic'];
    
    if (!roleId) {
      console.error(`[Discord] ID de cargo não encontrado para plano ${planId}`);
      return false;
    }

    const response = await fetch(
      `${DISCORD_API_ENDPOINT}/guilds/${DISCORD_SERVER_ID}/members/${discordUserId}/roles/${roleId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Status 204 No Content é sucesso nessa API
    if (response.status === 204) {
      console.log(`[Discord] Cargo VIP (${planId}) adicionado com sucesso para: ${discordUserId}`);
      return true;
    }
    
    if (!response.ok) {
      let errorMessage = `Status: ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch (e) {}
      
      console.error(`[Discord] Erro ao adicionar cargo VIP: ${errorMessage}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[Discord] Exceção ao adicionar cargo VIP:', error);
    return false;
  }
}

/**
 * Remove todos os cargos VIP de um usuário no Discord
 * @param {string} discordUserId - ID do usuário no Discord
 * @returns {Promise<boolean>} - Sucesso da operação
 */
export async function removeVipRole(discordUserId) {
  if (!discordUserId) {
    console.error('[Discord] ID de usuário inválido');
    return false;
  }

  try {
    console.log(`[Discord] Removendo cargos VIP para usuário: ${discordUserId}`);
    
    // Validar configuração
    if (!DISCORD_BOT_TOKEN || !DISCORD_SERVER_ID) {
      console.error('[Discord] Configuração de integração Discord incompleta');
      return false;
    }

    let success = true;
    
    // Remover cada cargo VIP
    for (const [planId, roleId] of Object.entries(DISCORD_VIP_ROLES)) {
      console.log(`[Discord] Removendo cargo ${planId} (${roleId}) para usuário ${discordUserId}`);
      
      const response = await fetch(
        `${DISCORD_API_ENDPOINT}/guilds/${DISCORD_SERVER_ID}/members/${discordUserId}/roles/${roleId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Status 204 No Content é sucesso nessa API
      // Status 404 também pode ser considerado "sucesso" se o usuário não tiver o cargo
      if (response.status === 204 || response.status === 404) {
        console.log(`[Discord] Cargo ${planId} removido com sucesso (ou não existia) para: ${discordUserId}`);
      } else {
        success = false;
        console.error(`[Discord] Erro ao remover cargo ${planId}: Status ${response.status}`);
      }
    }
    
    return success;
  } catch (error) {
    console.error('[Discord] Exceção ao remover cargos VIP:', error);
    return false;
  }
}

/**
 * Obtém informações de um usuário no Discord
 * @param {string} discordUserId - ID do usuário no Discord
 * @returns {Promise<Object>} - Dados do usuário
 */
export async function getUserInfo(discordUserId) {
  if (!discordUserId) {
    console.error('[Discord] ID de usuário inválido');
    return null;
  }

  try {
    console.log(`[Discord] Obtendo informações para usuário: ${discordUserId}`);
    
    // Validar configuração
    if (!DISCORD_BOT_TOKEN) {
      console.error('[Discord] Token de bot não configurado');
      return null;
    }

    const response = await fetch(
      `${DISCORD_API_ENDPOINT}/users/${discordUserId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      let errorMessage = `Status: ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch (e) {}
      
      console.error(`[Discord] Erro ao obter informações do usuário: ${errorMessage}`);
      return null;
    }
    
    const userData = await response.json();
    console.log(`[Discord] Informações obtidas com sucesso para: ${discordUserId}`);
    return userData;
  } catch (error) {
    console.error('[Discord] Exceção ao obter informações do usuário:', error);
    return null;
  }
}