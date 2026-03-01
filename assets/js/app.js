// NoteYou 3.0 - Aplicação Principal

const KEY = 'noteyou_v3_state';
let currentUser = null;
let authInitialized = false;

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

// Estado
async function loadState() {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) {
      state = { ...state, ...JSON.parse(stored) };
    }
  } catch (error) {
    handleError(error, 'loadState');
  }
}

async function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    await saveUserDataForUser();
  } catch (error) {
    handleError(error, 'save');
  }
}

async function saveUserDataForUser() {
  if (!currentUser || currentUser.isDemo) return;
  
  try {
    const userKey = `noteyou_user_data_${currentUser.email.toLowerCase()}`;
    localStorage.setItem(userKey, JSON.stringify(state));
  } catch (error) {
    console.error('Erro ao salvar dados do usuário:', error);
  }
}

async function loadUserDataForUser(userEmail) {
  try {
    const userKey = `noteyou_user_data_${userEmail.toLowerCase()}`;
    const userData = localStorage.getItem(userKey);
    
    if (userData) {
      const parsedData = JSON.parse(userData);
      state = { ...state, ...parsedData };
    }
    
    renderBoards();
    render();
    renderNotes();
  } catch (error) {
    handleError(error, 'loadUserDataForUser');
  }
}

// Interface
function showLoginScreen() {
  document.getElementById('loginContainer').style.display = 'flex';
  document.querySelector('.app-container').style.display = 'none';
}

function hideLoginScreen() {
  document.getElementById('loginContainer').style.display = 'none';
  document.querySelector('.app-container').style.display = 'flex';
}

function updateUserProfile(user) {
  const initials = (user.displayName || user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase();
  document.getElementById('userAvatar').textContent = initials;
  document.getElementById('userName').textContent = user.displayName || user.name || 'Usuário';
  document.getElementById('userEmail').textContent = user.email;
  document.getElementById('userProfile').style.display = 'flex';
}

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
  
  setTimeout(() => toast.classList.add('show'), 100);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

function handleError(error, context = 'unknown') {
  console.error(`Erro em ${context}:`, error);
  showToast('Erro', 'Ocorreu um erro inesperado. Tente novamente.', '❌', 'error');
}

// Login
async function handleLocalLogin(event) {
  event.preventDefault();
  
  try {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
      showToast('Erro de Validação', 'Email e senha são obrigatórios.', '❌');
      return;
    }
    
    const submitBtn = event.target.querySelector('.login-submit-btn');
    submitBtn.textContent = 'Entrando...';
    submitBtn.disabled = true;
    
    const result = await hybridAuth.login(email, password);
    
    if (result.success) {
      // ATUALIZAR ESTADO ANTES DE ESCONDER LOGIN
      updateUserProfile(result.user);
      currentUser = result.user;
      authInitialized = true;
      
      // CARREGAR DADOS ANTES DE MUDAR INTERFACE
      await loadUserDataForUser(result.user.email);
      
      // SÓ ESCONDER LOGIN DEPOIS DE TUDO PRONTO
      hideLoginScreen();
      showToast('Login Realizado!', `Bem-vindo de volta, ${result.user.name}!`, '🎉');
    } else {
      showToast('Erro de Login', result.message, '❌');
    }
    
  } catch (error) {
    console.error('Erro no login local:', error);
    showToast('Erro', 'Ocorreu um erro ao fazer login.', '❌');
  } finally {
    const submitBtn = event.target.querySelector('.login-submit-btn');
    submitBtn.textContent = 'Entrar';
    submitBtn.disabled = false;
  }
}

async function handleLocalRegister(event) {
  event.preventDefault();
  
  try {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!name || !email || !password) {
      showToast('Erro de Validação', 'Todos os campos são obrigatórios.', '❌');
      return;
    }
    
    if (password !== confirmPassword) {
      showToast('Erro de Validação', 'As senhas não coincidem.', '❌');
      return;
    }
    
    if (password.length < 6) {
      showToast('Erro de Validação', 'A senha deve ter pelo menos 6 caracteres.', '❌');
      return;
    }
    
    const submitBtn = event.target.querySelector('.login-submit-btn');
    submitBtn.textContent = 'Criando conta...';
    submitBtn.disabled = true;
    
    const result = await hybridAuth.register(email, password, name);
    
    if (result.success) {
      // ATUALIZAR ESTADO ANTES DE MUDAR INTERFACE
      currentUser = result.user;
      authInitialized = true;
      
      // CARREGAR DADOS ANTES DE MUDAR INTERFACE
      await loadUserDataForUser(result.user.email);
      
      // MUDAR PARA TELA DE LOGIN (sem refresh)
      switchToLogin();
      document.getElementById('loginEmail').value = email;
      
      showToast('Conta Criada!', 'Sua conta foi criada com sucesso!', '🎉');
    } else {
      showToast('Erro no Registro', result.message, '❌');
    }
    
  } catch (error) {
    console.error('Erro no registro local:', error);
    showToast('Erro', 'Ocorreu um erro ao criar conta.', '❌');
  } finally {
    const submitBtn = event.target.querySelector('.login-submit-btn');
    submitBtn.textContent = 'Criar Conta';
    submitBtn.disabled = false;
  }
}

async function startDemoMode() {
  try {
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
    
    updateUserProfile(mockUser);
    await loadLocalData();
    hideLoginScreen();
    
    showToast('Modo Demo', 'Você está usando o modo de demonstração.', '🚧');
    
  } catch (error) {
    handleError(error, 'startDemoMode');
  }
}

async function signOut() {
  try {
    if (currentUser && !currentUser.isDemo && hybridAuth.isLoggedIn()) {
      await hybridAuth.logout();
    }
    
    currentUser = null;
    document.getElementById('userProfile').style.display = 'none';
    showLoginScreen();
    
    showToast('Logout Realizado', 'Você saiu da sua conta com sucesso.', '👋');
    
  } catch (error) {
    handleError(error, 'signOut');
  }
}

async function loadLocalData() {
  try {
    const localState = localStorage.getItem(KEY);
    if (localState) {
      state = JSON.parse(localState);
    }
    
    renderBoards();
    render();
    renderNotes();
  } catch (error) {
    handleError(error, 'loadLocalData');
  }
}

// Abas de Login
function switchLoginTab(tab) {
  document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.login-form').forEach(f => f.classList.remove('active'));
  
  document.getElementById(tab + 'Tab').classList.add('active');
  document.getElementById(tab + 'Login').classList.add('active');
}

function switchToRegister() {
  document.getElementById('localLogin').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
}

function switchToLogin() {
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('localLogin').style.display = 'block';
}

// Kanban
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
  
  setupDragAndDrop();
}

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

function getTasksByStatus(status) {
  return Object.values(state.tasks).filter(task => task.status === status);
}

function getTaskCount(boardId) {
  return Object.values(state.tasks).filter(task => task.boardId === boardId).length;
}

// Notas
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

// Modais
function showCreateBoardModal() {
  const modal = document.getElementById('boardModal');
  if (modal) {
    modal.classList.add('active');
    document.getElementById('boardModalTitle').textContent = 'Criar Board';
    document.getElementById('boardForm').reset();
  }
}

function showCreateTaskModal(status) {
  const modal = document.getElementById('taskModal');
  if (modal) {
    modal.classList.add('active');
    document.getElementById('taskModalTitle').textContent = 'Criar Tarefa';
    document.getElementById('taskForm').reset();
    document.getElementById('taskStatus').value = status;
  }
}

function showCreateNoteModal() {
  const modal = document.getElementById('noteModal');
  if (modal) {
    modal.classList.add('active');
    document.getElementById('noteModalTitle').textContent = 'Criar Nota';
    document.getElementById('noteForm').reset();
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

// CRUD
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

async function deleteBoard(boardId) {
  if (!confirm('Tem certeza que deseja excluir este board? Todas as tarefas serão perdidas.')) {
    return;
  }
  
  try {
    delete state.boards[boardId];
    
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

// Drag and Drop
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

function handleDragStart(e) {
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.target.innerHTML);
  e.dataTransfer.setData('taskId', e.target.dataset.taskId);
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

async function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  const taskId = e.dataTransfer.getData('taskId');
  const targetElement = e.target && typeof e.target.closest === 'function' 
    ? e.target.closest('.kanban-tasks') 
    : null;
  const newStatus = targetElement ? targetElement.dataset.status : null;
  
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

// Tema
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  state.settings.theme = newTheme;
  
  localStorage.setItem('noteyou_theme', newTheme);
  save();
  
  showToast('Tema Alterado', `Tema ${newTheme === 'dark' ? 'escuro' : 'claro'} ativado!`, '🎨');
}

function loadTheme() {
  const savedTheme = localStorage.getItem('noteyou_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  state.settings.theme = savedTheme;
}

// ===== LIMPEZA DE BANCO DE DADOS =====

// Função para limpar completamente o banco de dados
function clearAllData() {
  try {
    // Limpar localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('noteyou_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Limpar estado da aplicação
    state = {
      boards: {},
      tasks: {},
      notes: {},
      settings: {
        theme: 'light',
        autoSave: true,
        notifications: true
      }
    };
    
    // Resetar usuário atual
    currentUser = null;
    authInitialized = false;
    
    // Limpar sessionStorage
    sessionStorage.clear();
    
    console.log('🧹 Todos os dados do NoteYou foram removidos');
    showToast('Dados Limpos', 'Todos os dados foram removidos com sucesso!', '✅');
    
    // Recarregar página para limpeza completa
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('Erro ao limpar dados:', error);
    showToast('Erro', 'Ocorreu um erro ao limpar os dados.', '❌');
  }
}

// Executar limpeza automática (DESATIVADO - foi apenas para desenvolvimento)
// clearAllData();

// ===== PERFIL DO USUÁRIO =====

// Carrega dados do perfil
function loadProfile() {
  if (!currentUser) return;
  
  // Preencher informações pessoais
  document.getElementById('profileName').value = currentUser.name || '';
  document.getElementById('profileEmail').value = currentUser.email || '';
  document.getElementById('profileBio').value = currentUser.bio || '';
  
  // Carregar preferências salvas
  const preferences = JSON.parse(localStorage.getItem('noteyou_profile_preferences') || '{}');
  document.getElementById('profileLanguage').value = preferences.language || 'pt-BR';
  document.getElementById('profileTimezone').value = preferences.timezone || 'America/Sao_Paulo';
  document.getElementById('profilePublicProfile').checked = preferences.publicProfile || false;
  document.getElementById('profileShowEmail').checked = preferences.showEmail || false;
  
  // Atualizar avatar
  updateAvatar();
  
  // Carregar estatísticas
  loadProfileStats();
  
  // Mostrar último login
  if (currentUser.last_login) {
    const lastLogin = new Date(currentUser.last_login).toLocaleString('pt-BR');
    document.getElementById('profileLastLogin').textContent = lastLogin;
  }
  
  // Mostrar data de criação
  if (currentUser.created_at) {
    const memberSince = new Date(currentUser.created_at).toLocaleDateString('pt-BR');
    document.getElementById('profileMemberSince').textContent = memberSince;
  }
}

// Salva dados do perfil
async function saveProfile() {
  if (!currentUser) return;
  
  try {
    // Atualizar nome do usuário
    const newName = document.getElementById('profileName').value.trim();
    if (newName && newName !== currentUser.name) {
      currentUser.name = newName;
      
      // Atualizar no banco de dados
      const users = await hybridDB.load('users', { email: currentUser.email });
      if (users.length > 0) {
        const user = users[0];
        user.name = newName;
        await hybridDB.save('users', user);
      }
      
      // Atualizar sessão
      localStorage.setItem('noteyou_current_user', JSON.stringify(currentUser));
      
      // Atualizar interface
      updateUserProfile(currentUser);
    }
    
    // Salvar preferências
    const preferences = {
      language: document.getElementById('profileLanguage').value,
      timezone: document.getElementById('profileTimezone').value,
      publicProfile: document.getElementById('profilePublicProfile').checked,
      showEmail: document.getElementById('profileShowEmail').checked
    };
    
    localStorage.setItem('noteyou_profile_preferences', JSON.stringify(preferences));
    
    // Salvar bio
    const bio = document.getElementById('profileBio').value.trim();
    if (bio !== currentUser.bio) {
      currentUser.bio = bio;
      localStorage.setItem('noteyou_current_user', JSON.stringify(currentUser));
    }
    
    showToast('Perfil Atualizado', 'Suas informações foram salvas com sucesso!', '✅');
    
  } catch (error) {
    console.error('Erro ao salvar perfil:', error);
    showToast('Erro', 'Ocorreu um erro ao salvar o perfil.', '❌');
  }
}

// Atualiza avatar
function updateAvatar() {
  if (!currentUser) return;
  
  const avatarInitials = document.getElementById('avatarInitials');
  const name = currentUser.name || '';
  
  if (name) {
    // Extrair iniciais do nome
    const names = name.split(' ');
    const initials = names.length > 1 
      ? names[0][0] + names[names.length - 1][0]
      : names[0][0];
    
    avatarInitials.textContent = initials.toUpperCase();
  } else {
    avatarInitials.textContent = '👤';
  }
}

// Carrega estatísticas do perfil
function loadProfileStats() {
  // Contar tarefas
  const totalTasks = Object.keys(state.tasks).length;
  const completedTasks = Object.values(state.tasks).filter(task => task.status === 'done').length;
  
  // Contar notas
  const totalNotes = Object.keys(state.notes).length;
  
  // Atualizar interface
  document.getElementById('profileTotalTasks').textContent = totalTasks;
  document.getElementById('profileCompletedTasks').textContent = completedTasks;
  document.getElementById('profileTotalNotes').textContent = totalNotes;
}

// Trocar avatar (placeholder)
function changeAvatar() {
  // Em uma implementação real, abriria um seletor de arquivos
  // Por enquanto, apenas cicla entre emojis
  const avatarInitials = document.getElementById('avatarInitials');
  const avatars = ['👤', '😊', '🎨', '🚀', '💡', '🌟', '🎯', '💼'];
  const currentAvatar = avatarInitials.textContent;
  const currentIndex = avatars.indexOf(currentAvatar);
  const nextIndex = (currentIndex + 1) % avatars.length;
  avatarInitials.textContent = avatars[nextIndex];
  
  showToast('Avatar Alterado', 'Seu avatar foi atualizado!', '✅');
}

// Mostrar modal para alterar senha
function showChangePasswordModal() {
  // Criar modal de alteração de senha
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Alterar Senha</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      <div class="modal-body">
        <form id="changePasswordForm">
          <div class="form-group">
            <label class="form-label">Senha Atual</label>
            <input type="password" id="currentPassword" class="form-input" required>
          </div>
          <div class="form-group">
            <label class="form-label">Nova Senha</label>
            <input type="password" id="newPassword" class="form-input" required minlength="6">
          </div>
          <div class="form-group">
            <label class="form-label">Confirmar Nova Senha</label>
            <input type="password" id="confirmNewPassword" class="form-input" required>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Alterar Senha</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Adicionar evento de submit
  document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    if (newPassword !== confirmNewPassword) {
      showToast('Erro', 'As senhas não coincidem.', '❌');
      return;
    }
    
    try {
      // Verificar senha atual
      const result = await hybridAuth.login(currentUser.email, currentPassword);
      
      if (result.success) {
        // Atualizar senha
        const salt = hybridAuth.generateSalt();
        const hashedPassword = await hybridAuth.hashPasswordWithSalt(newPassword, salt);
        
        const users = await hybridDB.load('users', { email: currentUser.email });
        if (users.length > 0) {
          const user = users[0];
          user.password_hash = hashedPassword;
          user.salt = salt;
          await hybridDB.save('users', user);
        }
        
        modal.remove();
        showToast('Senha Alterada', 'Sua senha foi atualizada com sucesso!', '✅');
      } else {
        showToast('Erro', 'Senha atual incorreta.', '❌');
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      showToast('Erro', 'Ocorreu um erro ao alterar a senha.', '❌');
    }
  });
}

// Confirmar exclusão de conta
function confirmDeleteAccount() {
  if (confirm('⚠️ ATENÇÃO: Esta ação é irreversível!\n\nTodos os seus dados serão permanentemente excluídos.\n\nDeseja continuar?')) {
    if (confirm('🚨 ÚLTIMA CHANCE:\n\nTem certeza de que deseja excluir sua conta?\n\nEsta ação NÃO pode ser desfeita.')) {
      deleteAccount();
    }
  }
}

// Excluir conta do usuário
async function deleteAccount() {
  if (!currentUser) return;
  
  try {
    // Excluir usuário do banco
    const users = await hybridDB.load('users', { email: currentUser.email });
    if (users.length > 0) {
      await hybridDB.delete('users', users[0].id);
    }
    
    // Limpar dados do usuário
    const userKey = `noteyou_user_data_${currentUser.email.toLowerCase()}`;
    localStorage.removeItem(userKey);
    
    // Limpar sessão
    localStorage.removeItem('noteyou_current_user');
    
    // Fazer logout
    currentUser = null;
    authInitialized = false;
    
    // Mostrar tela de login
    showLoginScreen();
    
    showToast('Conta Excluída', 'Sua conta foi excluída com sucesso.', '👋');
    
  } catch (error) {
    console.error('Erro ao excluir conta:', error);
    showToast('Erro', 'Ocorreu um erro ao excluir a conta.', '❌');
  }
}

// Data
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

// Função de diagnóstico do sistema
async function diagnoseSystem() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DO SISTEMA');
  console.log('='.repeat(50));
  
  try {
    // 1. Verificar objetos globais
    console.log('📊 Objetos Globais:');
    console.log('  - hybridAuth:', typeof hybridAuth, hybridAuth ? '✅' : '❌');
    console.log('  - hybridDB:', typeof hybridDB, hybridDB ? '✅' : '❌');
    console.log('  - dataMigration:', typeof dataMigration, dataMigration ? '✅' : '❌');
    console.log('  - lazyLoader:', typeof lazyLoader, lazyLoader ? '✅' : '❌');
    
    // 2. Verificar banco de dados
    if (hybridDB) {
      console.log('💾 Banco de Dados:');
      console.log('  - Tipo:', hybridDB.dbType);
      console.log('  - Inicializado:', hybridDB.isInitialized);
      console.log('  - Coleções:', Object.keys(hybridDB.db || {}));
      
      // Verificar usuários
      const users = await hybridDB.load('users');
      console.log('  - Usuários cadastrados:', users.length);
      users.forEach(user => {
        console.log(`    * ${user.email} (${user.name}) - ativo: ${user.is_active}`);
      });
    }
    
    // 3. Verificar autenticação
    if (hybridAuth) {
      console.log('🔐 Autenticação:');
      console.log('  - Inicializada:', hybridAuth.authInitialized);
      console.log('  - Usuário atual:', hybridAuth.currentUser);
      console.log('  - Está logado:', hybridAuth.isLoggedIn());
      console.log('  - Sessão no localStorage:', localStorage.getItem('noteyou_current_user'));
    }
    
    // 4. Verificar estado do app
    console.log('📱 Estado do App:');
    console.log('  - currentUser:', typeof currentUser, currentUser ? currentUser.email : 'null');
    console.log('  - authInitialized:', authInitialized);
    console.log('  - Estado boards:', Object.keys(state.boards).length);
    console.log('  - Estado tasks:', Object.keys(state.tasks).length);
    console.log('  - Estado notes:', Object.keys(state.notes).length);
    
    // 5. Verificar elementos DOM
    console.log('🎨 Elementos DOM:');
    console.log('  - loginContainer:', !!document.getElementById('loginContainer'));
    console.log('  - app-container:', !!document.querySelector('.app-container'));
    console.log('  - loginEmail:', !!document.getElementById('loginEmail'));
    console.log('  - loginPassword:', !!document.getElementById('loginPassword'));
    console.log('  - registerEmail:', !!document.getElementById('registerEmail'));
    
    // 6. Testar funções básicas
    console.log('⚙️ Funções:');
    console.log('  - handleLocalLogin:', typeof handleLocalLogin);
    console.log('  - handleLocalRegister:', typeof handleLocalRegister);
    console.log('  - showLoginScreen:', typeof showLoginScreen);
    console.log('  - hideLoginScreen:', typeof hideLoginScreen);
    
  } catch (error) {
    console.error('💥 Erro no diagnóstico:', error);
  }
  
  console.log('='.repeat(50));
  console.log('🔍 FIM DO DIAGNÓSTICO');
}

// Inicialização
async function initApp() {
  try {
    loadTheme();
    await loadState();
    
    await hybridAuth.init();
    
    // Criar usuário admin de teste se não existir
    await createTestUserIfNeeded();
    
    const needsMigration = await dataMigration.checkForMigration();
    
    if (needsMigration) {
      showToast('Migrando Dados', 'Atualizando sistema, por favor aguarde...', '🔄');
      
      const migrationResult = await dataMigration.migrate();
      
      if (migrationResult.success) {
        const verification = await dataMigration.verifyMigration();
        
        showToast('Migração Concluída', `${verification.total} itens migrados com sucesso!`, '✅');
        
        setTimeout(async () => {
          await dataMigration.cleanupOldData();
        }, 5000);
      } else {
        showToast('Erro na Migração', migrationResult.message, '❌');
        console.error('Falha na migração:', migrationResult);
      }
    }
    
    // Verificar se já existe usuário logado PRIMEIRO
    if (hybridAuth.isLoggedIn()) {
      const user = hybridAuth.getCurrentUser();
      currentUser = user;
      authInitialized = true;
      
      updateUserProfile(user);
      await loadUserDataForUser(user.email);
      hideLoginScreen();
    } else {
      // Apenas mostrar tela de login se NÃO houver usuário logado
      showLoginScreen();
    }
    
  } catch (error) {
    console.error('Erro na inicialização:', error);
    showToast('Erro de Inicialização', 'Ocorreu um erro ao iniciar a aplicação.', '❌');
  }
}

// Criar usuário admin de teste
async function createTestUserIfNeeded() {
  try {
    const testEmail = 'admin@noteyou.app';
    const existingUsers = await hybridDB.load('users', { email: testEmail });
    
    if (existingUsers.length === 0) {
      console.log('👤 Criando usuário admin de teste...');
      
      const salt = hybridAuth.generateSalt();
      const hashedPassword = await hybridAuth.hashPasswordWithSalt('admin123', salt);
      
      const testUser = {
        id: 'user_admin_' + Date.now(),
        email: testEmail,
        name: 'Administrador',
        password_hash: hashedPassword,
        salt: salt,
        is_active: true,
        created_at: new Date().toISOString(),
        last_login: null
      };
      
      await hybridDB.save('users', testUser);
      console.log('✅ Usuário admin criado: admin@noteyou.app / admin123');
    }
  } catch (error) {
    console.error('Erro ao criar usuário de teste:', error);
  }
}

// Event Listeners
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Exportar funções
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
