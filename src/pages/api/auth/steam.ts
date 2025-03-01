// src/pages/api/auth/steam.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSteamAuthUrl } from '@/lib/steam/steamAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the Steam OpenID authentication URL
    const authUrl = getSteamAuthUrl();
    
    // Redirect to the Steam authentication page
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error generating Steam auth URL:', error);
    return res.status(500).json({ error: 'Error generating Steam auth URL' });
  }
}