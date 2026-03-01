// ===== APLICAÇÃO PRINCIPAL - NOTEYOU 3.0 =====
// Sistema de gerenciamento de tarefas e notas com banco de dados híbrido

// ===== VARIÁVEIS GLOBAIS =====
const KEY = 'noteyou_v3_state';
let currentUser = null;
let authInitialized = false;

// Estado da aplicação
let state = {
  boards: {},
  tasks: {},
  notes: {},
  settings: {
    theme: 'light',
    autoSave: true,
    notifications: true
  }
};

// ===== FUNÇÕES DE ESTADO =====

/**
 * Carrega o estado do aplicativo
 */
async function loadState() {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) {
      state = { ...state, ...JSON.parse(stored) };
    }
    console.log('Estado carregado:', state);
  } catch (error) {
    console.error('Erro ao carregar estado:', error);
    handleError(error, 'loadState');
  }
}

/**
 * Salva o estado atual
 */
async function save() {
  try {
    // Salvar localmente (backup)
    localStorage.setItem(KEY, JSON.stringify(state));
    
    // Salvar dados específicos do usuário local
    await saveUserDataForUser();
    
    console.log('Estado salvo com sucesso');
  } catch (error) {
    handleError(error, 'save');
  }
}

/**
 * Salva dados específicos do usuário
 */
async function saveUserDataForUser() {
  if (!currentUser || currentUser.isDemo) return;
  
  try {
    const userKey = `noteyou_user_data_${currentUser.email.toLowerCase()}`;
    localStorage.setItem(userKey, JSON.stringify(state));
    
    console.log('Dados do usuário salvos localmente:', currentUser.email);
    
  } catch (error) {
    console.error('Erro ao salvar dados do usuário:', error);
  }
}

/**
 * Carrega dados específicos do usuário
 */
async function loadUserDataForUser(userEmail) {
  try {
    // Carregar dados específicos do usuário
    const userKey = `noteyou_user_data_${userEmail.toLowerCase()}`;
    const userData = localStorage.getItem(userKey);
    
    if (userData) {
      const parsedData = JSON.parse(userData);
      state = { ...state, ...parsedData };
    }
    
    // Renderizar aplicativo
    renderBoards();
    render();
    renderNotes();
    
    console.log('Dados do usuário carregados:', userEmail);
    
  } catch (error) {
    console.error('Erro ao carregar dados do usuário:', error);
    handleError(error, 'loadUserDataForUser');
  }
}

// ===== FUNÇÕES DE INTERFACE =====

/**
 * Mostra tela de login
 */
function showLoginScreen() {
  document.getElementById('loginContainer').style.display = 'flex';
  document.querySelector('.app-container').style.display = 'none';
}

/**
 * Esconde tela de login
 */
function hideLoginScreen() {
  document.getElementById('loginContainer').style.display = 'none';
  document.querySelector('.app-container').style.display = 'flex';
}

/**
 * Atualiza perfil do usuário na interface
 */
function updateUserProfile(user) {
  const initials = (user.displayName || user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase();
  document.getElementById('userAvatar').textContent = initials;
  document.getElementById('userName').textContent = user.displayName || user.name || 'Usuário';
  document.getElementById('userEmail').textContent = user.email;
  
  // Mostrar perfil
  document.getElementById('userProfile').style.display = 'flex';
}

/**
 * Mostra notificação toast
 */
function showToast(title, message, icon = '✅', type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  const container = document.querySelector('.toast-container') || createToastContainer();
  container.appendChild(toast);
  
  // Animar entrada
  setTimeout(() => toast.classList.add('show'), 100);
  
  // Remover automaticamente
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

/**
 * Cria container de toasts
 */
function createToastContainer() {
  const container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

/**
 * Trata erros de forma consistente
 */
function handleError(error, context = 'unknown') {
  console.error(`Erro em ${context}:`, error);
  
  // Mostrar toast para usuário
  showToast(
    'Erro',
    'Ocorreu um erro inesperado. Tente novamente.',
    '❌',
    'error'
  );
}

// ===== FUNÇÕES DE LOGIN =====

/**
 * Manipula o login local com sistema híbrido
 */
async function handleLocalLogin(event) {
  event.preventDefault();
  
  try {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Mostrar loading
    const submitBtn = event.target.querySelector('.login-submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Entrando...';
    submitBtn.disabled = true;
    
    // Tentar login com sistema híbrido
    const result = await hybridAuth.login(email, password);
    
    if (result.success) {
      // Atualizar interface
      updateUserProfile(result.user);
      
      // Carregar dados do usuário
      await loadUserDataForUser(result.user.email);
      
      // Esconder tela de login
      hideLoginScreen();
      
      showToast('Login Realizado!', `Bem-vindo de volta, ${result.user.name}!`, '🎉');
      
    } else {
      showToast('Erro de Login', result.message, '❌');
    }
    
  } catch (error) {
    console.error('Erro no login local:', error);
    showToast('Erro', 'Ocorreu um erro ao fazer login.', '❌');
  } finally {
    // Restaurar botão
    const submitBtn = event.target.querySelector('.login-submit-btn');
    submitBtn.textContent = 'Entrar';
    submitBtn.disabled = false;
  }
}

/**
 * Manipula o registro local com sistema híbrido
 */
async function handleLocalRegister(event) {
  event.preventDefault();
  
  try {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validar senhas
    if (password !== confirmPassword) {
      showToast('Erro de Validação', 'As senhas não coincidem.', '❌');
      return;
    }
    
    // Mostrar loading
    const submitBtn = event.target.querySelector('.login-submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Criando conta...';
    submitBtn.disabled = true;
    
    // Tentar registro com sistema híbrido
    const result = await hybridAuth.register(email, password, name);
    
    if (result.success) {
      showToast('Conta Criada!', 'Sua conta foi criada com sucesso!', '🎉');
      
      // Limpar formulário
      event.target.reset();
      
      // Mudar para tela de login
      switchToLogin();
      
      // Preencher email para facilitar
      document.getElementById('loginEmail').value = email;
      
    } else {
      showToast('Erro no Registro', result.message, '❌');
    }
    
  } catch (error) {
    console.error('Erro no registro local:', error);
    showToast('Erro', 'Ocorreu um erro ao criar conta.', '❌');
  } finally {
    // Restaurar botão
    const submitBtn = event.target.querySelector('.login-submit-btn');
    submitBtn.textContent = 'Criar Conta';
    submitBtn.disabled = false;
  }
}

/**
 * Inicia modo demo
 */
async function startDemoMode() {
  try {
    // Criar usuário demo
    const mockUser = {
      uid: 'demo-user-' + Date.now(),
      email: 'demo@noteyou.app',
      displayName: 'Usuário Demo',
      photoURL: null,
      emailVerified: true,
      isDemo: true
    };
    
    currentUser = mockUser;
    authInitialized = true;
    
    // Atualizar interface
    updateUserProfile(mockUser);
    
    // Carregar dados locais
    await loadLocalData();
    
    // Esconder tela de login
    hideLoginScreen();
    
    showToast('Modo Demo', 'Você está usando o modo de demonstração.', '🚧');
    
  } catch (error) {
    console.error('Erro ao iniciar modo demo:', error);
    handleError(error, 'startDemoMode');
  }
}

/**
 * Faz logout usando sistema híbrido
 */
async function signOut() {
  try {
    // Se é usuário local, fazer logout com sistema híbrido
    if (currentUser && !currentUser.isDemo && hybridAuth.isLoggedIn()) {
      await hybridAuth.logout();
    }
    
    // Limpar dados do usuário
    currentUser = null;
    
    // Limpar perfil da interface
    document.getElementById('userProfile').style.display = 'none';
    
    // Mostrar tela de login
    showLoginScreen();
    
    showToast('Logout Realizado', 'Você saiu da sua conta com sucesso.', '👋');
    
  } catch (error) {
    console.error('Erro no logout:', error);
    handleError(error, 'signOut');
  }
}

/**
 * Carrega dados locais (modo offline/demo)
 */
async function loadLocalData() {
  try {
    // Carregar do localStorage
    const localState = localStorage.getItem(KEY);
    if (localState) {
      state = JSON.parse(localState);
    }
    
    // Renderizar aplicativo
    renderBoards();
    render();
    renderNotes();
    
    console.log('Dados locais carregados');
    
  } catch (error) {
    console.error('Erro ao carregar dados locais:', error);
    handleError(error, 'loadLocalData');
  }
}

// ===== CONTROLE DE ABAS DE LOGIN =====

/**
 * Alterna entre as abas de login
 */
function switchLoginTab(tab) {
  // Remover classe active de todas as abas
  document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.login-form').forEach(f => f.classList.remove('active'));
  
  // Adicionar classe active na aba selecionada
  document.getElementById(tab + 'Tab').classList.add('active');
  document.getElementById(tab + 'Login').classList.add('active');
}

/**
 * Alterna para o formulário de registro
 */
function switchToRegister() {
  document.getElementById('localLogin').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
}

/**
 * Alterna para o formulário de login
 */
function switchToLogin() {
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('localLogin').style.display = 'block';
}

// ===== FUNÇÕES DE KANBAN =====

/**
 * Renderiza todos os boards
 */
function renderBoards() {
  const boardsContainer = document.getElementById('boardsContainer');
  if (!boardsContainer) return;
  
  const boards = Object.values(state.boards);
  
  if (boards.length === 0) {
    boardsContainer.innerHTML = `
      <div class="empty-state">
        <h3>Nenhum board encontrado</h3>
        <p>Crie seu primeiro board para começar a organizar suas tarefas.</p>
        <button class="btn btn-primary" onclick="showCreateBoardModal()">
          Criar Board
        </button>
      </div>
    `;
    return;
  }
  
  boardsContainer.innerHTML = boards.map(board => `
    <div class="board-card" data-board-id="${board.id}">
      <h3>${board.name}</h3>
      <div class="board-stats">
        <span>${getTaskCount(board.id)} tarefas</span>
      </div>
      <div class="board-actions">
        <button class="btn btn-sm btn-secondary" onclick="openBoard('${board.id}')">
          Abrir
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteBoard('${board.id}')">
          Excluir
        </button>
      </div>
    </div>
  `).join('');
}

/**
 * Renderiza o kanban board
 */
function render() {
  const kanbanBoard = document.querySelector('.kanban-board');
  if (!kanbanBoard) return;
  
  const columns = ['todo', 'inprogress', 'done'];
  const columnTitles = {
    todo: 'A Fazer',
    inprogress: 'Em Progresso',
    done: 'Concluído'
  };
  
  kanbanBoard.innerHTML = columns.map(status => `
    <div class="kanban-column" data-status="${status}">
      <div class="kanban-column-header">
        <h3 class="kanban-column-title">${columnTitles[status]}</h3>
        <span class="kanban-column-count">${getTasksByStatus(status).length}</span>
      </div>
      <div class="kanban-tasks" data-status="${status}">
        ${renderTasks(status)}
      </div>
      <button class="btn btn-secondary btn-sm" onclick="showCreateTaskModal('${status}')">
        + Adicionar Tarefa
      </button>
    </div>
  `).join('');
  
  // Configurar drag and drop
  setupDragAndDrop();
}

/**
 * Renderiza tarefas de uma coluna
 */
function renderTasks(status) {
  const tasks = getTasksByStatus(status);
  
  if (tasks.length === 0) {
    return '<div class="empty-column">Nenhuma tarefa nesta coluna</div>';
  }
  
  return tasks.map(task => `
    <div class="task-card" draggable="true" data-task-id="${task.id}">
      <h4 class="task-title">${task.title}</h4>
      ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
      <div class="task-meta">
        <span class="task-priority priority-${task.priority || 'medium'}">
          ${task.priority || 'medium'}
        </span>
        ${task.assignee ? `
          <span class="task-assignee">
            👤 ${task.assignee}
          </span>
        ` : ''}
        <div class="task-actions">
          <button class="task-action-btn" onclick="editTask('${task.id}')">
            ✏️
          </button>
          <button class="task-action-btn" onclick="deleteTask('${task.id}')">
            🗑️
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Obtém tarefas por status
 */
function getTasksByStatus(status) {
  return Object.values(state.tasks).filter(task => task.status === status);
}

/**
 * Obtém contagem de tarefas de um board
 */
function getTaskCount(boardId) {
  return Object.values(state.tasks).filter(task => task.boardId === boardId).length;
}

// ===== FUNÇÕES DE NOTAS =====

/**
 * Renderiza todas as notas
 */
function renderNotes() {
  const notesContainer = document.getElementById('notesContainer');
  if (!notesContainer) return;
  
  const notes = Object.values(state.notes);
  
  if (notes.length === 0) {
    notesContainer.innerHTML = `
      <div class="empty-state">
        <h3>Nenhuma nota encontrada</h3>
        <p>Crie sua primeira nota para começar a organizar suas ideias.</p>
        <button class="btn btn-primary" onclick="showCreateNoteModal()">
          Criar Nota
        </button>
      </div>
    `;
    return;
  }
  
  notesContainer.innerHTML = `
    <div class="notes-grid">
      ${notes.map(note => `
        <div class="note-card" data-note-id="${note.id}">
          <h3 class="note-title">${note.title}</h3>
          <p class="note-content">${note.content || ''}</p>
          <div class="note-meta">
            <span class="note-date">${formatDate(note.createdAt)}</span>
            <div class="note-actions">
              <button class="btn btn-sm btn-secondary" onclick="editNote('${note.id}')">
                Editar
              </button>
              <button class="btn btn-sm btn-danger" onclick="deleteNote('${note.id}')">
                Excluir
              </button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ===== FUNÇÕES DE MODAIS =====

/**
 * Mostra modal para criar board
 */
function showCreateBoardModal() {
  const modal = document.getElementById('boardModal');
  if (modal) {
    modal.classList.add('active');
    document.getElementById('boardModalTitle').textContent = 'Criar Board';
    document.getElementById('boardForm').reset();
  }
}

/**
 * Mostra modal para criar tarefa
 */
function showCreateTaskModal(status) {
  const modal = document.getElementById('taskModal');
  if (modal) {
    modal.classList.add('active');
    document.getElementById('taskModalTitle').textContent = 'Criar Tarefa';
    document.getElementById('taskForm').reset();
    document.getElementById('taskStatus').value = status;
  }
}

/**
 * Mostra modal para criar nota
 */
function showCreateNoteModal() {
  const modal = document.getElementById('noteModal');
  if (modal) {
    modal.classList.add('active');
    document.getElementById('noteModalTitle').textContent = 'Criar Nota';
    document.getElementById('noteForm').reset();
  }
}

/**
 * Fecha modal
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

// ===== FUNÇÕES DE CRUD =====

/**
 * Cria um novo board
 */
async function createBoard(event) {
  event.preventDefault();
  
  try {
    const name = document.getElementById('boardName').value;
    if (!name.trim()) {
      showToast('Erro', 'O nome do board é obrigatório.', '❌');
      return;
    }
    
    const board = {
      id: 'board_' + Date.now(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    state.boards[board.id] = board;
    await save();
    
    renderBoards();
    closeModal('boardModal');
    showToast('Board Criado', 'Board criado com sucesso!', '✅');
    
  } catch (error) {
    handleError(error, 'createBoard');
  }
}

/**
 * Cria uma nova tarefa
 */
async function createTask(event) {
  event.preventDefault();
  
  try {
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const status = document.getElementById('taskStatus').value;
    const priority = document.getElementById('taskPriority').value;
    const assignee = document.getElementById('taskAssignee').value;
    
    if (!title.trim()) {
      showToast('Erro', 'O título da tarefa é obrigatório.', '❌');
      return;
    }
    
    const task = {
      id: 'task_' + Date.now(),
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assignee: assignee.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    state.tasks[task.id] = task;
    await save();
    
    render();
    closeModal('taskModal');
    showToast('Tarefa Criada', 'Tarefa criada com sucesso!', '✅');
    
  } catch (error) {
    handleError(error, 'createTask');
  }
}

/**
 * Cria uma nova nota
 */
async function createNote(event) {
  event.preventDefault();
  
  try {
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    
    if (!title.trim()) {
      showToast('Erro', 'O título da nota é obrigatório.', '❌');
      return;
    }
    
    const note = {
      id: 'note_' + Date.now(),
      title: title.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    state.notes[note.id] = note;
    await save();
    
    renderNotes();
    closeModal('noteModal');
    showToast('Nota Criada', 'Nota criada com sucesso!', '✅');
    
  } catch (error) {
    handleError(error, 'createNote');
  }
}

/**
 * Exclui um board
 */
async function deleteBoard(boardId) {
  if (!confirm('Tem certeza que deseja excluir este board? Todas as tarefas serão perdidas.')) {
    return;
  }
  
  try {
    delete state.boards[boardId];
    
    // Remover tarefas do board
    Object.keys(state.tasks).forEach(taskId => {
      if (state.tasks[taskId].boardId === boardId) {
        delete state.tasks[taskId];
      }
    });
    
    await save();
    renderBoards();
    showToast('Board Excluído', 'Board excluído com sucesso.', '✅');
    
  } catch (error) {
    handleError(error, 'deleteBoard');
  }
}

/**
 * Exclui uma tarefa
 */
async function deleteTask(taskId) {
  if (!confirm('Tem certeza que deseja excluir esta tarefa?')) {
    return;
  }
  
  try {
    delete state.tasks[taskId];
    await save();
    render();
    showToast('Tarefa Excluída', 'Tarefa excluída com sucesso.', '✅');
    
  } catch (error) {
    handleError(error, 'deleteTask');
  }
}

/**
 * Exclui uma nota
 */
async function deleteNote(noteId) {
  if (!confirm('Tem certeza que deseja excluir esta nota?')) {
    return;
  }
  
  try {
    delete state.notes[noteId];
    await save();
    renderNotes();
    showToast('Nota Excluída', 'Nota excluída com sucesso.', '✅');
    
  } catch (error) {
    handleError(error, 'deleteNote');
  }
}

// ===== FUNÇÕES DE DRAG AND DROP =====

/**
 * Configura drag and drop para tarefas
 */
function setupDragAndDrop() {
  const taskCards = document.querySelectorAll('.task-card');
  const taskColumns = document.querySelectorAll('.kanban-tasks');
  
  taskCards.forEach(card => {
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
  });
  
  taskColumns.forEach(column => {
    column.addEventListener('dragover', handleDragOver);
    column.addEventListener('drop', handleDrop);
  });
}

/**
 * Inicia arrastar tarefa
 */
function handleDragStart(e) {
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.target.innerHTML);
  e.dataTransfer.setData('taskId', e.target.dataset.taskId);
}

/**
 * Finaliza arrastar tarefa
 */
function handleDragEnd(e) {
  e.target.classList.remove('dragging');
}

/**
 * Permite soltar tarefa
 */
function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

/**
 * Solta tarefa em nova coluna
 */
async function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  const taskId = e.dataTransfer.getData('taskId');
  const newStatus = e.target.closest('.kanban-tasks').dataset.status;
  
  if (taskId && newStatus) {
    const task = state.tasks[taskId];
    if (task) {
      task.status = newStatus;
      task.updatedAt = new Date().toISOString();
      
      await save();
      render();
      showToast('Tarefa Movida', 'Tarefa movida com sucesso!', '✅');
    }
  }
  
  return false;
}

// ===== FUNÇÕES DE TEMA =====

/**
 * Alterna entre tema claro e escuro
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  state.settings.theme = newTheme;
  
  localStorage.setItem('noteyou_theme', newTheme);
  save();
  
  showToast('Tema Alterado', `Tema ${newTheme === 'dark' ? 'escuro' : 'claro'} ativado!`, '🎨');
}

/**
 * Carrega tema salvo
 */
function loadTheme() {
  const savedTheme = localStorage.getItem('noteyou_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  state.settings.theme = savedTheme;
}

// ===== FUNÇÕES DE DATA =====

/**
 * Formata data para exibição
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return 'Hoje';
  } else if (diffDays === 2) {
    return 'Ontem';
  } else if (diffDays <= 7) {
    return `${diffDays - 1} dias atrás`;
  } else {
    return date.toLocaleDateString('pt-BR');
  }
}

// ===== INICIALIZAÇÃO =====

/**
 * Inicializa a aplicação
 */
async function initApp() {
  try {
    console.log('🚀 Inicializando NoteYou 3.0...');
    
    // Carregar tema
    loadTheme();
    
    // Carregar estado
    await loadState();
    
    // Esperar sistema híbrido inicializar
    await hybridAuth.init();
    
    // Verificar se há necessidade de migração
    const needsMigration = await dataMigration.checkForMigration();
    
    if (needsMigration) {
      console.log('🔄 Iniciando migração automática de dados...');
      
      // Mostrar toast de migração
      showToast('Migrando Dados', 'Atualizando sistema, por favor aguarde...', '🔄');
      
      // Executar migração
      const migrationResult = await dataMigration.migrate();
      
      if (migrationResult.success) {
        // Verificar migração
        const verification = await dataMigration.verifyMigration();
        
        console.log('✅ Migração concluída:', verification);
        showToast('Migração Concluída', `${verification.total} itens migrados com sucesso!`, '✅');
        
        // Limpar dados antigos após 5 segundos
        setTimeout(async () => {
          await dataMigration.cleanupOldData();
          console.log('🧹 Dados antigos removidos');
        }, 5000);
      } else {
        showToast('Erro na Migração', migrationResult.message, '❌');
        console.error('❌ Falha na migração:', migrationResult);
      }
    }
    
    // Verificar se já existe usuário logado
    if (hybridAuth.isLoggedIn()) {
      const user = hybridAuth.getCurrentUser();
      currentUser = user;
      authInitialized = true;
      
      // Atualizar interface
      updateUserProfile(user);
      
      // Carregar dados do usuário
      await loadUserDataForUser(user.email);
      
      // Esconder tela de login
      hideLoginScreen();
    }
    
    console.log('✅ Aplicação inicializada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
    showToast('Erro de Inicialização', 'Ocorreu um erro ao iniciar a aplicação.', '❌');
  }
}

// ===== EVENT LISTENERS =====

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Exportar funções para uso global
window.handleLocalLogin = handleLocalLogin;
window.handleLocalRegister = handleLocalRegister;
window.startDemoMode = startDemoMode;
window.signOut = signOut;
window.switchLoginTab = switchLoginTab;
window.switchToRegister = switchToRegister;
window.switchToLogin = switchToLogin;
window.showCreateBoardModal = showCreateBoardModal;
window.showCreateTaskModal = showCreateTaskModal;
window.showCreateNoteModal = showCreateNoteModal;
window.closeModal = closeModal;
window.createBoard = createBoard;
window.createTask = createTask;
window.createNote = createNote;
window.deleteBoard = deleteBoard;
window.deleteTask = deleteTask;
window.deleteNote = deleteNote;
window.toggleTheme = toggleTheme;
