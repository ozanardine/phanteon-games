// pages/api/server-events.js
import { getApiUrl, getDefaultHeaders } from '../../lib/api-config';

/**
 * API route for getting server events
 * Proxies requests to the Node.js server
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract query parameters
    const { limit = 20, serverId, eventType } = req.query;
    
    // Construct the URL for the Node.js server
    let url = `${getApiUrl('/api/public/events')}?limit=${limit}`;
    if (serverId) url += `&serverId=${serverId}`;
    if (eventType) url += `&eventType=${eventType}`;
    
    // Forward the request to the Node.js server
    const response = await fetch(url, {
      method: 'GET',
      headers: getDefaultHeaders(),
    });
    
    // If the response is not OK, throw an error
    if (!response.ok) {
      throw new Error(`Failed to fetch server events (Status: ${response.status})`);
    }
    
    // Parse the response and return it
    const data = await response.json();
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching server events:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch server events',
      message: error.message 
    });
  }
}