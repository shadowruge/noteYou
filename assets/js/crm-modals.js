// ===== MODAIS DO CRM =====

// Variável global para dados do CRM (compatibilidade)
let crmData = {
  properties: {},
  clients: {},
  visits: {}
};

// Função para salvar dados do CRM (compatibilidade)
function saveCRMData() {
  try {
    // Salvar no localStorage
    localStorage.setItem('noteyou_crm_data', JSON.stringify(crmData));
    console.log('✅ Dados do CRM salvos com sucesso');
  } catch (error) {
    console.error('❌ Erro ao salvar dados do CRM:', error);
  }
}

// Função para carregar dados do CRM (compatibilidade)
function loadCRMData() {
  try {
    const savedData = localStorage.getItem('noteyou_crm_data');
    if (savedData) {
      crmData = JSON.parse(savedData);
      console.log('✅ Dados do CRM carregados com sucesso');
    }
  } catch (error) {
    console.error('❌ Erro ao carregar dados do CRM:', error);
  }
}

// Carregar dados ao iniciar
loadCRMData();

// Modal de Imóveis
function showPropertyModal(propertyId = null) {
  const modal = document.getElementById('propertyModal');
  if (!modal) return;
  
  // Resetar formulário
  document.getElementById('propertyForm').reset();
  
  if (propertyId) {
    // Modo edição
    const property = crmData.properties[propertyId];
    if (property) {
      document.getElementById('propertyModalTitle').textContent = 'Editar Imóvel';
      document.getElementById('propertyType').value = property.type || '';
      document.getElementById('propertyStatus').value = property.status || '';
      document.getElementById('propertyTitle').value = property.title || '';
      document.getElementById('propertyPrice').value = property.price || '';
      document.getElementById('propertyArea').value = property.area || '';
      document.getElementById('propertyBedrooms').value = property.bedrooms || '';
      document.getElementById('propertyBathrooms').value = property.bathrooms || '';
      document.getElementById('propertyAddress').value = property.address || '';
      document.getElementById('propertyDescription').value = property.description || '';
      
      document.getElementById('propertyForm').dataset.propertyId = propertyId;
    }
  } else {
    // Modo criação
    document.getElementById('propertyModalTitle').textContent = 'Cadastrar Imóvel';
    delete document.getElementById('propertyForm').dataset.propertyId;
  }
  
  modal.classList.add('active');
}

// Salvar Imóvel
async function saveProperty(event) {
  event.preventDefault();
  
  try {
    const propertyId = event.target.dataset.propertyId;
    const isEdit = !!propertyId;
    
    const property = {
      id: propertyId || 'prop_' + Date.now(),
      type: document.getElementById('propertyType').value,
      status: document.getElementById('propertyStatus').value,
      title: document.getElementById('propertyTitle').value,
      price: parseFloat(document.getElementById('propertyPrice').value),
      area: parseInt(document.getElementById('propertyArea').value),
      bedrooms: parseInt(document.getElementById('propertyBedrooms').value),
      bathrooms: parseInt(document.getElementById('propertyBathrooms').value),
      address: document.getElementById('propertyAddress').value,
      description: document.getElementById('propertyDescription').value,
      created_at: isEdit ? crmData.properties[propertyId]?.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Salvar no CRM
    crmData.properties[property.id] = property;
    saveCRMData();
    
    // Atualizar interface
    renderProperties();
    
    closeModal('propertyModal');
    showToast(
      isEdit ? 'Imóvel Atualizado' : 'Imóvel Cadastrado',
      `Imóvel ${isEdit ? 'atualizado' : 'cadastrado'} com sucesso!`,
      '🏠'
    );
    
  } catch (error) {
    console.error('Erro ao salvar imóvel:', error);
    showToast('Erro', 'Ocorreu um erro ao salvar o imóvel.', '❌');
  }
}

// Modal de Clientes
function showClientModal(clientId = null) {
  const modal = document.getElementById('clientModal');
  if (!modal) return;
  
  // Resetar formulário
  document.getElementById('clientForm').reset();
  
  if (clientId) {
    // Modo edição
    const client = crmData.clients[clientId];
    if (client) {
      document.getElementById('clientModalTitle').textContent = 'Editar Cliente';
      document.getElementById('clientName').value = client.name || '';
      document.getElementById('clientType').value = client.type || '';
      document.getElementById('clientEmail').value = client.email || '';
      document.getElementById('clientPhone').value = client.phone || '';
      document.getElementById('clientWhatsApp').value = client.whatsapp || '';
      document.getElementById('clientCPF').value = client.cpf || '';
      document.getElementById('clientBudget').value = client.budget || '';
      document.getElementById('clientPreferences').value = client.preferences || '';
      document.getElementById('clientNotes').value = client.notes || '';
      
      document.getElementById('clientForm').dataset.clientId = clientId;
    }
  } else {
    // Modo criação
    document.getElementById('clientModalTitle').textContent = 'Cadastrar Cliente';
    delete document.getElementById('clientForm').dataset.clientId;
  }
  
  modal.classList.add('active');
}

// Salvar Cliente
async function saveClient(event) {
  event.preventDefault();
  
  try {
    const clientId = event.target.dataset.clientId;
    const isEdit = !!clientId;
    
    const client = {
      id: clientId || 'client_' + Date.now(),
      name: document.getElementById('clientName').value,
      type: document.getElementById('clientType').value,
      email: document.getElementById('clientEmail').value,
      phone: document.getElementById('clientPhone').value,
      whatsapp: document.getElementById('clientWhatsApp').value,
      cpf: document.getElementById('clientCPF').value,
      budget: parseFloat(document.getElementById('clientBudget').value) || 0,
      preferences: document.getElementById('clientPreferences').value,
      notes: document.getElementById('clientNotes').value,
      created_at: isEdit ? crmData.clients[clientId]?.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Salvar no CRM
    crmData.clients[client.id] = client;
    saveCRMData();
    
    // Atualizar interface
    renderClients();
    
    closeModal('clientModal');
    showToast(
      isEdit ? 'Cliente Atualizado' : 'Cliente Cadastrado',
      `Cliente ${isEdit ? 'atualizado' : 'cadastrado'} com sucesso!`,
      '👥'
    );
    
  } catch (error) {
    console.error('Erro ao salvar cliente:', error);
    showToast('Erro', 'Ocorreu um erro ao salvar o cliente.', '❌');
  }
}

// Modal de Visitas
function showVisitModal(visitId = null) {
  const modal = document.getElementById('visitModal');
  if (!modal) return;
  
  // Resetar formulário
  document.getElementById('visitForm').reset();
  
  // Popular selects dinamicamente
  populatePropertySelect();
  populateClientSelect();
  
  if (visitId) {
    // Modo edição
    const visit = crmData.visits[visitId];
    if (visit) {
      document.getElementById('visitModalTitle').textContent = 'Editar Visita';
      document.getElementById('visitType').value = visit.type || '';
      document.getElementById('visitStatus').value = visit.status || '';
      document.getElementById('visitDate').value = visit.date || '';
      document.getElementById('visitTime').value = visit.time || '';
      document.getElementById('visitProperty').value = visit.propertyId || '';
      document.getElementById('visitClient').value = visit.clientId || '';
      document.getElementById('visitLocation').value = visit.location || '';
      document.getElementById('visitDescription').value = visit.description || '';
      
      document.getElementById('visitForm').dataset.visitId = visitId;
    }
  } else {
    // Modo criação
    document.getElementById('visitModalTitle').textContent = 'Agendar Visita';
    delete document.getElementById('visitForm').dataset.visitId;
    
    // Definir data/hora padrão
    const now = new Date();
    document.getElementById('visitDate').value = now.toISOString().split('T')[0];
    document.getElementById('visitTime').value = now.toTimeString().slice(0, 5);
  }
  
  modal.classList.add('active');
}

// Popular select de imóveis
function populatePropertySelect() {
  const select = document.getElementById('visitProperty');
  if (!select) return;
  
  select.innerHTML = '<option value="">Selecione...</option>';
  
  Object.values(crmData.properties).forEach(property => {
    if (property.status === 'disponivel') {
      const option = document.createElement('option');
      option.value = property.id;
      option.textContent = `${property.title} - ${property.type}`;
      select.appendChild(option);
    }
  });
}

// Popular select de clientes
function populateClientSelect() {
  const select = document.getElementById('visitClient');
  if (!select) return;
  
  select.innerHTML = '<option value="">Selecione...</option>';
  
  Object.values(crmData.clients).forEach(client => {
    const option = document.createElement('option');
    option.value = client.id;
    option.textContent = `${client.name} - ${client.type}`;
    select.appendChild(option);
  });
}

// Salvar Visita
async function saveVisit(event) {
  event.preventDefault();
  
  try {
    const visitId = event.target.dataset.visitId;
    const isEdit = !!visitId;
    
    const visit = {
      id: visitId || 'visit_' + Date.now(),
      type: document.getElementById('visitType').value,
      status: document.getElementById('visitStatus').value,
      date: document.getElementById('visitDate').value,
      time: document.getElementById('visitTime').value,
      propertyId: document.getElementById('visitProperty').value,
      clientId: document.getElementById('visitClient').value,
      location: document.getElementById('visitLocation').value,
      description: document.getElementById('visitDescription').value,
      created_at: isEdit ? crmData.visits[visitId]?.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Adicionar informações relacionadas
    const property = crmData.properties[visit.propertyId];
    const client = crmData.clients[visit.clientId];
    
    if (property) {
      visit.propertyTitle = property.title;
      visit.propertyAddress = property.address;
    }
    
    if (client) {
      visit.clientName = client.name;
      visit.clientPhone = client.phone;
    }
    
    // Salvar no CRM
    crmData.visits[visit.id] = visit;
    saveCRMData();
    
    // Atualizar interface
    renderVisits();
    
    closeModal('visitModal');
    showToast(
      isEdit ? 'Visita Atualizada' : 'Visita Agendada',
      `Visita ${isEdit ? 'atualizada' : 'agendada'} com sucesso!`,
      '📅'
    );
    
  } catch (error) {
    console.error('Erro ao salvar visita:', error);
    showToast('Erro', 'Ocorreu um erro ao salvar a visita.', '❌');
  }
}

// Funções auxiliares
function editProperty(propertyId) {
  showPropertyModal(propertyId);
}

function editClient(clientId) {
  showClientModal(clientId);
}

function editVisit(visitId) {
  showVisitModal(visitId);
}

function deleteProperty(propertyId) {
  if (!confirm('Tem certeza que deseja excluir este imóvel?')) return;
  
  try {
    delete crmData.properties[propertyId];
    saveCRMData();
    renderProperties();
    showToast('Imóvel Excluído', 'Imóvel excluído com sucesso.', '🗑️');
  } catch (error) {
    console.error('Erro ao excluir imóvel:', error);
    showToast('Erro', 'Ocorreu um erro ao excluir o imóvel.', '❌');
  }
}

function deleteClient(clientId) {
  if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
  
  try {
    delete crmData.clients[clientId];
    saveCRMData();
    renderClients();
    showToast('Cliente Excluído', 'Cliente excluído com sucesso.', '🗑️');
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    showToast('Erro', 'Ocorreu um erro ao excluir o cliente.', '❌');
  }
}

function deleteVisit(visitId) {
  if (!confirm('Tem certeza que deseja excluir esta visita?')) return;
  
  try {
    delete crmData.visits[visitId];
    saveCRMData();
    renderVisits();
    showToast('Visita Excluída', 'Visita excluída com sucesso.', '🗑️');
  } catch (error) {
    console.error('Erro ao excluir visita:', error);
    showToast('Erro', 'Ocorreu um erro ao excluir a visita.', '❌');
  }
}

function schedulePropertyVisit(propertyId) {
  showVisitModal();
  // Pré-selecionar o imóvel
  setTimeout(() => {
    document.getElementById('visitProperty').value = propertyId;
  }, 100);
}

function scheduleClientVisit(clientId) {
  showVisitModal();
  // Pré-selecionar o cliente
  setTimeout(() => {
    document.getElementById('visitClient').value = clientId;
  }, 100);
}

// Funções para renderizar dados (compatibilidade)
function renderProperties() {
  // Atualizar display de propriedades se existir
  const propertiesContainer = document.getElementById('propertiesContainer');
  if (propertiesContainer) {
    // Implementar renderização básica
    console.log('🔄 Renderizando propriedades...');
  }
}

function renderClients() {
  // Atualizar display de clientes se existir
  const clientsContainer = document.getElementById('clientsContainer');
  if (clientsContainer) {
    // Implementar renderização básica
    console.log('🔄 Renderizando clientes...');
  }
}

function renderVisits() {
  // Atualizar display de visitas se existir
  const visitsContainer = document.getElementById('visitsContainer');
  if (visitsContainer) {
    // Implementar renderização básica
    console.log('🔄 Renderizando visitas...');
  }
}

// Exportar funções para uso global - GARANTIR QUE SEJAM AS ÚLTIMAS A SEREM DEFINIDAS
window.showPropertyModal = showPropertyModal;
window.showClientModal = showClientModal;
window.showVisitModal = showVisitModal;
window.saveProperty = saveProperty;
window.saveClient = saveClient;
window.saveVisit = saveVisit;
window.editProperty = editProperty;
window.editClient = editClient;
window.editVisit = editVisit;
window.deleteProperty = deleteProperty;
window.deleteClient = deleteClient;
window.deleteVisit = deleteVisit;
window.schedulePropertyVisit = schedulePropertyVisit;
window.scheduleClientVisit = scheduleClientVisit;
window.renderProperties = renderProperties;
window.renderClients = renderClients;
window.renderVisits = renderVisits;
window.crmData = crmData;
window.saveCRMData = saveCRMData;
window.loadCRMData = loadCRMData;

// Forçar redefinição das funções caso tenham sido sobrescritas
setTimeout(() => {
  console.log('🔧 Redefinindo funções dos modais CRM...');
  window.showPropertyModal = showPropertyModal;
  window.showClientModal = showClientModal;
  window.showVisitModal = showVisitModal;
  console.log('✅ Funções dos modais CRM redefinidas com sucesso!');
}, 100);
