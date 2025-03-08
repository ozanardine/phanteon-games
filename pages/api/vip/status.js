// pages/api/vip/status.js
import { getApiUrl, getDefaultHeaders } from '../../../lib/api-config';

/**
 * API route for checking VIP status
 * Proxies requests to the Node.js server
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract Steam ID from query
    const { steamId } = req.query;
    
    // Validate Steam ID format
    if (!steamId || !/^\d{17}$/.test(steamId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Steam ID format'
      });
    }
    
    // Construct the URL for the Node.js server
    const url = `${getApiUrl('/api/vipstatus')}?steamId=${steamId}`;
    
    // Forward the request to the Node.js server
    const response = await fetch(url, {
      method: 'GET',
      headers: getDefaultHeaders(),
    });
    
    // If the response is not OK, throw an error
    if (!response.ok) {
      throw new Error(`Failed to check VIP status (Status: ${response.status})`);
    }
    
    // Parse the response and return it
    const data = await response.json();
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error checking VIP status:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to check VIP status',
      error: error.message 
    });
  }
}