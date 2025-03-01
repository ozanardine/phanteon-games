import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;

  if (code) {
    try {
      await supabase.auth.exchangeCodeForSession(String(code));
      res.redirect('/dashboard');
    } catch (error) {
      console.error('Error exchanging code for session:', error);
      res.redirect('/login?error=callback_error');
    }
  } else {
    res.redirect('/login?error=no_code');
  }
}