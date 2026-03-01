// ===== SISTEMA DE MIGRAÇÃO AUTOMÁTICA =====
/**
 * Migra automática dados do sistema antigo para o novo sistema híbrido
 * Preserva todos os dados existentes durante a atualização
 */

class DataMigrationSystem {
  constructor(hybridDB, hybridAuth) {
    this.db = hybridDB;
    this.auth = hybridAuth;
    this.migrationCompleted = false;
  }

  /**
   * Verifica se há dados antigos para migrar
   */
  async checkForMigration() {
    try {
      // Verificar se já foi migrado
      if (localStorage.getItem('noteyou_migration_completed')) {
        console.log('✅ Migração já foi concluída anteriormente');
        return false;
      }

      // Verificar se existem dados antigos
      const oldData = localStorage.getItem('noteyou_v3_state');
      const oldUsers = localStorage.getItem('noteyou_local_users');
      const oldCurrentUser = localStorage.getItem('noteyou_current_user');

      const hasOldData = !!(oldData || oldUsers || oldCurrentUser);
      
      if (hasOldData) {
        console.log('🔄 Dados antigos encontrados, iniciando migração...');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao verificar migração:', error);
      return false;
    }
  }

  /**
   * Executa a migração completa dos dados
   */
  async migrate() {
    try {
      if (this.migrationCompleted) {
        return { success: true, message: 'Migração já concluída' };
      }

      console.log('🚀 Iniciando migração de dados...');

      // 1. Migrar usuários locais
      await this.migrateUsers();

      // 2. Migrar dados do aplicativo
      await this.migrateAppData();

      // 3. Marcar migração como concluída
      localStorage.setItem('noteyou_migration_completed', new Date().toISOString());
      this.migrationCompleted = true;

      console.log('✅ Migração concluída com sucesso!');
      
      return {
        success: true,
        message: 'Migração concluída com sucesso!',
        migratedItems: this.getMigratedItems()
      };

    } catch (error) {
      console.error('❌ Erro na migração:', error);
      return {
        success: false,
        message: 'Erro durante a migração: ' + error.message
      };
    }
  }

  /**
   * Migra usuários do sistema antigo
   */
  async migrateUsers() {
    try {
      const oldUsers = localStorage.getItem('noteyou_local_users');
      
      if (!oldUsers) {
        console.log('📝 Nenhum usuário antigo encontrado');
        return;
      }

      const users = JSON.parse(oldUsers);
      let migratedUsers = 0;

      for (const [email, userData] of Object.entries(users)) {
        try {
          // Verificar se usuário já existe no novo sistema
          const existingUsers = await this.db.load('users', { email: email.toLowerCase() });
          
          if (existingUsers.length === 0) {
            // Migrar usuário para o novo formato
            const migratedUser = {
              id: userData.id || 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
              email: email.toLowerCase(),
              name: userData.name || 'Usuário Migrado',
              password_hash: userData.password || '',
              salt: userData.salt || '',
              created_at: userData.createdAt || new Date().toISOString(),
              last_login: userData.lastLogin || null,
              is_active: userData.isActive !== false ? 1 : 0,
              migrated_from_old_system: true,
              migration_date: new Date().toISOString()
            };

            await this.db.save('users', migratedUser);
            migratedUsers++;
          }
        } catch (error) {
          console.warn(`Erro ao migrar usuário ${email}:`, error);
        }
      }

      console.log(`👥 ${migratedUsers} usuários migrados com sucesso`);
    } catch (error) {
      console.error('Erro ao migrar usuários:', error);
      throw error;
    }
  }

  /**
   * Migra dados do aplicativo (boards, tasks, notes)
   */
  async migrateAppData() {
    try {
      const oldData = localStorage.getItem('noteyou_v3_state');
      
      if (!oldData) {
        console.log('📝 Nenhum dado de aplicativo antigo encontrado');
        return;
      }

      const appData = JSON.parse(oldData);
      let migratedItems = 0;

      // Migrar boards
      if (appData.boards) {
        for (const board of Object.values(appData.boards)) {
          try {
            const migratedBoard = {
              id: board.id || 'board_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
              user_id: this.getCurrentUserId() || 'migrated_user',
              name: board.name || 'Board Migrado',
              created_at: board.createdAt || new Date().toISOString(),
              updated_at: board.updatedAt || new Date().toISOString(),
              migrated_from_old_system: true,
              migration_date: new Date().toISOString()
            };

            await this.db.save('boards', migratedBoard);
            migratedItems++;
          } catch (error) {
            console.warn(`Erro ao migrar board ${board.id}:`, error);
          }
        }
      }

      // Migrar tasks
      if (appData.tasks) {
        for (const task of Object.values(appData.tasks)) {
          try {
            const migratedTask = {
              id: task.id || 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
              board_id: task.boardId || 'migrated_board',
              title: task.title || 'Tarefa Migrada',
              description: task.description || '',
              status: task.status || 'todo',
              priority: task.priority || 'medium',
              assignee: task.assignee || '',
              created_at: task.createdAt || new Date().toISOString(),
              updated_at: task.updatedAt || new Date().toISOString(),
              migrated_from_old_system: true,
              migration_date: new Date().toISOString()
            };

            await this.db.save('tasks', migratedTask);
            migratedItems++;
          } catch (error) {
            console.warn(`Erro ao migrar task ${task.id}:`, error);
          }
        }
      }

      // Migrar notes
      if (appData.notes) {
        for (const note of Object.values(appData.notes)) {
          try {
            const migratedNote = {
              id: note.id || 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
              user_id: this.getCurrentUserId() || 'migrated_user',
              title: note.title || 'Nota Migrada',
              content: note.content || '',
              created_at: note.createdAt || new Date().toISOString(),
              updated_at: note.updatedAt || new Date().toISOString(),
              migrated_from_old_system: true,
              migration_date: new Date().toISOString()
            };

            await this.db.save('notes', migratedNote);
            migratedItems++;
          } catch (error) {
            console.warn(`Erro ao migrar note ${note.id}:`, error);
          }
        }
      }

      console.log(`📊 ${migratedItems} itens migrados com sucesso`);
    } catch (error) {
      console.error('Erro ao migrar dados do aplicativo:', error);
      throw error;
    }
  }

  /**
   * Obtém o ID do usuário atual para migração
   */
  getCurrentUserId() {
    const currentUser = this.auth.getCurrentUser();
    return currentUser ? currentUser.id : null;
  }

  /**
   * Retorna resumo dos itens migrados
   */
  getMigratedItems() {
    return {
      users: 'Usuários locais',
      boards: 'Boards Kanban',
      tasks: 'Tarefas',
      notes: 'Notas',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Limpa dados antigos após migração bem-sucedida
   */
  async cleanupOldData() {
    try {
      console.log('🧹 Limpando dados antigos...');
      
      // Remover chaves antigas do localStorage
      const oldKeys = [
        'noteyou_v3_state',
        'noteyou_local_users',
        'noteyou_current_user'
      ];

      for (const key of oldKeys) {
        localStorage.removeItem(key);
      }

      console.log('✅ Dados antigos removidos com sucesso');
    } catch (error) {
      console.error('Erro ao limpar dados antigos:', error);
    }
  }

  /**
   * Verifica integridade dos dados migrados
   */
  async verifyMigration() {
    try {
      const verification = {
        users: 0,
        boards: 0,
        tasks: 0,
        notes: 0,
        total: 0
      };

      // Contar usuários
      const users = await this.db.load('users');
      verification.users = users.filter(u => u.migrated_from_old_system).length;

      // Contar boards
      const boards = await this.db.load('boards');
      verification.boards = boards.filter(b => b.migrated_from_old_system).length;

      // Contar tasks
      const tasks = await this.db.load('tasks');
      verification.tasks = tasks.filter(t => t.migrated_from_old_system).length;

      // Contar notes
      const notes = await this.db.load('notes');
      verification.notes = notes.filter(n => n.migrated_from_old_system).length;

      verification.total = verification.users + verification.boards + verification.tasks + verification.notes;

      console.log('🔍 Verificação de migração:', verification);
      return verification;
    } catch (error) {
      console.error('Erro na verificação:', error);
      return null;
    }
  }
}

// Instanciar sistema de migração
const dataMigration = new DataMigrationSystem(hybridDB, hybridAuth);

// Exportar para uso global
window.dataMigration = dataMigration;
