/**
 * Funções para interagir com a API do Discord
 * Utiliza Bot Token para gerenciar roles dos usuários
 */

const DISCORD_API_ENDPOINT = 'https://discord.com/api/v10';
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID;
const DISCORD_VIP_ROLE_ID = process.env.DISCORD_VIP_ROLE_ID;

/**
 * Adiciona cargo VIP para um usuário no Discord
 * @param {string} discordUserId - ID do usuário no Discord
 * @returns {Promise<boolean>} - Sucesso da operação
 */
export async function addVipRole(discordUserId) {
  try {
    const response = await fetch(
      `${DISCORD_API_ENDPOINT}/guilds/${DISCORD_SERVER_ID}/members/${discordUserId}/roles/${DISCORD_VIP_ROLE_ID}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok && response.status !== 204) {
      const error = await response.json();
      console.error('Erro ao adicionar cargo VIP:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao adicionar cargo VIP:', error);
    return false;
  }
}

/**
 * Remove cargo VIP de um usuário no Discord
 * @param {string} discordUserId - ID do usuário no Discord
 * @returns {Promise<boolean>} - Sucesso da operação
 */
export async function removeVipRole(discordUserId) {
  try {
    const response = await fetch(
      `${DISCORD_API_ENDPOINT}/guilds/${DISCORD_SERVER_ID}/members/${discordUserId}/roles/${DISCORD_VIP_ROLE_ID}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok && response.status !== 204) {
      const error = await response.json();
      console.error('Erro ao remover cargo VIP:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao remover cargo VIP:', error);
    return false;
  }
}

/**
 * Obtém informações de um usuário no Discord
 * @param {string} discordUserId - ID do usuário no Discord
 * @returns {Promise<Object>} - Dados do usuário
 */
export async function getUserInfo(discordUserId) {
  try {
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
      const error = await response.json();
      console.error('Erro ao obter informações do usuário:', error);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao obter informações do usuário:', error);
    return null;
  }
}