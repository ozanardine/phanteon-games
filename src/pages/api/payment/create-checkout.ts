// src/pages/api/payment/create-checkout.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createPaymentPreference } from '../../../lib/payment/mercadoPagoClient';
import { createPayment } from '../../../lib/payment/paypalClient';
import { supabase } from '../../../lib/supabase/client';
import { CreateCheckoutResponse } from '../../../types/payment';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get request data
    const { 
      successUrl,
      cancelUrl,
      customerEmail,
      customerName,
      provider = 'mercadopago',  // Default provider
    } = req.body;
    
    // Validate required data
    if (!successUrl || !cancelUrl) {
      return res.status(400).json({
        success: false,
        error: 'Incomplete data for checkout creation'
      });
    }
    
    // Get authenticated user from session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return res.status(401).json({
        success: false,
        error: 'Failed to get user session'
      });
    }
    
    if (!sessionData.session?.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const userId = sessionData.session.user.id;
    
    let checkoutUrl: string | null = null;
    
    // Create checkout with appropriate provider
    switch (provider) {
      case 'mercadopago':
        // Create preference for one-time payment
        checkoutUrl = await createPaymentPreference({
          userId,
          successUrl,
          cancelUrl,
          customerEmail,
          customerName
        });
        break;
      
      case 'paypal':
        // Create one-time PayPal payment
        checkoutUrl = await createPayment({
          userId,
          successUrl,
          cancelUrl,
          customerEmail
        });
        break;
      
      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported payment provider'
        });
    }
    
    // Check if checkout URL was successfully generated
    if (!checkoutUrl) {
      return res.status(500).json({
        success: false,
        error: 'Could not create checkout session'
      });
    }
    
    // Register checkout attempt in database
    const { error: dbError } = await supabase
      .from('checkout_attempts')
      .insert({
        user_id: userId,
        payment_provider: provider,
        payment_method: 'onetime',
        created_at: new Date().toISOString()
      });
    
    if (dbError) {
      console.error('Error registering checkout attempt:', dbError);
      // Continue even with error in registration
    }
    
    // Return checkout URL for redirection
    const response: CreateCheckoutResponse = {
      success: true,
      url: checkoutUrl
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error creating checkout:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal error processing checkout request'
    });
  }
}