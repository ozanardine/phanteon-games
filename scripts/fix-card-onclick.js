/**
 * Script para verificar e corrigir problemas de onClick nos componentes Card
 * 
 * Uso:
 * 1. Copie este script em scripts/fix-card-onclick.js
 * 2. Execute com Node.js: node scripts/fix-card-onclick.js
 */

const fs = require('fs');
const path = require('path');

// Diretórios a serem verificados
const directories = [
  'src/components/servers',
  'src/components/vip',
  'src/components/dashboard',
  'src/components/common'
];

// Expressão regular para encontrar Card com onClick
const cardOnClickRegex = /<Card[^>]*\bonClick\s*=\s*{[^}]+}[^>]*>/g;

// Verificar e corrigir um arquivo
function checkAndFixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar se o arquivo contém Card com onClick
    if (cardOnClickRegex.test(content)) {
      console.log(`Encontrado problema em: ${filePath}`);
      
      // Analisar o código e aplicar a correção
      const fixed = applyFix(content);
      
      // Criar backup do arquivo original
      fs.writeFileSync(`${filePath}.backup`, content);
      
      // Salvar arquivo corrigido
      fs.writeFileSync(filePath, fixed);
      
      console.log(`Corrigido: ${filePath} (backup criado em ${filePath}.backup)`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Erro ao processar ${filePath}:`, error);
    return false;
  }
}

// Aplicar a correção no conteúdo do arquivo
function applyFix(content) {
  // Esta é uma abordagem simplificada - em casos reais,
  // seria melhor usar um parser de JSX/TSX para fazer alterações mais precisas
  
  // Padrão: <Card ... onClick={handler} ...>
  // Transformação: <div onClick={handler}><Card ...>
  
  // Etapa 1: Identificar os Cards com onClick
  const matches = content.match(cardOnClickRegex);
  
  if (!matches) return content;
  
  let fixed = content;
  
  for (const match of matches) {
    // Extrair o handler do onClick
    const onClickMatch = match.match(/onClick\s*=\s*{([^}]+)}/);
    if (!onClickMatch) continue;
    
    const handler = onClickMatch[1];
    
    // Remover onClick do Card
    const cardWithoutOnClick = match.replace(/\bonClick\s*=\s*{[^}]+}/, '');
    
    // Criar um wrapper div com o onClick
    const replacement = `<div onClick={${handler}} className="h-full">${cardWithoutOnClick}`;
    
    // Substituir no conteúdo
    fixed = fixed.replace(match, replacement);
    
    // Adicionar </div> de fechamento após o </Card>
    const closingCardRegex = new RegExp(`${cardWithoutOnClick.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?<\\/Card>`, 'g');
    const closingCardMatch = closingCardRegex.exec(fixed);
    
    if (closingCardMatch) {
      const closingTag = closingCardMatch[0];
      fixed = fixed.replace(closingTag, `${closingTag}</div>`);
    }
  }
  
  return fixed;
}

// Processar um diretório recursivamente
function processDirectory(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx')) {
      checkAndFixFile(fullPath);
    }
  }
}

// Função principal
function main() {
  console.log('Iniciando verificação de componentes Card com onClick...');
  
  let fixedCount = 0;
  
  for (const directory of directories) {
    if (fs.existsSync(directory)) {
      processDirectory(directory);
    } else {
      console.warn(`Diretório não encontrado: ${directory}`);
    }
  }
  
  console.log(`\nVerificação concluída. ${fixedCount} arquivo(s) corrigidos.`);
  
  if (fixedCount > 0) {
    console.log('\nCorrigido com sucesso! Agora tente executar o build novamente:');
    console.log('npm run build');
  } else {
    console.log('\nNenhum problema encontrado nos arquivos verificados.');
  }
}

// Executar o script
main();