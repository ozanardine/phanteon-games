import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  // Apenas método POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  // Verificação de segurança simples (na produção, use autenticação mais robusta)
  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.RUST_API_KEY) {
    return res.status(401).json({ success: false, message: 'Não autorizado' });
  }

  try {
    // Verificar se a tabela já existe
    const { data: existingTable, error: checkError } = await supabaseAdmin
      .from('webhook_validation_issues')
      .select('id')
      .limit(1);

    if (!checkError) {
      // Tabela já existe
      return res.status(200).json({ success: true, message: 'Tabela já existe', created: false });
    }

    // Criar tabela para logs de validação de webhook
    const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.webhook_validation_issues (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          issue_type TEXT NOT NULL,
          headers JSONB,
          body JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          resolved BOOLEAN DEFAULT FALSE,
          notes TEXT
        );
        
        -- Adicionar índice para pesquisa por tipo de problema
        CREATE INDEX IF NOT EXISTS webhook_validation_issues_issue_type_idx 
        ON public.webhook_validation_issues (issue_type);
        
        -- Adicionar índice para pesquisa por data
        CREATE INDEX IF NOT EXISTS webhook_validation_issues_created_at_idx 
        ON public.webhook_validation_issues (created_at);
        
        -- Adicionar política de acesso (apenas admin)
        ALTER TABLE public.webhook_validation_issues ENABLE ROW LEVEL SECURITY;
        
        -- Permitir acesso para serviço de webhook
        CREATE POLICY webhook_insert_policy ON public.webhook_validation_issues
        FOR INSERT TO service_role
        WITH CHECK (true);
        
        -- Permitir acesso para administradores
        CREATE POLICY admin_select_policy ON public.webhook_validation_issues
        FOR SELECT TO authenticated
        USING (auth.uid() IN (
          SELECT user_id FROM public.admin_users WHERE is_active = true
        ));
      `
    });

    if (createError) {
      console.error('Erro ao criar tabela:', createError);
      return res.status(500).json({ success: false, message: 'Erro ao criar tabela', error: createError.message });
    }

    return res.status(200).json({ success: true, message: 'Tabela criada com sucesso', created: true });
  } catch (error) {
    console.error('Erro ao criar tabela:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
  }
} 