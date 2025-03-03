import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import mercadopago from 'mercadopago';

// Configurar SDK do Mercado Pago
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Extrair ID do pagamento da query
    const { payment_id } = req.query;

    if (!payment_id) {
      return res.status(400).json({ error: 'ID do pagamento não informado' });
    }

    // Buscar pagamento no banco de dados
    const { data: paymentRecord, error: dbError } = await supabase
      .from('payments')
      .select('*')
      .eq('payment_id', payment_id.toString())
      .eq('user_id', session.user.id)
      .single();

    // Se já temos o registro, usar o status dele
    if (paymentRecord) {
      return res.status(200).json({ status: paymentRecord.status });
    }

    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Database error fetching payment:', dbError);
      return res.status(500).json({ error: 'Erro ao verificar pagamento' });
    }

    // Buscar detalhes do pagamento no Mercado Pago
    const payment = await mercadopago.payment.get(payment_id as string);

    if (!payment || !payment.body) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    // Mapear status do Mercado Pago para nosso formato
    const mpStatus = payment.body.status;
    let status = 'pending';

    if (mpStatus === 'approved') {
      status = 'completed';
    } else if (mpStatus === 'rejected') {
      status = 'failed';
    }

    return res.status(200).json({ status });

  } catch (error) {
    console.error('Error checking payment status:', error);
    return res.status(500).json({ error: 'Erro ao verificar status do pagamento' });
  }
}