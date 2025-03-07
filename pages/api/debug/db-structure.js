import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  // Apenas permitir solicitações GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Obter a estrutura do banco de dados
    const schemas = [];
    
    // Buscar todas as tabelas públicas
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    if (tablesError) {
      return res.status(500).json({ 
        message: 'Erro ao buscar tabelas', 
        error: tablesError 
      });
    }
    
    // Para cada tabela, buscar suas colunas
    const tableDetails = [];
    
    for (const table of tables) {
      const tableName = table.table_name;
      
      // Buscar colunas da tabela
      const { data: columns, error: columnsError } = await supabaseAdmin
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', tableName);
        
      if (columnsError) {
        return res.status(500).json({ 
          message: `Erro ao buscar colunas para tabela ${tableName}`, 
          error: columnsError 
        });
      }
      
      // Buscar políticas RLS para esta tabela
      const { data: policies, error: policiesError } = await supabaseAdmin
        .rpc('get_policies_for_table', { table_name: tableName });
        
      tableDetails.push({
        table_name: tableName,
        columns: columns,
        policies: policies || []
      });
    }
    
    return res.status(200).json({
      tables: tableDetails
    });
  } catch (error) {
    console.error('Erro ao buscar estrutura do banco de dados:', error);
    return res.status(500).json({ 
      message: 'Erro ao buscar estrutura do banco de dados', 
      error: error.message 
    });
  }
}
