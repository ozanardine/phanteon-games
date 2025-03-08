// lib/vip-api.js
import apiService from './api-service';

/**
 * API service specific to VIP-related operations
 */
class VipApi {
  /**
   * Check VIP status for a player
   * @param {string} steamId - Steam ID of the player
   * @returns {Promise<Object>} VIP status information
   */
  async checkVipStatus(steamId) {
    if (!steamId || !/^\d{17}$/.test(steamId)) {
      return {
        success: false,
        message: 'Invalid Steam ID format'
      };
    }
    
    return apiService.get(`/api/vipstatus?steamId=${steamId}`);
  }
  
  /**
   * Add VIP permissions for a player
   * @param {string} steamId - Steam ID of the player
   * @param {number} days - Duration in days (default: 30)
   * @param {string} server - Server identifier (optional)
   * @returns {Promise<Object>} Result of the operation
   */
  async addVipPermissions(steamId, days = 30, server = '') {
    if (!steamId || !/^\d{17}$/.test(steamId)) {
      return {
        success: false,
        message: 'Invalid Steam ID format'
      };
    }
    
    return apiService.post('/api/addvip', {
      steamId,
      days,
      server
    });
  }
  
  /**
   * Remove VIP permissions for a player
   * @param {string} steamId - Steam ID of the player
   * @param {string} server - Server identifier (optional)
   * @returns {Promise<Object>} Result of the operation
   */
  async removeVipPermissions(steamId, server = '') {
    if (!steamId || !/^\d{17}$/.test(steamId)) {
      return {
        success: false,
        message: 'Invalid Steam ID format'
      };
    }
    
    return apiService.post('/api/removevip', {
      steamId,
      server
    });
  }
  
  /**
   * Mark VIP items as delivered for a player
   * @param {string} steamId - Steam ID of the player
   * @returns {Promise<Object>} Result of the operation
   */
  async markItemsDelivered(steamId) {
    if (!steamId || !/^\d{17}$/.test(steamId)) {
      return {
        success: false,
        message: 'Invalid Steam ID format'
      };
    }
    
    return apiService.post('/api/vip/markdelivered', {
      steamId
    });
  }
}

// Create a singleton instance
const vipApi = new VipApi();

export default vipApi;