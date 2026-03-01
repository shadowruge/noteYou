// ===== FUNÇÕES ADICIONAIS PARA APP.JS =====

/**
 * Função de login com Google (placeholder)
 */
function signInWithGoogle() {
  showToast('Google Login', 'Funcionalidade em desenvolvimento. Use o login local.', '🔧');
  switchLoginTab('local');
}

/**
 * Abre um board específico
 */
function openBoard(boardId) {
  // Salvar board atual no estado
  state.currentBoard = boardId;
  localStorage.setItem('currentBoard', boardId);
  
  // Mudar para seção kanban
  switchSection('kanban');
  
  // Filtrar tarefas do board
  renderBoardTasks(boardId);
  
  showToast('Board Aberto', 'Board carregado com sucesso!', '✅');
}

/**
 * Renderiza tarefas de um board específico
 */
function renderBoardTasks(boardId) {
  const boardTasks = Object.values(state.tasks).filter(task => task.boardId === boardId);
  
  // Atualizar o kanban com apenas as tarefas deste board
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
        <span class="kanban-column-count">${boardTasks.filter(task => task.status === status).length}</span>
      </div>
      <div class="kanban-tasks" data-status="${status}">
        ${renderBoardTasksByStatus(boardTasks, status)}
      </div>
      <button class="btn btn-secondary btn-sm" onclick="showCreateTaskModal('${status}', '${boardId}')">
        + Adicionar Tarefa
      </button>
    </div>
  `).join('');
  
  // Configurar drag and drop
  setupDragAndDrop();
}

/**
 * Renderiza tarefas de um board por status
 */
function renderBoardTasksByStatus(boardTasks, status) {
  const tasks = boardTasks.filter(task => task.status === status);
  
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
 * Edita uma tarefa existente
 */
function editTask(taskId) {
  const task = state.tasks[taskId];
  if (!task) return;
  
  // Preencher formulário com dados da tarefa
  document.getElementById('taskTitle').value = task.title;
  document.getElementById('taskDescription').value = task.description || '';
  document.getElementById('taskStatus').value = task.status;
  document.getElementById('taskPriority').value = task.priority || 'medium';
  document.getElementById('taskAssignee').value = task.assignee || '';
  
  // Mudar título do modal
  document.getElementById('taskModalTitle').textContent = 'Editar Tarefa';
  
  // Adicionar ID da tarefa ao formulário
  document.getElementById('taskForm').dataset.taskId = taskId;
  
  // Mostrar modal
  document.getElementById('taskModal').classList.add('active');
}

/**
 * Edita uma nota existente
 */
function editNote(noteId) {
  const note = state.notes[noteId];
  if (!note) return;
  
  // Preencher formulário com dados da nota
  document.getElementById('noteTitle').value = note.title;
  document.getElementById('noteContent').value = note.content || '';
  document.getElementById('noteTags').value = note.tags ? note.tags.join(', ') : '';
  
  // Mudar título do modal
  document.getElementById('noteModalTitle').textContent = 'Editar Nota';
  
  // Adicionar ID da nota ao formulário
  document.getElementById('noteForm').dataset.noteId = noteId;
  
  // Mostrar modal
  document.getElementById('noteModal').classList.add('active');
}

/**
 * Atualiza função createTask para lidar com edição
 */
async function updateTask(event) {
  event.preventDefault();
  
  try {
    const taskId = event.target.dataset.taskId;
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const status = document.getElementById('taskStatus').value;
    const priority = document.getElementById('taskPriority').value;
    const assignee = document.getElementById('taskAssignee').value;
    
    if (!title.trim()) {
      showToast('Erro', 'O título da tarefa é obrigatório.', '❌');
      return;
    }
    
    const task = state.tasks[taskId];
    if (task) {
      task.title = title.trim();
      task.description = description.trim();
      task.status = status;
      task.priority = priority;
      task.assignee = assignee.trim();
      task.updatedAt = new Date().toISOString();
      
      await save();
      
      if (state.currentBoard) {
        renderBoardTasks(state.currentBoard);
      } else {
        render();
      }
      
      closeModal('taskModal');
      showToast('Tarefa Atualizada', 'Tarefa atualizada com sucesso!', '✅');
    }
    
  } catch (error) {
    handleError(error, 'updateTask');
  }
}

/**
 * Atualiza função createNote para lidar com edição
 */
async function updateNote(event) {
  event.preventDefault();
  
  try {
    const noteId = event.target.dataset.noteId;
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    const tagsInput = document.getElementById('noteTags').value;
    
    if (!title.trim()) {
      showToast('Erro', 'O título da nota é obrigatório.', '❌');
      return;
    }
    
    const note = state.notes[noteId];
    if (note) {
      note.title = title.trim();
      note.content = content.trim();
      note.tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
      note.updatedAt = new Date().toISOString();
      
      await save();
      renderNotes();
      
      closeModal('noteModal');
      showToast('Nota Atualizada', 'Nota atualizada com sucesso!', '✅');
    }
    
  } catch (error) {
    handleError(error, 'updateNote');
  }
}

/**
 * Alterna entre seções da aplicação
 */
function switchSection(sectionName) {
  // Esconder todas as seções
  document.querySelectorAll('.content-section').forEach(section => {
    section.style.display = 'none';
  });
  
  // Mostrar seção selecionada
  const targetSection = document.getElementById(sectionName + 'Section');
  if (targetSection) {
    targetSection.style.display = 'block';
    targetSection.classList.add('fade-in');
  }
  
  // Atualizar navegação
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
  if (activeNavItem) {
    activeNavItem.classList.add('active');
  }
  
  // Carregar dados específicos da seção
  if (sectionName === 'analytics') {
    loadAnalytics();
  }
}

/**
 * Carrega dados do analytics
 */
function loadAnalytics() {
  const tasks = Object.values(state.tasks);
  const notes = Object.values(state.notes);
  
  // Atualizar estatísticas
  document.getElementById('totalTasks').textContent = tasks.length;
  document.getElementById('completedTasks').textContent = tasks.filter(t => t.status === 'done').length;
  document.getElementById('totalNotes').textContent = notes.length;
  
  // Criar gráfico de tarefas
  createTasksChart(tasks);
}

/**
 * Cria gráfico de tarefas
 */
function createTasksChart(tasks) {
  const ctx = document.getElementById('tasksChart');
  if (!ctx) return;
  
  const statusCounts = {
    todo: tasks.filter(t => t.status === 'todo').length,
    inprogress: tasks.filter(t => t.status === 'inprogress').length,
    done: tasks.filter(t => t.status === 'done').length
  };
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['A Fazer', 'Em Progresso', 'Concluídas'],
      datasets: [{
        data: [statusCounts.todo, statusCounts.inprogress, statusCounts.done],
        backgroundColor: [
          '#f59e0b',
          '#3b82f6',
          '#10b981'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

/**
 * Atualiza analytics
 */
function refreshAnalytics() {
  loadAnalytics();
  showToast('Analytics', 'Dados atualizados com sucesso!', '🔄');
}

/**
 * Altera tema
 */
function changeTheme(theme) {
  if (theme === 'auto') {
    const hour = new Date().getHours();
    theme = hour >= 18 || hour < 6 ? 'dark' : 'light';
  }
  
  document.documentElement.setAttribute('data-theme', theme);
  state.settings.theme = theme;
  localStorage.setItem('noteyou_theme', theme);
  save();
  
  showToast('Tema Alterado', `Tema ${theme === 'dark' ? 'escuro' : 'claro'} ativado!`, '🎨');
}

/**
 * Exporta dados
 */
function exportData() {
  try {
    const data = {
      version: '3.0',
      exportDate: new Date().toISOString(),
      boards: state.boards,
      tasks: state.tasks,
      notes: state.notes,
      settings: state.settings
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `noteyou-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Dados Exportados', 'Seus dados foram exportados com sucesso!', '📤');
    
  } catch (error) {
    handleError(error, 'exportData');
  }
}

/**
 * Importa dados
 */
function importData() {
  document.getElementById('importFile').click();
}

/**
 * Manipula importação de dados
 */
function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      // Validar estrutura
      if (!data.version || !data.boards || !data.tasks || !data.notes) {
        throw new Error('Formato de arquivo inválido');
      }
      
      // Confirmar importação
      if (!confirm('Importar dados substituirá seus dados atuais. Deseja continuar?')) {
        return;
      }
      
      // Importar dados
      state.boards = data.boards;
      state.tasks = data.tasks;
      state.notes = data.notes;
      state.settings = { ...state.settings, ...data.settings };
      
      await save();
      
      // Re-renderizar
      renderBoards();
      render();
      renderNotes();
      
      showToast('Dados Importados', 'Seus dados foram importados com sucesso!', '📥');
      
    } catch (error) {
      showToast('Erro na Importação', 'Falha ao importar dados: ' + error.message, '❌');
    }
  };
  
  reader.readAsText(file);
  event.target.value = ''; // Reset input
}

/**
 * Limpa todos os dados
 */
function clearAllData() {
  if (!confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
    return;
  }
  
  if (!confirm('ÚLTIMA AVISO: Todos os seus boards, tarefas e notas serão permanentemente excluídos.')) {
    return;
  }
  
  try {
    // Limpar estado
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
    
    // Limpar localStorage
    localStorage.removeItem(KEY);
    localStorage.removeItem('currentBoard');
    
    // Re-renderizar
    renderBoards();
    render();
    renderNotes();
    
    showToast('Dados Limpos', 'Todos os dados foram removidos com sucesso.', '🗑️');
    
  } catch (error) {
    handleError(error, 'clearAllData');
  }
}

/**
 * Configura navegação
 */
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      if (section) {
        switchSection(section);
      }
    });
  });
}

/**
 * Atualiza createTask para suportar boards
 */
function showCreateTaskModal(status, boardId) {
  const modal = document.getElementById('taskModal');
  if (modal) {
    modal.classList.add('active');
    document.getElementById('taskModalTitle').textContent = 'Criar Tarefa';
    document.getElementById('taskForm').reset();
    document.getElementById('taskStatus').value = status;
    
    // Adicionar board ID ao formulário
    if (boardId) {
      document.getElementById('taskForm').dataset.boardId = boardId;
    }
    
    // Remover taskId se existir
    delete document.getElementById('taskForm').dataset.taskId;
  }
}

/**
 * Atualiza função createTask original
 */
async function createTask(event) {
  // Verificar se é edição
  if (event.target.dataset.taskId) {
    return updateTask(event);
  }
  
  try {
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const status = document.getElementById('taskStatus').value;
    const priority = document.getElementById('taskPriority').value;
    const assignee = document.getElementById('taskAssignee').value;
    const boardId = event.target.dataset.boardId || state.currentBoard;
    
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
      boardId: boardId || 'default',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    state.tasks[task.id] = task;
    await save();
    
    if (boardId || state.currentBoard) {
      renderBoardTasks(boardId || state.currentBoard);
    } else {
      render();
    }
    
    closeModal('taskModal');
    showToast('Tarefa Criada', 'Tarefa criada com sucesso!', '✅');
    
  } catch (error) {
    handleError(error, 'createTask');
  }
}

/**
 * Atualiza função createNote original
 */
async function createNote(event) {
  // Verificar se é edição
  if (event.target.dataset.noteId) {
    return updateNote(event);
  }
  
  try {
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    const tagsInput = document.getElementById('noteTags').value;
    
    if (!title.trim()) {
      showToast('Erro', 'O título da nota é obrigatório.', '❌');
      return;
    }
    
    const note = {
      id: 'note_' + Date.now(),
      title: title.trim(),
      content: content.trim(),
      tags: tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
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

// ===== INICIALIZAÇÃO ADICIONAL =====

/**
 * Inicializa navegação e outras funcionalidades
 */
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  
  // Carregar board atual se existir
  const currentBoard = localStorage.getItem('currentBoard');
  if (currentBoard && state.boards[currentBoard]) {
    state.currentBoard = currentBoard;
  }
  
  // Adicionar event listeners para modais
  document.getElementById('taskForm')?.addEventListener('submit', createTask);
  document.getElementById('noteForm')?.addEventListener('submit', createNote);
});

// Exportar funções adicionais
window.switchSection = switchSection;
window.openBoard = openBoard;
window.editTask = editTask;
window.editNote = editNote;
window.refreshAnalytics = refreshAnalytics;
window.changeTheme = changeTheme;
window.exportData = exportData;
window.importData = importData;
window.handleImport = handleImport;
window.clearAllData = clearAllData;
window.signInWithGoogle = signInWithGoogle;
