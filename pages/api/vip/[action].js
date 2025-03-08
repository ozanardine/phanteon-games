// pages/api/vip/[action].js
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { getApiUrl, getDefaultHeaders } from '../../../lib/api-config';

/**
 * API route for VIP actions (add, remove, markdelivered)
 * Proxies requests to the Node.js server with proper authorization
 */
export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    // Verify user authentication (for security)
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }
    
    // Check user role (only admins can perform these actions)
    if (session.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }
    
    // Get the action from the URL
    const { action } = req.query;
    
    // Validate action
    const validActions = ['add', 'remove', 'markdelivered'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid action' 
      });
    }
    
    // Map action to endpoint
    const endpointMap = {
      'add': '/api/addvip',
      'remove': '/api/removevip',
      'markdelivered': '/api/vip/markdelivered'
    };
    
    // Get the endpoint
    const endpoint = endpointMap[action];
    
    // Forward the request to the Node.js server
    const response = await fetch(getApiUrl(endpoint), {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify(req.body)
    });
    
    // If the response is not OK, throw an error
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `VIP action failed (Status: ${response.status})`);
    }
    
    // Parse the response and return it
    const data = await response.json();
    
    return res.status(200).json(data);
  } catch (error) {
    console.error(`Error performing VIP action:`, error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to perform VIP action',
      error: error.message 
    });
  }
}