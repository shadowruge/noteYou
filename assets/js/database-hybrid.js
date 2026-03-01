// ===== SISTEMA DE BANCO DE DADOS HÍBRIDO =====
/**
 * Sistema de armazenamento adaptativo que escolhe o melhor método
 * 1. SQLite (preferido) - Banco estruturado local
 * 2. IndexedDB (fallback) - NoSQL local
 * 3. LocalStorage (fallback final) - Simples e universal
 */

class HybridDatabase {
  constructor() {
    this.dbType = null;
    this.db = null;
    this.isInitialized = false;
    this.init();
  }

  /**
   * Inicializa o melhor banco de dados disponível
   */
  async init() {
    try {
      // 1. Tentar SQLite (via wa-sqlite)
      if (await this.initSQLite()) {
        this.dbType = 'sqlite';
        console.log('✅ SQLite inicializado');
        return;
      }

      // 2. Tentar IndexedDB
      if (await this.initIndexedDB()) {
        this.dbType = 'indexeddb';
        console.log('✅ IndexedDB inicializado');
        return;
      }

      // 3. Fallback para localStorage
      this.initLocalStorage();
      this.dbType = 'localstorage';
      console.log('✅ LocalStorage inicializado');

    } catch (error) {
      console.error('Erro ao inicializar banco de dados:', error);
      this.initLocalStorage();
      this.dbType = 'localstorage';
    }

    this.isInitialized = true;
  }

  /**
   * Inicializa SQLite usando wa-sqlite
   */
  async initSQLite() {
    try {
      // Verificar se SQLite está disponível
      if (!window.sqlite3Lib) {
        // Carregar biblioteca SQLite dinamicamente
        await this.loadSQLiteLibrary();
      }

      // Abrir banco de dados
      this.db = new window.sqlite3Lib.oo1.DB('noteyou.db', 'c');
      
      // Criar tabelas
      await this.createSQLiteTables();
      
      return true;
    } catch (error) {
      console.warn('SQLite não disponível:', error);
      return false;
    }
  }

  /**
   * Carrega biblioteca SQLite dinamicamente
   */
  async loadSQLiteLibrary() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/wa-sqlite@0.9.0/dist/wa-sqlite.mjs';
      script.type = 'module';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Cria tabelas SQLite
   */
  async createSQLiteTables() {
    const queries = [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active INTEGER DEFAULT 1
      )`,
      
      `CREATE TABLE IF NOT EXISTS user_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, key)
      )`,
      
      `CREATE TABLE IF NOT EXISTS boards (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        priority TEXT DEFAULT 'medium',
        assignee TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (board_id) REFERENCES boards(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`
    ];

    for (const query of queries) {
      this.db.exec(query);
    }

    // Criar índices para performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);
      CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_board_id ON tasks(board_id);
      CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
    `);
  }

  /**
   * Inicializa IndexedDB
   */
  async initIndexedDB() {
    return new Promise((resolve) => {
      const request = indexedDB.open('NoteYouDB', 1);

      request.onerror = () => {
        console.warn('IndexedDB não disponível');
        resolve(false);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Criar object stores
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('user_data')) {
          db.createObjectStore('user_data', { keyPath: ['user_id', 'key'] });
        }
        if (!db.objectStoreNames.contains('boards')) {
          db.createObjectStore('boards', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Inicializa localStorage (fallback)
   */
  initLocalStorage() {
    this.db = {
      users: {},
      user_data: {},
      boards: {},
      tasks: {},
      notes: {}
    };
  }

  // ===== MÉTODOS UNIVERSAIS =====

  /**
   * Salva dados de forma transparente
   */
  async save(collection, data) {
    if (!this.isInitialized) {
      await this.waitForInit();
    }

    switch (this.dbType) {
      case 'sqlite':
        return this.saveSQLite(collection, data);
      case 'indexeddb':
        return this.saveIndexedDB(collection, data);
      case 'localstorage':
        return this.saveLocalStorage(collection, data);
    }
  }

  /**
   * Carrega dados de forma transparente
   */
  async load(collection, query = {}) {
    if (!this.isInitialized) {
      await this.waitForInit();
    }

    switch (this.dbType) {
      case 'sqlite':
        return this.loadSQLite(collection, query);
      case 'indexeddb':
        return this.loadIndexedDB(collection, query);
      case 'localstorage':
        return this.loadLocalStorage(collection, query);
    }
  }

  /**
   * Remove dados
   */
  async remove(collection, id) {
    if (!this.isInitialized) {
      await this.waitForInit();
    }

    switch (this.dbType) {
      case 'sqlite':
        return this.removeSQLite(collection, id);
      case 'indexeddb':
        return this.removeIndexedDB(collection, id);
      case 'localstorage':
        return this.removeLocalStorage(collection, id);
    }
  }

  // ===== IMPLEMENTAÇÕES ESPECÍFICAS =====

  /**
   * Salva no SQLite
   */
  async saveSQLite(collection, data) {
    const tableName = collection;
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);

    try {
      // Tentar UPDATE primeiro
      const updateQuery = `UPDATE ${tableName} SET ${Object.keys(data).map(key => `${key} = ?`).join(', ')} WHERE id = ?`;
      this.db.exec(updateQuery, [...values.slice(0, -1), values[values.length - 1]]);

      // Se não afetou nenhuma linha, fazer INSERT
      if (this.db.changes() === 0) {
        const insertQuery = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
        this.db.exec(insertQuery, values);
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao salvar no SQLite:', error);
      return { success: false, error };
    }
  }

  /**
   * Carrega do SQLite
   */
  async loadSQLite(collection, query = {}) {
    const tableName = collection;
    let sql = `SELECT * FROM ${tableName}`;
    const params = [];

    if (Object.keys(query).length > 0) {
      const conditions = Object.keys(query).map(key => {
        params.push(query[key]);
        return `${key} = ?`;
      });
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    try {
      const stmt = this.db.prepare(sql);
      const result = [];
      
      while (stmt.step()) {
        result.push(stmt.getAsObject());
      }
      
      stmt.finalize();
      return result;
    } catch (error) {
      console.error('Erro ao carregar do SQLite:', error);
      return [];
    }
  }

  /**
   * Remove do SQLite
   */
  async removeSQLite(collection, id) {
    const tableName = collection;
    try {
      this.db.exec(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
      return { success: true };
    } catch (error) {
      console.error('Erro ao remover do SQLite:', error);
      return { success: false, error };
    }
  }

  /**
   * Salva no IndexedDB
   */
  async saveIndexedDB(collection, data) {
    return new Promise((resolve) => {
      const transaction = this.db.transaction([collection], 'readwrite');
      const store = transaction.objectStore(collection);
      const request = store.put(data);

      request.onsuccess = () => resolve({ success: true });
      request.onerror = () => resolve({ success: false, error: request.error });
    });
  }

  /**
   * Carrega do IndexedDB
   */
  async loadIndexedDB(collection, query = {}) {
    return new Promise((resolve) => {
      const transaction = this.db.transaction([collection], 'readonly');
      const store = transaction.objectStore(collection);
      
      if (Object.keys(query).length === 0) {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve([]);
      } else {
        // Implementar query específico
        const request = store.getAll();
        request.onsuccess = () => {
          const results = request.result.filter(item => {
            return Object.keys(query).every(key => item[key] === query[key]);
          });
          resolve(results);
        };
        request.onerror = () => resolve([]);
      }
    });
  }

  /**
   * Remove do IndexedDB
   */
  async removeIndexedDB(collection, id) {
    return new Promise((resolve) => {
      const transaction = this.db.transaction([collection], 'readwrite');
      const store = transaction.objectStore(collection);
      const request = store.delete(id);

      request.onsuccess = () => resolve({ success: true });
      request.onerror = () => resolve({ success: false, error: request.error });
    });
  }

  /**
   * Salva no localStorage
   */
  async saveLocalStorage(collection, data) {
    try {
      if (!this.db[collection]) {
        this.db[collection] = {};
      }
      this.db[collection][data.id] = data;
      localStorage.setItem(`noteyou_${collection}`, JSON.stringify(this.db[collection]));
      return { success: true };
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
      return { success: false, error };
    }
  }

  /**
   * Carrega do localStorage
   */
  async loadLocalStorage(collection, query = {}) {
    try {
      const stored = localStorage.getItem(`noteyou_${collection}`);
      const data = stored ? JSON.parse(stored) : {};
      
      let results = Object.values(data);
      
      if (Object.keys(query).length > 0) {
        results = results.filter(item => {
          return Object.keys(query).every(key => item[key] === query[key]);
        });
      }
      
      return results;
    } catch (error) {
      console.error('Erro ao carregar do localStorage:', error);
      return [];
    }
  }

  /**
   * Remove do localStorage
   */
  async removeLocalStorage(collection, id) {
    try {
      if (this.db[collection] && this.db[collection][id]) {
        delete this.db[collection][id];
        localStorage.setItem(`noteyou_${collection}`, JSON.stringify(this.db[collection]));
      }
      return { success: true };
    } catch (error) {
      console.error('Erro ao remover do localStorage:', error);
      return { success: false, error };
    }
  }

  /**
   * Espera inicialização completa
   */
  async waitForInit() {
    return new Promise((resolve) => {
      const check = () => {
        if (this.isInitialized) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  /**
   * Retorna informações sobre o banco de dados
   */
  getInfo() {
    return {
      type: this.dbType,
      initialized: this.isInitialized,
      features: this.getFeatures()
    };
  }

  /**
   * Recursos disponíveis por tipo
   */
  getFeatures() {
    switch (this.dbType) {
      case 'sqlite':
        return ['sql', 'transactions', 'indexes', 'relationships', 'constraints'];
      case 'indexeddb':
        return ['nosql', 'transactions', 'indexes', 'versioning'];
      case 'localstorage':
        return ['simple', 'universal', 'sync', 'fallback'];
      default:
        return [];
    }
  }
}

// Instanciar banco de dados híbrido
const hybridDB = new HybridDatabase();

// Exportar para uso global
window.hybridDB = hybridDB;
