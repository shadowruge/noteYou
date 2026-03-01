// ===== SISTEMA DE BANCO DE DADOS HÍBRIDO - VERSÃO CORRIGIDA =====
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
      // FORÇAR LOCALSTORAGE IMEDIATO - sem tentar IndexedDB
      this.initLocalStorage();
      this.dbType = 'localstorage';
      this.isInitialized = true;
      
      return;

    } catch (error) {
      console.error('Erro ao inicializar banco de dados:', error);
      this.initLocalStorage();
      this.dbType = 'localstorage';
      this.isInitialized = true;
    }
  }

  /**
   * Inicializa IndexedDB
   */
  async initIndexedDB() {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB não disponível');
        resolve(false);
        return;
      }

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
   * Inicializa localStorage (fallback) - OTIMIZADO PARA VELOCIDADE
   */
  initLocalStorage() {
    // Inicialização instantânea - sem carregar dados existentes para ser mais rápido
    this.db = {
      users: {},
      user_data: {},
      boards: {},
      tasks: {},
      notes: {}
    };
    
    // Dados existentes serão carregados sob demanda
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
      case 'indexeddb':
        return this.removeIndexedDB(collection, id);
      case 'localstorage':
        return this.removeLocalStorage(collection, id);
    }
  }

  // ===== IMPLEMENTAÇÕES ESPECÍFICAS =====

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
   * Carrega do localStorage - OTIMIZADO
   */
  async loadLocalStorage(collection, query = {}) {
    try {
      // Carregar dados desta coleção apenas quando necessário
      if (Object.keys(this.db[collection]).length === 0) {
        const stored = localStorage.getItem(`noteyou_${collection}`);
        this.db[collection] = stored ? JSON.parse(stored) : {};
      }
      
      let results = Object.values(this.db[collection]);
      
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
    // Retorno imediato - localStorage é instantâneo
    if (this.isInitialized) {
      return Promise.resolve();
    }
    
    // Se não estiver inicializado, espera um pouco só por garantia
    return new Promise((resolve) => {
      const check = () => {
        if (this.isInitialized) {
          resolve();
        } else {
          setTimeout(check, 10); // Espera só 10ms, não 100ms
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
      case 'indexeddb':
        return ['nosql', 'transactions', 'indexes', 'versioning'];
      case 'localstorage':
        return ['simple', 'universal', 'sync', 'fallback'];
      default:
        return [];
    }
  }
}

// ===== SISTEMA DE AUTENTICAÇÃO HÍBRIDO =====
/**
 * Sistema de autenticação que funciona com qualquer banco de dados
 * Sem dependências de Firebase ou Google OAuth
 */
class HybridAuthSystem {
  constructor(database) {
    this.db = database;
    this.currentUser = null;
    this.authInitialized = false;
    this.init();
  }

  /**
   * Inicializa o sistema de autenticação
   */
  async init() {
    await this.db.waitForInit();
    
    // Verificar se já existe usuário logado
    const storedUser = localStorage.getItem('noteyou_current_user');
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
        this.authInitialized = true;
        console.log('Usuário restaurado da sessão:', this.currentUser.email);
      } catch (error) {
        console.warn('Sessão inválida, removendo...');
        localStorage.removeItem('noteyou_current_user');
      }
    }
    
    this.authInitialized = true;
  }

  /**
   * Registra um novo usuário
   */
  async register(email, password, name) {
    try {
      // Validações
      if (!email || !password || !name) {
        throw new Error('Todos os campos são obrigatórios');
      }

      if (password.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres');
      }

      if (!email.includes('@')) {
        throw new Error('Email inválido');
      }

      // Verificar se usuário já existe
      const existingUsers = await this.db.load('users', { email: email.toLowerCase() });
      if (existingUsers.length > 0) {
        throw new Error('Este email já está cadastrado');
      }

      // Gerar salt e hash
      const salt = this.generateSalt();
      const hashedPassword = await this.hashPasswordWithSalt(password, salt);

      // Criar usuário
      const user = {
        id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        email: email.toLowerCase(),
        name: name.trim(),
        password_hash: hashedPassword,
        salt: salt,
        created_at: new Date().toISOString(),
        last_login: null,
        is_active: 1
      };

      // Salvar no banco
      const result = await this.db.save('users', user);
      
      if (result.success) {
        return {
          success: true,
          message: 'Usuário criado com sucesso!',
          user: this.sanitizeUser(user)
        };
      } else {
        throw new Error('Erro ao salvar usuário');
      }

    } catch (error) {
      console.error('Erro no registro:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Faz login do usuário
   */
  async login(email, password) {
    try {
      if (!email || !password) {
        throw new Error('Email e senha são obrigatórios');
      }

      // Buscar usuário
      const users = await this.db.load('users', { email: email.toLowerCase() });
      const user = users[0];

      if (!user) {
        throw new Error('Email ou senha incorretos');
      }

      if (!user.is_active) {
        throw new Error('Conta desativada');
      }

      // Verificar senha
      const hashedPassword = await this.hashPasswordWithSalt(password, user.salt);
      if (hashedPassword !== user.password_hash) {
        throw new Error('Email ou senha incorretos');
      }

      // Atualizar último login
      user.last_login = new Date().toISOString();
      await this.db.save('users', user);

      // Salvar sessão
      this.currentUser = this.sanitizeUser(user);
      localStorage.setItem('noteyou_current_user', JSON.stringify(this.currentUser));

      return {
        success: true,
        message: 'Login realizado com sucesso!',
        user: this.currentUser
      };

    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Faz logout do usuário
   */
  async logout() {
    this.currentUser = null;
    localStorage.removeItem('noteyou_current_user');
    
    return {
      success: true,
      message: 'Logout realizado com sucesso!'
    };
  }

  /**
   * Retorna usuário atual
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Verifica se usuário está logado
   */
  isLoggedIn() {
    return this.currentUser !== null;
  }

  /**
   * Remove informações sensíveis do usuário
   */
  sanitizeUser(user) {
    const { password_hash, salt, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Gera salt aleatório
   */
  generateSalt() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array).map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Gera hash SHA-256
   */
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Gera hash com salt
   */
  async hashPasswordWithSalt(password, salt) {
    return await this.hashPassword(password + salt);
  }
}

// Instanciar sistemas
const hybridDB = new HybridDatabase();
const hybridAuth = new HybridAuthSystem(hybridDB);

// Exportar para uso global
window.hybridDB = hybridDB;
window.hybridAuth = hybridAuth;

// SEM INICIALIZAÇÃO AUTOMÁTICA AQUI - já é feito no construtor
