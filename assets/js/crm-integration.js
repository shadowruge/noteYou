// CRM Integration - Integration with NoteYou App
// Connects the Real Estate CRM system with the existing application

let crmIntegration = null;

// Initialize CRM system when app loads
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for main app to initialize
    setTimeout(initializeCRMSystem, 1000);
});

// Initialize the CRM system
async function initializeCRMSystem() {
    try {
        crmIntegration = new CRMIntegration();
        
        // Initialize with existing data
        await crmIntegration.initialize(state);
        
        console.log('✅ CRM Imobiliário inicializado com sucesso');
        
        // Set up event listeners
        setupCRMEventListeners();
        
        // Update CRM displays
        updateCRMDisplays();
        
    } catch (error) {
        console.error('❌ Falha ao inicializar CRM:', error);
    }
}

// Set up event listeners for CRM sections
function setupCRMEventListeners() {
    // Listen for navigation to CRM sections
    document.querySelectorAll('[data-section="properties"], [data-section="clients"], [data-section="visits"]').forEach(link => {
        link.addEventListener('click', () => {
            setTimeout(() => {
                updateCRMDisplays();
            }, 100);
        });
    });
}

// Navigation handlers for CRM sections
function navigateToProperties() {
    hideAllSections();
    document.getElementById('propertiesSection').style.display = 'block';
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector('[data-section="properties"]').classList.add('active');
    
    updateCRMDisplays();
}

function navigateToClients() {
    hideAllSections();
    document.getElementById('clientsSection').style.display = 'block';
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector('[data-section="clients"]').classList.add('active');
    
    updateCRMDisplays();
}

function navigateToVisits() {
    hideAllSections();
    document.getElementById('visitsSection').style.display = 'block';
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector('[data-section="visits"]').classList.add('active');
    
    updateCRMDisplays();
}

// Update all CRM displays
function updateCRMDisplays() {
    if (!crmIntegration) return;
    
    updatePropertiesDisplay();
    updateClientsDisplay();
    updateVisitsDisplay();
    updateCRMStatistics();
}

// Update properties display
function updatePropertiesDisplay() {
    const properties = crmIntegration.getProperties();
    const container = document.getElementById('propertiesList');
    if (!container) return;
    
    if (properties.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <div style="font-size: 3rem; margin-bottom: 10px;">🏠</div>
                <p>Nenhum imóvel cadastrado ainda.</p>
                <button class="crm-btn success" onclick="showPropertyModal()" style="margin-top: 15px;">
                    ➕ Cadastrar Primeiro Imóvel
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = properties.map(property => `
        <div class="property-card" onclick="editProperty('${property.id}')">
            <div class="property-header">
                <div class="property-title">${property.title}</div>
                <div class="property-price">R$ ${property.price.toLocaleString('pt-BR')}</div>
            </div>
            <div class="property-status status-${property.status}">
                ${crmIntegration.crm.propertyStatus[property.status] || property.status}
            </div>
            <div class="property-details">
                <div class="property-detail">
                    <span>🏠</span> ${crmIntegration.crm.propertyTypes[property.type] || property.type}
                </div>
                <div class="property-detail">
                    <span>📐</span> ${property.area}m²
                </div>
                <div class="property-detail">
                    <span>🛏️</span> ${property.bedrooms} quartos
                </div>
                <div class="property-detail">
                    <span>🚿</span> ${property.bathrooms} banheiros
                </div>
                <div class="property-detail">
                    <span>🚗</span> ${property.parking} vagas
                </div>
                <div class="property-detail">
                    <span>📍</span> ${property.address}
                </div>
            </div>
            <div class="property-actions">
                <button class="property-action-btn" onclick="event.stopPropagation(); schedulePropertyVisit('${property.id}')">
                    📅 Agendar Visita
                </button>
                <button class="property-action-btn" onclick="event.stopPropagation(); editProperty('${property.id}')">
                    ✏️ Editar
                </button>
                <button class="property-action-btn" onclick="event.stopPropagation(); deleteProperty('${property.id}')">
                    🗑️ Excluir
                </button>
            </div>
        </div>
    `).join('');
}

// Update clients display
function updateClientsDisplay() {
    const clients = crmIntegration.getClients();
    const container = document.getElementById('clientsList');
    if (!container) return;
    
    if (clients.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <div style="font-size: 3rem; margin-bottom: 10px;">👥</div>
                <p>Nenhum cliente cadastrado ainda.</p>
                <button class="crm-btn success" onclick="showClientModal()" style="margin-top: 15px;">
                    ➕ Cadastrar Primeiro Cliente
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = clients.map(client => `
        <div class="client-card" onclick="editClient('${client.id}')">
            <div class="client-header">
                <div class="client-name">${client.name}</div>
                <div class="client-status status-${client.status}">
                    ${crmIntegration.crm.clientStatus[client.status] || client.status}
                </div>
            </div>
            <div class="client-contact">
                <div>📧 ${client.email}</div>
                <div>📱 ${client.phone}</div>
                ${client.whatsapp ? `<div>💬 ${client.whatsapp}</div>` : ''}
            </div>
            <div class="client-info">
                <div>💰 Orçamento: R$ ${client.budget.toLocaleString('pt-BR')}</div>
                <div>📂 Fonte: ${crmIntegration.crm.leadSources[client.source] || client.source}</div>
                <div>📅 Último contato: ${new Date(client.lastContact).toLocaleDateString('pt-BR')}</div>
            </div>
            <div class="client-actions">
                <button class="property-action-btn" onclick="event.stopPropagation(); scheduleClientVisit('${client.id}')">
                    📅 Agendar Visita
                </button>
                <button class="property-action-btn" onclick="event.stopPropagation(); editClient('${client.id}')">
                    ✏️ Editar
                </button>
                <button class="property-action-btn" onclick="event.stopPropagation(); deleteClient('${client.id}')">
                    🗑️ Excluir
                </button>
            </div>
        </div>
    `).join('');
}

// Update visits display
function updateVisitsDisplay() {
    const visits = crmIntegration.getVisits();
    const container = document.getElementById('visitsList');
    if (!container) return;
    
    if (visits.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <div style="font-size: 3rem; margin-bottom: 10px;">📅</div>
                <p>Nenhuma visita agendada ainda.</p>
                <button class="crm-btn success" onclick="showVisitModal()" style="margin-top: 15px;">
                    ➕ Agendar Primeira Visita
                </button>
            </div>
        `;
        return;
    }
    
    // Sort visits by date
    const sortedVisits = visits.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    container.innerHTML = sortedVisits.map(visit => {
        const property = crmIntegration.crm.properties.get(visit.propertyId);
        const client = crmIntegration.crm.clients.get(visit.clientId);
        
        return `
            <div class="visit-card">
                <div class="visit-header">
                    <div class="visit-date-time">
                        📅 ${new Date(visit.date).toLocaleDateString('pt-BR')} às ${visit.time}
                    </div>
                    <div class="visit-status status-${visit.status}">
                        ${visit.status === 'scheduled' ? 'Agendada' : 
                          visit.status === 'completed' ? 'Realizada' : 'Cancelada'}
                    </div>
                </div>
                <div class="visit-details">
                    <div><strong>Imóvel:</strong> ${property?.title || 'N/A'}</div>
                    <div><strong>Cliente:</strong> ${client?.name || 'N/A'}</div>
                    <div><strong>Duração:</strong> ${visit.duration} minutos</div>
                    ${visit.notes ? `<div><strong>Observações:</strong> ${visit.notes}</div>` : ''}
                </div>
                ${visit.feedback ? `
                    <div class="visit-feedback">
                        <strong>Feedback:</strong> ${visit.feedback}
                        ${visit.rating ? `<div>⭐ Avaliação: ${visit.rating}/5</div>` : ''}
                    </div>
                ` : ''}
                <div class="property-actions">
                    <button class="property-action-btn" onclick="editVisit('${visit.id}')">
                        ✏️ Editar
                    </button>
                    <button class="property-action-btn" onclick="completeVisit('${visit.id}')">
                        ✅ Realizar
                    </button>
                    <button class="property-action-btn" onclick="cancelVisit('${visit.id}')">
                        ❌ Cancelar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Update CRM statistics
function updateCRMStatistics() {
    if (!crmIntegration) return;
    
    const reports = crmIntegration.getReports();
    const overview = reports.overview;
    
    // Update properties stats
    document.getElementById('totalProperties').textContent = overview.totalProperties || 0;
    document.getElementById('availableProperties').textContent = reports.propertiesByStatus?.available || 0;
    document.getElementById('soldProperties').textContent = reports.propertiesByStatus?.sold || 0;
    
    // Calculate average price
    const properties = crmIntegration.getProperties();
    const avgPrice = properties.length > 0 ? 
        properties.reduce((sum, p) => sum + p.price, 0) / properties.length : 0;
    document.getElementById('avgPrice').textContent = `R$ ${avgPrice.toLocaleString('pt-BR', {maximumFractionDigits: 0})}`;
    
    // Update clients stats
    document.getElementById('totalClients').textContent = overview.totalClients || 0;
    document.getElementById('activeClients').textContent = reports.clientsByStatus?.active || 0;
    document.getElementById('leadClients').textContent = reports.clientsByStatus?.lead || 0;
    
    // Calculate average budget
    const clients = crmIntegration.getClients();
    const avgBudget = clients.length > 0 ? 
        clients.reduce((sum, c) => sum + c.budget, 0) / clients.length : 0;
    document.getElementById('avgBudget').textContent = `R$ ${avgBudget.toLocaleString('pt-BR', {maximumFractionDigits: 0})}`;
    
    // Update visits stats
    document.getElementById('totalVisits').textContent = overview.visitsThisMonth || 0;
    
    const today = new Date().toDateString();
    const todayVisits = crmIntegration.getVisits().filter(v => 
        new Date(v.date).toDateString() === today
    ).length;
    document.getElementById('todayVisits').textContent = todayVisits;
    
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekVisits = crmIntegration.getVisits().filter(v => 
        new Date(v.date) >= weekStart
    ).length;
    document.getElementById('weekVisits').textContent = weekVisits;
    
    const completedVisits = crmIntegration.getVisits().filter(v => 
        v.status === 'completed'
    ).length;
    document.getElementById('completedVisits').textContent = completedVisits;
}

// Search functions
function searchProperties() {
    const filters = {
        type: document.getElementById('propertyTypeFilter')?.value,
        status: document.getElementById('propertyStatusFilter')?.value,
        minPrice: parseFloat(document.getElementById('minPriceFilter')?.value) || 0,
        maxPrice: parseFloat(document.getElementById('maxPriceFilter')?.value) || 0,
        location: document.getElementById('propertyLocationFilter')?.value
    };
    
    const results = crmIntegration.searchProperties(filters);
    const container = document.getElementById('propertiesList');
    
    if (results.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <p>Nenhum imóvel encontrado com os filtros selecionados.</p>
            </div>
        `;
        return;
    }
    
    // Update display with search results (reuse updatePropertiesDisplay logic)
    container.innerHTML = results.map(property => `
        <div class="property-card" onclick="editProperty('${property.id}')">
            <div class="property-header">
                <div class="property-title">${property.title}</div>
                <div class="property-price">R$ ${property.price.toLocaleString('pt-BR')}</div>
            </div>
            <div class="property-status status-${property.status}">
                ${crmIntegration.crm.propertyStatus[property.status] || property.status}
            </div>
            <div class="property-details">
                <div class="property-detail">
                    <span>🏠</span> ${crmIntegration.crm.propertyTypes[property.type] || property.type}
                </div>
                <div class="property-detail">
                    <span>📐</span> ${property.area}m²
                </div>
                <div class="property-detail">
                    <span>🛏️</span> ${property.bedrooms} quartos
                </div>
                <div class="property-detail">
                    <span>🚿</span> ${property.bathrooms} banheiros
                </div>
                <div class="property-detail">
                    <span>🚗</span> ${property.parking} vagas
                </div>
                <div class="property-detail">
                    <span>📍</span> ${property.address}
                </div>
            </div>
            <div class="property-actions">
                <button class="property-action-btn" onclick="event.stopPropagation(); schedulePropertyVisit('${property.id}')">
                    📅 Agendar Visita
                </button>
                <button class="property-action-btn" onclick="event.stopPropagation(); editProperty('${property.id}')">
                    ✏️ Editar
                </button>
                <button class="property-action-btn" onclick="event.stopPropagation(); deleteProperty('${property.id}')">
                    🗑️ Excluir
                </button>
            </div>
        </div>
    `).join('');
}

function searchClients() {
    const filters = {
        status: document.getElementById('clientStatusFilter')?.value,
        source: document.getElementById('clientSourceFilter')?.value,
        name: document.getElementById('clientNameFilter')?.value,
        minBudget: parseFloat(document.getElementById('minBudgetFilter')?.value) || 0
    };
    
    const results = crmIntegration.searchClients(filters);
    const container = document.getElementById('clientsList');
    
    if (results.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <p>Nenhum cliente encontrado com os filtros selecionados.</p>
            </div>
        `;
        return;
    }
    
    // Update display with search results
    container.innerHTML = results.map(client => `
        <div class="client-card" onclick="editClient('${client.id}')">
            <div class="client-header">
                <div class="client-name">${client.name}</div>
                <div class="client-status status-${client.status}">
                    ${crmIntegration.crm.clientStatus[client.status] || client.status}
                </div>
            </div>
            <div class="client-contact">
                <div>📧 ${client.email}</div>
                <div>📱 ${client.phone}</div>
                ${client.whatsapp ? `<div>💬 ${client.whatsapp}</div>` : ''}
            </div>
            <div class="client-info">
                <div>💰 Orçamento: R$ ${client.budget.toLocaleString('pt-BR')}</div>
                <div>📂 Fonte: ${crmIntegration.crm.leadSources[client.source] || client.source}</div>
                <div>📅 Último contato: ${new Date(client.lastContact).toLocaleDateString('pt-BR')}</div>
            </div>
            <div class="client-actions">
                <button class="property-action-btn" onclick="event.stopPropagation(); scheduleClientVisit('${client.id}')">
                    📅 Agendar Visita
                </button>
                <button class="property-action-btn" onclick="event.stopPropagation(); editClient('${client.id}')">
                    ✏️ Editar
                </button>
                <button class="property-action-btn" onclick="event.stopPropagation(); deleteClient('${client.id}')">
                    🗑️ Excluir
                </button>
            </div>
        </div>
    `).join('');
}

// Clear filters
function clearPropertyFilters() {
    document.getElementById('propertyTypeFilter').value = '';
    document.getElementById('propertyStatusFilter').value = '';
    document.getElementById('minPriceFilter').value = '';
    document.getElementById('maxPriceFilter').value = '';
    updatePropertiesDisplay();
}

function clearClientFilters() {
    document.getElementById('clientStatusFilter').value = '';
    document.getElementById('clientSourceFilter').value = '';
    document.getElementById('clientNameFilter').value = '';
    document.getElementById('minBudgetFilter').value = '';
    updateClientsDisplay();
}

// Modal functions (placeholders for now)
function showPropertyModal(propertyId = null) {
    // TODO: Implement property modal
    showToast('Imóveis', 'Modal de imóveis em desenvolvimento', '🏠', 'info');
}

function showClientModal(clientId = null) {
    // TODO: Implement client modal
    showToast('Clientes', 'Modal de clientes em desenvolvimento', '👥', 'info');
}

function showVisitModal(visitId = null) {
    // TODO: Implement visit modal
    showToast('Visitas', 'Modal de visitas em desenvolvimento', '📅', 'info');
}

// Action functions (placeholders for now)
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
    if (confirm('Tem certeza que deseja excluir este imóvel?')) {
        crmIntegration.crm.properties.delete(propertyId);
        updatePropertiesDisplay();
        showToast('Imóveis', 'Imóvel excluído com sucesso', '🗑️', 'success');
    }
}

function deleteClient(clientId) {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
        crmIntegration.crm.clients.delete(clientId);
        updateClientsDisplay();
        showToast('Clientes', 'Cliente excluído com sucesso', '🗑️', 'success');
    }
}

function schedulePropertyVisit(propertyId) {
    showVisitModal();
    // Pre-select property in modal
}

function scheduleClientVisit(clientId) {
    showVisitModal();
    // Pre-select client in modal
}

function completeVisit(visitId) {
    const visit = crmIntegration.crm.visits.get(visitId);
    if (visit) {
        visit.status = 'completed';
        updateVisitsDisplay();
        showToast('Visitas', 'Visita marcada como realizada', '✅', 'success');
    }
}

function cancelVisit(visitId) {
    if (confirm('Tem certeza que deseja cancelar esta visita?')) {
        const visit = crmIntegration.crm.visits.get(visitId);
        if (visit) {
            visit.status = 'cancelled';
            updateVisitsDisplay();
            showToast('Visitas', 'Visita cancelada', '❌', 'success');
        }
    }
}

function showVisitCalendar() {
    showToast('Calendário', 'Visualização de calendário em desenvolvimento', '📆', 'info');
}

function exportVisits() {
    const visits = crmIntegration.getVisits();
    const dataStr = JSON.stringify(visits, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `visitas_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast('Exportar', 'Visitas exportadas com sucesso', '📤', 'success');
}

// Add CRM sections to navigation
function addCRMToNavigation() {
    const nav = document.querySelector('.sidebar-nav');
    if (!nav) return;
    
    // Check if CRM sections already exist
    if (nav.querySelector('[data-section="properties"]')) return;
    
    // Find analytics section to insert after it
    const analyticsSection = nav.querySelector('[data-section="analytics"]');
    if (!analyticsSection) return;
    
    // Create CRM sections
    const propertiesLink = document.createElement('a');
    propertiesLink.href = '#properties';
    propertiesLink.className = 'nav-item';
    propertiesLink.setAttribute('data-section', 'properties');
    propertiesLink.innerHTML = `
        <span class="nav-icon">🏠</span>
        Imóveis
    `;
    propertiesLink.onclick = navigateToProperties;
    
    const clientsLink = document.createElement('a');
    clientsLink.href = '#clients';
    clientsLink.className = 'nav-item';
    clientsLink.setAttribute('data-section', 'clients');
    clientsLink.innerHTML = `
        <span class="nav-icon">👥</span>
        Clientes
    `;
    clientsLink.onclick = navigateToClients;
    
    const visitsLink = document.createElement('a');
    visitsLink.href = '#visits';
    visitsLink.className = 'nav-item';
    visitsLink.setAttribute('data-section', 'visits');
    visitsLink.innerHTML = `
        <span class="nav-icon">📅</span>
        Visitas
    `;
    visitsLink.onclick = navigateToVisits;
    
    // Insert after analytics
    nav.insertBefore(propertiesLink, analyticsSection.nextSibling);
    nav.insertBefore(clientsLink, propertiesLink.nextSibling);
    nav.insertBefore(visitsLink, clientsLink.nextSibling);
}

// Initialize CRM navigation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(addCRMToNavigation, 500);
});

console.log('🏢 CRM Integration loaded successfully');
