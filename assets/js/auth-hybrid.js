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
   * Atualiza dados do usuário
   */
  async updateUser(updates) {
    if (!this.currentUser) {
      throw new Error('Usuário não logado');
    }

    try {
      // Buscar usuário completo
      const users = await this.db.load('users', { email: this.currentUser.email });
      const user = users[0];

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Atualizar campos permitidos
      const allowedUpdates = ['name', 'email'];
      for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
          user[key] = updates[key];
        }
      }

      user.updated_at = new Date().toISOString();

      // Salvar no banco
      const result = await this.db.save('users', user);
      
      if (result.success) {
        // Atualizar sessão
        this.currentUser = this.sanitizeUser(user);
        localStorage.setItem('noteyou_current_user', JSON.stringify(this.currentUser));

        return {
          success: true,
          message: 'Usuário atualizado com sucesso!',
          user: this.currentUser
        };
      } else {
        throw new Error('Erro ao atualizar usuário');
      }

    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Altera senha do usuário
   */
  async changePassword(currentPassword, newPassword) {
    if (!this.currentUser) {
      throw new Error('Usuário não logado');
    }

    try {
      // Buscar usuário completo
      const users = await this.db.load('users', { email: this.currentUser.email });
      const user = users[0];

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar senha atual
      const hashedCurrentPassword = await this.hashPasswordWithSalt(currentPassword, user.salt);
      if (hashedCurrentPassword !== user.password_hash) {
        throw new Error('Senha atual incorreta');
      }

      // Validar nova senha
      if (newPassword.length < 6) {
        throw new Error('A nova senha deve ter pelo menos 6 caracteres');
      }

      // Gerar novo salt e hash
      const newSalt = this.generateSalt();
      const hashedNewPassword = await this.hashPasswordWithSalt(newPassword, newSalt);

      // Atualizar senha
      user.password_hash = hashedNewPassword;
      user.salt = newSalt;
      user.updated_at = new Date().toISOString();

      // Salvar no banco
      const result = await this.db.save('users', user);
      
      if (result.success) {
        return {
          success: true,
          message: 'Senha alterada com sucesso!'
        };
      } else {
        throw new Error('Erro ao alterar senha');
      }

    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Lista todos os usuários (admin)
   */
  async listUsers() {
    try {
      const users = await this.db.load('users');
      return users.map(user => this.sanitizeUser(user));
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return [];
    }
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
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
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

  /**
   * Exporta dados do usuário
   */
  async exportUserData() {
    if (!this.currentUser) {
      throw new Error('Usuário não logado');
    }

    try {
      // Carregar todos os dados do usuário
      const userData = await this.db.load('user_data', { user_id: this.currentUser.id });
      const boards = await this.db.load('boards', { user_id: this.currentUser.id });
      const tasks = await this.db.load('tasks', {});
      const notes = await this.db.load('notes', { user_id: this.currentUser.id });

      // Filtrar tasks pertencentes aos boards do usuário
      const userTasks = tasks.filter(task => {
        return boards.some(board => board.id === task.board_id);
      });

      const exportData = {
        user: this.currentUser,
        userData: userData,
        boards: boards,
        tasks: userTasks,
        notes: notes,
        exportedAt: new Date().toISOString(),
        version: '3.0'
      };

      return {
        success: true,
        data: exportData
      };

    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Importa dados do usuário
   */
  async importUserData(importData) {
    if (!this.currentUser) {
      throw new Error('Usuário não logado');
    }

    try {
      // Validar estrutura
      if (!importData.user || !importData.version) {
        throw new Error('Dados de importação inválidos');
      }

      // Importar dados básicos
      if (importData.userData) {
        for (const item of importData.userData) {
          item.user_id = this.currentUser.id;
          await this.db.save('user_data', item);
        }
      }

      if (importData.boards) {
        for (const board of importData.boards) {
          board.user_id = this.currentUser.id;
          board.id = this.generateId(); // Novo ID para evitar conflitos
          await this.db.save('boards', board);
        }
      }

      if (importData.tasks) {
        for (const task of importData.tasks) {
          task.id = this.generateId(); // Novo ID para evitar conflitos
          await this.db.save('tasks', task);
        }
      }

      if (importData.notes) {
        for (const note of importData.notes) {
          note.user_id = this.currentUser.id;
          note.id = this.generateId(); // Novo ID para evitar conflitos
          await this.db.save('notes', note);
        }
      }

      return {
        success: true,
        message: 'Dados importados com sucesso!'
      };

    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Gera ID único
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Retorna estatísticas do usuário
   */
  async getUserStats() {
    if (!this.currentUser) {
      return null;
    }

    try {
      const boards = await this.db.load('boards', { user_id: this.currentUser.id });
      const tasks = await this.db.load('tasks', {});
      const notes = await this.db.load('notes', { user_id: this.currentUser.id });

      // Filtrar tasks pertencentes aos boards do usuário
      const userTasks = tasks.filter(task => {
        return boards.some(board => board.id === task.board_id);
      });

      return {
        boardsCount: boards.length,
        tasksCount: userTasks.length,
        notesCount: notes.length,
        completedTasks: userTasks.filter(task => task.status === 'done').length,
        createdAt: this.currentUser.created_at,
        lastLogin: this.currentUser.last_login
      };

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return null;
    }
  }
}

// Instanciar sistema de autenticação
const hybridAuth = new HybridAuthSystem(hybridDB);

// Exportar para uso global
window.hybridAuth = hybridAuth;
