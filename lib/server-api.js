// lib/server-api.js
import apiService from './api-service';

/**
 * API service specific to server-related operations
 */
class ServerApi {
  /**
   * Fetch all server statistics
   * @returns {Promise<Object>} Server statistics
   */
  async getServerStats() {
    return apiService.get('/api/public/serverstats');
  }
  
  /**
   * Fetch statistics for a specific server
   * @param {string} serverId - ID of the server
   * @returns {Promise<Object>} Server statistics
   */
  async getServerById(serverId) {
    return apiService.get(`/api/public/serverstats/${serverId}`);
  }
  
  /**
   * Fetch recent events for all servers
   * @param {Object} options - Query options (limit, serverId, eventType)
   * @returns {Promise<Object>} Server events
   */
  async getServerEvents(options = {}) {
    const { limit = 20, serverId, eventType } = options;
    
    let endpoint = `/api/public/events?limit=${limit}`;
    if (serverId) endpoint += `&serverId=${serverId}`;
    if (eventType) endpoint += `&eventType=${eventType}`;
    
    return apiService.get(endpoint);
  }
  
  /**
   * Fetch player leaderboard
   * @param {Object} options - Query options (limit, sortBy, steamId)
   * @returns {Promise<Object>} Player data
   */
  async getPlayers(options = {}) {
    const { limit = 20, sortBy = 'kills', steamId } = options;
    
    let endpoint = `/api/public/players?limit=${limit}&sortBy=${sortBy}`;
    if (steamId) endpoint += `&steamId=${steamId}`;
    
    return apiService.get(endpoint);
  }

  /**
   * Send a heartbeat to the server to maintain connection
   * @param {string} serverId - ID of the server
   * @param {number} players - Current player count
   * @returns {Promise<Object>} Heartbeat response
   */
  async sendHeartbeat(serverId, players) {
    return apiService.post('/api/heartbeat', {
      serverId,
      players,
      timestamp: new Date().toISOString()
    });
  }
}

// Create a singleton instance
const serverApi = new ServerApi();

export default serverApi;