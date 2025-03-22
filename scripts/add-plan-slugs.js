// Script para adicionar slugs às tabelas de planos
// Executa uma migração para adicionar e popular a coluna de slug
// Necessário executar com: node scripts/add-plan-slugs.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// URLs e chaves do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

// Validar configuração
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Erro: SUPABASE_URL e SUPABASE_SERVICE_KEY precisam estar definidos em variáveis de ambiente');
  process.exit(1);
}

// Criar cliente Supabase com a chave de serviço para acesso irrestrito
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Mapeamento de nomes de plano para slugs
const PLAN_SLUG_MAPPING = {
  'VIP Plus': 'vip-plus',
  'VIP Premium': 'vip-premium',
  'VIP': 'vip',
  'VIP Básico': 'vip-basic',
  'VIP Basic': 'vip-basic',
  'VIP Starter': 'vip-starter'
};

// Função para slugificar um nome de plano
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[\s+]/g, '-')           // Substitui espaços por hifens
    .replace(/[^\w\-]+/g, '')         // Remove caracteres não-alfanuméricos
    .replace(/\-\-+/g, '-')           // Substitui múltiplos hifens por um único
    .replace(/^-+/, '')               // Remove hifens do início
    .replace(/-+$/, '');              // Remove hifens do fim
}

// Função para verificar se a coluna slug existe
async function checkSlugColumnExists() {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('slug')
      .limit(1);
    
    // Se não houver erro, a coluna existe
    return !error;
  } catch (error) {
    // Erro indica que a coluna não existe
    return false;
  }
}

// Função principal para adicionar slugs
async function addSlugsToPlans() {
  console.log('Iniciando a atualização de slugs nos planos...');
  
  // Verificar se a coluna slug já existe
  const slugColumnExists = await checkSlugColumnExists();
  
  if (!slugColumnExists) {
    console.log('A coluna slug não existe. Executando migração do esquema...');
    
    try {
      // Executar statement SQL para adicionar a coluna
      const { error: alterError } = await supabase.rpc('create_plans_slug_column');
      
      if (alterError) {
        throw new Error(`Erro ao adicionar coluna slug: ${alterError.message}`);
      }
      
      console.log('Coluna slug adicionada com sucesso na tabela plans');
    } catch (error) {
      console.error('Erro ao executar migração do esquema:', error);
      
      // Tentar abordagem alternativa com SQL direto (via function)
      try {
        // Criar uma função SQL temporária para alterar a tabela
        const { error: rpcError } = await supabase.rpc('execute_sql', {
          sql_statement: `
            ALTER TABLE public.plans 
            ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
            
            COMMENT ON COLUMN public.plans.slug IS 'Identificador único simplificado para o plano (ex: vip-plus)';
          `
        });
        
        if (rpcError) {
          throw new Error(`Erro ao executar SQL direto: ${rpcError.message}`);
        }
        
        console.log('Coluna slug adicionada através de SQL direto');
      } catch (directError) {
        console.error('Falha ao adicionar coluna slug diretamente:', directError);
        console.error('Por favor, adicione a coluna manualmente no banco de dados e execute este script novamente.');
        process.exit(1);
      }
    }
  } else {
    console.log('A coluna slug já existe na tabela plans');
  }
  
  // Buscar todos os planos
  const { data: plans, error: fetchError } = await supabase
    .from('plans')
    .select('id, name, slug');
  
  if (fetchError) {
    console.error('Erro ao buscar planos:', fetchError);
    process.exit(1);
  }
  
  console.log(`Encontrados ${plans.length} planos no banco de dados`);
  
  // Atualizar cada plano que não tem slug definido
  let updatedCount = 0;
  
  for (const plan of plans) {
    // Pular se já tiver slug
    if (plan.slug) {
      console.log(`Plano ${plan.name} já possui slug: ${plan.slug}`);
      continue;
    }
    
    // Determinar slug baseado no mapeamento ou gerar um a partir do nome
    const slug = PLAN_SLUG_MAPPING[plan.name] || slugify(plan.name);
    
    // Verificar se este slug já está sendo usado
    const { data: existingSlugs, error: slugCheckError } = await supabase
      .from('plans')
      .select('id')
      .eq('slug', slug)
      .limit(1);
    
    if (slugCheckError) {
      console.error(`Erro ao verificar duplicidade de slug ${slug}:`, slugCheckError);
      continue;
    }
    
    // Se já existe um plano com este slug, adicionar um sufixo único
    let finalSlug = slug;
    if (existingSlugs && existingSlugs.length > 0) {
      finalSlug = `${slug}-${plan.id.substring(0, 6)}`;
    }
    
    // Atualizar o plano com o novo slug
    const { error: updateError } = await supabase
      .from('plans')
      .update({ slug: finalSlug })
      .eq('id', plan.id);
    
    if (updateError) {
      console.error(`Erro ao atualizar slug para plano ${plan.name}:`, updateError);
    } else {
      console.log(`Plano "${plan.name}" atualizado com slug: ${finalSlug}`);
      updatedCount++;
    }
  }
  
  console.log(`Processo concluído. ${updatedCount} planos foram atualizados.`);
  
  // Exibir resumo final
  const { data: updatedPlans, error: finalError } = await supabase
    .from('plans')
    .select('name, slug')
    .order('name');
  
  if (finalError) {
    console.error('Erro ao buscar resumo final:', finalError);
  } else {
    console.log('\nResumo dos planos:');
    updatedPlans.forEach(plan => {
      console.log(`- ${plan.name}: ${plan.slug || 'SEM SLUG'}`);
    });
  }
}

// Executar a função principal e gerenciar o encerramento
addSlugsToPlans()
  .then(() => {
    console.log('Script executado com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erro na execução do script:', error);
    process.exit(1);
  }); 