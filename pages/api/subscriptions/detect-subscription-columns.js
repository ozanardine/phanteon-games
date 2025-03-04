import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Buscar colunas da tabela de assinaturas
    const { data: columns, error } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'subscriptions');
      
    if (error) {
      return res.status(500).json({ 
        message: 'Erro ao buscar colunas da tabela de assinaturas', 
        error 
      });
    }
    
    // Ordenar colunas alfabeticamente para facilitar a leitura
    columns.sort((a, b) => a.column_name.localeCompare(b.column_name));
    
    // Retornar as colunas
    return res.status(200).json({
      columns,
      columnNames: columns.map(col => col.column_name)
    });
  } catch (error) {
    console.error('Erro:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor', 
      error: error.message 
    });
  }
}
