/**
 * Funções para interagir com o servidor Rust via RCON ou API
 */

// Configuração
const RUST_API_KEY = process.env.RUST_API_KEY;
const RUST_API_URL = process.env.RUST_API_URL;
const RUST_SERVER_IP = process.env.RUST_SERVER_IP;
const RUST_RCON_PORT = process.env.RUST_RCON_PORT;
const RUST_RCON_PASSWORD = process.env.RUST_RCON_PASSWORD;

/**
 * Adiciona permissões VIP para um jogador no servidor Rust
 * @param {string} steamId - SteamID do jogador
 * @param {number} days - Número de dias para a assinatura
 * @returns {Promise<boolean>} - Sucesso da operação
 */
export async function addVipPermissions(steamId, days = 30) {
  try {
    // Método API - substitua esta implementação se estiver usando RCON diretamente
    const response = await fetch(`${RUST_API_URL}/addvip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RUST_API_KEY}`
      },
      body: JSON.stringify({ 
        steamId, 
        days,
        server: RUST_SERVER_IP
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Erro ao adicionar permissões VIP:', error);
      return false;
    }
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Erro ao adicionar permissões VIP:', error);
    return false;
  }
}

/**
 * Remove permissões VIP de um jogador no servidor Rust
 * @param {string} steamId - SteamID do jogador
 * @returns {Promise<boolean>} - Sucesso da operação
 */
export async function removeVipPermissions(steamId) {
  try {
    // Método API - substitua esta implementação se estiver usando RCON diretamente
    const response = await fetch(`${RUST_API_URL}/removevip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RUST_API_KEY}`
      },
      body: JSON.stringify({ 
        steamId,
        server: RUST_SERVER_IP
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Erro ao remover permissões VIP:', error);
      return false;
    }
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Erro ao remover permissões VIP:', error);
    return false;
  }
}

/**
 * Verifica o status VIP de um jogador no servidor Rust
 * @param {string} steamId - SteamID do jogador
 * @returns {Promise<Object>} - Status VIP do jogador
 */
export async function checkVipStatus(steamId) {
  try {
    const response = await fetch(`${RUST_API_URL}/vipstatus?steamId=${steamId}&server=${RUST_SERVER_IP}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RUST_API_KEY}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Erro ao verificar status VIP:', error);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao verificar status VIP:', error);
    return null;
  }
}