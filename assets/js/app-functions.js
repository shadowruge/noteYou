// Funções adicionais do NoteYou 3.0

function signInWithGoogle() {
  showToast('Google Login', 'Funcionalidade em desenvolvimento. Use o login local.', '🔧');
  switchLoginTab('local');
}

function openBoard(boardId) {
  state.currentBoard = boardId;
  localStorage.setItem('currentBoard', boardId);
  switchSection('kanban');
  renderBoardTasks(boardId);
  showToast('Board Aberto', 'Board carregado com sucesso!', '✅');
}

function renderBoardTasks(boardId) {
  const boardTasks = Object.values(state.tasks).filter(task => task.boardId === boardId);
  const kanbanBoard = document.querySelector('.kanban-board');
  if (!kanbanBoard) return;
  
  const columns = ['todo', 'inprogress', 'done'];
  const columnTitles = { todo: 'A Fazer', inprogress: 'Em Progresso', done: 'Concluído' };
  
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
  
  setupDragAndDrop();
}

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
        ${task.assignee ? `<span class="task-assignee">👤 ${task.assignee}</span>` : ''}
        <div class="task-actions">
          <button class="task-action-btn" onclick="editTask('${task.id}')">✏️</button>
          <button class="task-action-btn" onclick="deleteTask('${task.id}')">🗑️</button>
        </div>
      </div>
    </div>
  `).join('');
}

function editTask(taskId) {
  const task = state.tasks[taskId];
  if (!task) return;
  
  document.getElementById('taskTitle').value = task.title;
  document.getElementById('taskDescription').value = task.description || '';
  document.getElementById('taskStatus').value = task.status;
  document.getElementById('taskPriority').value = task.priority || 'medium';
  document.getElementById('taskAssignee').value = task.assignee || '';
  
  document.getElementById('taskModalTitle').textContent = 'Editar Tarefa';
  document.getElementById('taskForm').dataset.taskId = taskId;
  document.getElementById('taskModal').classList.add('active');
}

function editNote(noteId) {
  const note = state.notes[noteId];
  if (!note) return;
  
  document.getElementById('noteTitle').value = note.title;
  document.getElementById('noteContent').value = note.content || '';
  document.getElementById('noteTags').value = note.tags ? note.tags.join(', ') : '';
  
  document.getElementById('noteModalTitle').textContent = 'Editar Nota';
  document.getElementById('noteForm').dataset.noteId = noteId;
  document.getElementById('noteModal').classList.add('active');
}

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

function switchSection(sectionName) {
  document.querySelectorAll('.content-section').forEach(section => {
    section.style.display = 'none';
  });
  
  const targetSection = document.getElementById(sectionName + 'Section');
  if (targetSection) {
    targetSection.style.display = 'block';
    targetSection.classList.add('fade-in');
    
    // Carregar dados específicos da seção
    if (sectionName === 'profile') {
      loadProfile();
    } else if (sectionName === 'analytics') {
      refreshAnalytics();
    }
  }
  
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
  if (activeNavItem) {
    activeNavItem.classList.add('active');
  }
  
  if (sectionName === 'analytics') {
    loadAnalytics();
  }
}

function loadAnalytics() {
  const tasks = Object.values(state.tasks);
  const notes = Object.values(state.notes);
  
  document.getElementById('totalTasks').textContent = tasks.length;
  document.getElementById('completedTasks').textContent = tasks.filter(t => t.status === 'done').length;
  document.getElementById('totalNotes').textContent = notes.length;
  
  createTasksChart(tasks);
}

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
        backgroundColor: ['#f59e0b', '#3b82f6', '#10b981'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

function refreshAnalytics() {
  loadAnalytics();
  showToast('Analytics', 'Dados atualizados com sucesso!', '🔄');
}

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

function importData() {
  document.getElementById('importFile').click();
}

function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      if (!data.version || !data.boards || !data.tasks || !data.notes) {
        throw new Error('Formato de arquivo inválido');
      }
      
      if (!confirm('Importar dados substituirá seus dados atuais. Deseja continuar?')) {
        return;
      }
      
      state.boards = data.boards;
      state.tasks = data.tasks;
      state.notes = data.notes;
      state.settings = { ...state.settings, ...data.settings };
      
      await save();
      
      renderBoards();
      render();
      renderNotes();
      
      showToast('Dados Importados', 'Seus dados foram importados com sucesso!', '📥');
      
    } catch (error) {
      showToast('Erro na Importação', 'Falha ao importar dados: ' + error.message, '❌');
    }
  };
  
  reader.readAsText(file);
  event.target.value = '';
}

function clearAllData() {
  if (!confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
    return;
  }
  
  if (!confirm('ÚLTIMA AVISO: Todos os seus boards, tarefas e notas serão permanentemente excluídos.')) {
    return;
  }
  
  try {
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
    
    localStorage.removeItem(KEY);
    localStorage.removeItem('currentBoard');
    
    renderBoards();
    render();
    renderNotes();
    
    showToast('Dados Limpos', 'Todos os dados foram removidos com sucesso.', '🗑️');
    
  } catch (error) {
    handleError(error, 'clearAllData');
  }
}

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

function showCreateTaskModal(status, boardId) {
  const modal = document.getElementById('taskModal');
  if (modal) {
    modal.classList.add('active');
    document.getElementById('taskModalTitle').textContent = 'Criar Tarefa';
    document.getElementById('taskForm').reset();
    document.getElementById('taskStatus').value = status;
    
    if (boardId) {
      document.getElementById('taskForm').dataset.boardId = boardId;
    }
    
    delete document.getElementById('taskForm').dataset.taskId;
  }
}

async function createTask(event) {
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

async function createNote(event) {
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

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  
  const currentBoard = localStorage.getItem('currentBoard');
  if (currentBoard && state.boards[currentBoard]) {
    state.currentBoard = currentBoard;
  }
  
  document.getElementById('taskForm')?.addEventListener('submit', createTask);
  document.getElementById('noteForm')?.addEventListener('submit', createNote);
});

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
