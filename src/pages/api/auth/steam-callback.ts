// src/pages/api/auth/steam-callback.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { validateSteamResponse, getSteamUserInfo } from '@/lib/steam/steamAuth';
import { supabase } from '@/lib/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Convert query parameters to format needed by validator
    const queryParams: Record<string, string> = {};
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        queryParams[key] = req.query[key] as string;
      }
    }

    // Validate the response from Steam
    const steamId = await validateSteamResponse(queryParams);
    
    if (!steamId) {
      return res.status(400).json({ error: 'Invalid Steam authentication response' });
    }

    // Get user details from Steam API
    const steamUser = await getSteamUserInfo(steamId);
    
    if (!steamUser) {
      return res.status(500).json({ error: 'Failed to get Steam user information' });
    }

    // Redirect to the frontend callback page with the necessary parameters
    const callbackUrl = new URL('/auth/steam-callback', process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.host}`);
    
    // Add parameters needed by the frontend
    Object.keys(queryParams).forEach(key => {
      callbackUrl.searchParams.append(key, queryParams[key]);
    });
    
    // Add Steam user info that might be useful
    callbackUrl.searchParams.append('steamId', steamId);
    callbackUrl.searchParams.append('steamUsername', steamUser.personaname);
    
    // Add redirect parameter if present in the original request
    if (req.query.redirect) {
      callbackUrl.searchParams.append('redirect', req.query.redirect as string);
    }

    res.redirect(callbackUrl.toString());
  } catch (error) {
    console.error('Error processing Steam callback:', error);
    res.redirect('/auth/login?error=steam_auth_failed');
  }
}