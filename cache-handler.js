// cache-handler.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Criar pasta de cache se não existir
const CACHE_DIR = path.join(process.cwd(), '.next/cache/incremental');

// Melhorar a criação do diretório de cache
function ensureCacheDirectory() {
  if (!fs.existsSync(CACHE_DIR)) {
    try {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    } catch (error) {
      console.error('Error creating cache directory:', error);
      // Fallback para não quebrar o build
      return false;
    }
  }
  return true;
}

function hashKey(key) {
  return crypto.createHash('sha1').update(key).digest('hex');
}

module.exports = class CacheHandler {
  constructor(options) {
    this.options = options || {};
    this.cache = new Map();
    this.isCacheAvailable = ensureCacheDirectory();
  }

  async get(key) {
    // Verifica primeiro na memória para acelerar
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Caso não esteja na memória e o cache estiver disponível, busca no sistema de arquivos
    if (this.isCacheAvailable) {
      const filename = path.join(CACHE_DIR, hashKey(key));
      
      try {
        if (fs.existsSync(filename)) {
          const content = fs.readFileSync(filename, 'utf8');
          try {
            const { value, lastModified } = JSON.parse(content);
            
            // Cache em memória para acesso rápido
            this.cache.set(key, { value, lastModified });
            
            return { value, lastModified };
          } catch (parseError) {
            console.error('Error parsing cache content:', parseError);
            // Se o arquivo estiver corrompido, não quebre o build
            return null;
          }
        }
      } catch (err) {
        console.error('Error reading cache:', err);
      }
    }
    
    return null;
  }

  async set(key, value, lastModified = Date.now()) {
    // Guarda na memória
    this.cache.set(key, { value, lastModified });
    
    // Persiste no sistema de arquivos se disponível
    if (this.isCacheAvailable) {
      const filename = path.join(CACHE_DIR, hashKey(key));
      
      try {
        fs.writeFileSync(
          filename,
          JSON.stringify({ value, lastModified }),
          'utf8'
        );
      } catch (err) {
        console.error('Error writing cache:', err);
        // Continuar sem quebrar o build
      }
    }
    
    return { value, lastModified };
  }
};