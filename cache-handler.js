// cache-handler.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Criar pasta de cache se não existir
const CACHE_DIR = path.join(process.cwd(), '.next/cache/incremental');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function hashKey(key) {
  return crypto.createHash('sha1').update(key).digest('hex');
}

module.exports = class CacheHandler {
  constructor(options) {
    this.options = options || {};
    this.cache = new Map();
  }

  async get(key) {
    // Verifica primeiro na memória para acelerar
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Caso não esteja na memória, busca no sistema de arquivos
    const filename = path.join(CACHE_DIR, hashKey(key));
    
    try {
      if (fs.existsSync(filename)) {
        const content = fs.readFileSync(filename, 'utf8');
        const { value, lastModified } = JSON.parse(content);
        
        // Cache em memória para acesso rápido
        this.cache.set(key, { value, lastModified });
        
        return { value, lastModified };
      }
    } catch (err) {
      console.error('Error reading cache:', err);
    }
    
    return null;
  }

  async set(key, value, lastModified = Date.now()) {
    // Guarda na memória
    this.cache.set(key, { value, lastModified });
    
    // Persiste no sistema de arquivos
    const filename = path.join(CACHE_DIR, hashKey(key));
    
    try {
      fs.writeFileSync(
        filename,
        JSON.stringify({ value, lastModified }),
        'utf8'
      );
    } catch (err) {
      console.error('Error writing cache:', err);
    }
    
    return { value, lastModified };
  }
};