import { supabaseAdmin } from '../../lib/supabase';

// Mapeamento entre UUIDs do banco e IDs do frontend
const planUuidMapping = {
  '0b81cf06-ed81-49ce-8680-8f9d9edc932e': 'vip-basic',
  '3994ff53-f110-4c8f-a492-ad988528006f': 'vip-plus',
  
};

// Configuração de popuarity para cada plano
const popularityMapping = {
  'vip-basic': false,
  'vip-plus': true,
  
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  try {
    // Buscar todos os planos ativos
    const { data: plans, error } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('[API:plans] Erro ao buscar planos:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao buscar planos',
        details: error.message
      });
    }

    // Transformar os planos para o formato esperado pelo frontend
    const formattedPlans = plans.map(plan => {
      // Obter o ID do frontend a partir do UUID
      const frontendId = planUuidMapping[plan.id] || plan.id;
      
      return {
        id: frontendId,
        databaseId: plan.id,
        name: plan.name,
        price: plan.price,
        description: plan.description,
        features: plan.features || [],
        isPopular: popularityMapping[frontendId] || false,
        duration_days: plan.duration_days || 30
      };
    });

    return res.status(200).json({
      success: true,
      plans: formattedPlans
    });
  } catch (error) {
    console.error('[API:plans] Erro no servidor:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      details: error.message 
    });
  }
}