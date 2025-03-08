// pages/api/players.js
import { getApiUrl, getDefaultHeaders } from '../../lib/api-config';

/**
 * API route for getting player data and leaderboards
 * Proxies requests to the Node.js server
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract query parameters
    const { limit = 20, sortBy = 'kills', steamId } = req.query;
    
    // Validate sortBy parameter
    const validSortFields = ['kills', 'deaths', 'headshots', 'time_played', 'suicides'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'kills';
    
    // Construct the URL for the Node.js server
    let url = `${getApiUrl('/api/public/players')}?limit=${limit}&sortBy=${orderField}`;
    if (steamId) {
      // Validate Steam ID format
      if (!/^\d{17}$/.test(steamId)) {
        return res.status(400).json({ error: 'Invalid Steam ID format' });
      }
      url += `&steamId=${steamId}`;
    }
    
    // Forward the request to the Node.js server
    const response = await fetch(url, {
      method: 'GET',
      headers: getDefaultHeaders(),
    });
    
    // If the response is not OK, throw an error
    if (!response.ok) {
      throw new Error(`Failed to fetch player data (Status: ${response.status})`);
    }
    
    // Parse the response and return it
    const data = await response.json();
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching player data:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch player data',
      message: error.message 
    });
  }
}