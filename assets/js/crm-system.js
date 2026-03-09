// CRM Imobiliário - Sistema Completo para Corretores de Imóveis
// Transforma o gerenciamento de tarefas em um CRM especializado

class RealEstateCRM {
    constructor() {
        this.properties = new Map();
        this.clients = new Map();
        this.visits = new Map();
        this.negotiations = new Map();
        this.commissions = new Map();
        
        this.initializeCRM();
    }

    // Inicializa o sistema CRM
    initializeCRM() {
        // Status de imóveis
        this.propertyStatus = {
            'available': 'Disponível',
            'reserved': 'Reservado',
            'sold': 'Vendido',
            'rented': 'Alugado',
            'under_contract': 'Em Contrato',
            'maintenance': 'Em Manutenção'
        };

        // Status de clientes
        this.clientStatus = {
            'lead': 'Prospect',
            'active': 'Ativo',
            'visiting': 'Visitando',
            'negotiating': 'Negociando',
            'closed': 'Fechado',
            'inactive': 'Inativo'
        };

        // Tipos de imóveis
        this.propertyTypes = {
            'apartment': 'Apartamento',
            'house': 'Casa',
            'commercial': 'Comercial',
            'land': 'Terreno',
            'rural': 'Rural',
            'condo': 'Condomínio',
            'studio': 'Studio'
        };

        // Fontes de leads
        this.leadSources = {
            'website': 'Website',
            'social_media': 'Redes Sociais',
            'referral': 'Indicação',
            'sign': 'Placa',
            'portal': 'Portal Imobiliário',
            'event': 'Evento',
            'cold_call': 'Ligação Fria',
            'other': 'Outros'
        };
    }

    // Adiciona um imóvel
    addProperty(propertyData) {
        const property = {
            id: this.generateId('PROP'),
            title: propertyData.title || '',
            type: propertyData.type || 'apartment',
            status: propertyData.status || 'available',
            address: propertyData.address || '',
            price: parseFloat(propertyData.price) || 0,
            rentPrice: parseFloat(propertyData.rentPrice) || 0,
            area: parseFloat(propertyData.area) || 0,
            bedrooms: parseInt(propertyData.bedrooms) || 0,
            bathrooms: parseInt(propertyData.bathrooms) || 0,
            parking: parseInt(propertyData.parking) || 0,
            description: propertyData.description || '',
            features: propertyData.features || [],
            images: propertyData.images || [],
            owner: propertyData.owner || '',
            ownerContact: propertyData.ownerContact || '',
            commission: parseFloat(propertyData.commission) || 5,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            visits: [],
            favoriteClients: []
        };

        this.properties.set(property.id, property);
        return property;
    }

    // Adiciona um cliente
    addClient(clientData) {
        const client = {
            id: this.generateId('CLIENT'),
            name: clientData.name || '',
            email: clientData.email || '',
            phone: clientData.phone || '',
            whatsapp: clientData.whatsapp || '',
            source: clientData.source || 'other',
            status: clientData.status || 'lead',
            budget: parseFloat(clientData.budget) || 0,
            preferredTypes: clientData.preferredTypes || [],
            preferredAreas: clientData.preferredAreas || [],
            preferredLocations: clientData.preferredLocations || [],
            notes: clientData.notes || '',
            properties: [],
            visits: [],
            negotiations: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastContact: new Date().toISOString()
        };

        this.clients.set(client.id, client);
        return client;
    }

    // Agenda uma visita
    scheduleVisit(visitData) {
        const visit = {
            id: this.generateId('VISIT'),
            propertyId: visitData.propertyId,
            clientId: visitData.clientId,
            agentId: visitData.agentId || 'current',
            date: visitData.date,
            time: visitData.time,
            duration: visitData.duration || 60,
            status: visitData.status || 'scheduled',
            notes: visitData.notes || '',
            feedback: visitData.feedback || '',
            rating: parseInt(visitData.rating) || 0,
            createdAt: new Date().toISOString()
        };

        this.visits.set(visit.id, visit);
        
        // Adiciona visita ao imóvel e cliente
        const property = this.properties.get(visit.propertyId);
        const client = this.clients.get(visit.clientId);
        
        if (property) {
            property.visits.push(visit.id);
            property.updatedAt = new Date().toISOString();
        }
        
        if (client) {
            client.visits.push(visit.id);
            client.updatedAt = new Date().toISOString();
        }

        return visit;
    }

    // Inicia uma negociação
    startNegotiation(negotiationData) {
        const negotiation = {
            id: this.generateId('NEG'),
            propertyId: negotiationData.propertyId,
            clientId: negotiationData.clientId,
            type: negotiationData.type || 'sale', // sale, rent
            askingPrice: parseFloat(negotiationData.askingPrice) || 0,
            offeredPrice: parseFloat(negotiationData.offeredPrice) || 0,
            agreedPrice: parseFloat(negotiationData.agreedPrice) || 0,
            status: negotiationData.status || 'ongoing',
            startDate: negotiationData.startDate || new Date().toISOString(),
            endDate: negotiationData.endDate || null,
            commission: parseFloat(negotiationData.commission) || 5,
            terms: negotiationData.terms || '',
            conditions: negotiationData.conditions || [],
            documents: negotiationData.documents || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.negotiations.set(negotiation.id, negotiation);
        
        // Adiciona negociação ao imóvel e cliente
        const property = this.properties.get(negotiation.propertyId);
        const client = this.clients.get(negotiation.clientId);
        
        if (property) {
            property.status = 'under_contract';
            property.updatedAt = new Date().toISOString();
        }
        
        if (client) {
            client.negotiations.push(negotiation.id);
            client.status = 'negotiating';
            client.updatedAt = new Date().toISOString();
        }

        return negotiation;
    }

    // Calcula comissões
    calculateCommission(negotiationId, finalPrice) {
        const negotiation = this.negotiations.get(negotiationId);
        if (!negotiation) return 0;

        const commissionRate = negotiation.commission / 100;
        const commissionAmount = finalPrice * commissionRate;

        const commission = {
            id: this.generateId('COMM'),
            negotiationId: negotiationId,
            amount: commissionAmount,
            rate: negotiation.commission,
            status: 'pending',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
            paidDate: null,
            createdAt: new Date().toISOString()
        };

        this.commissions.set(commission.id, commission);
        return commission;
    }

    // Busca imóveis
    searchProperties(filters = {}) {
        let results = Array.from(this.properties.values());

        // Filtra por tipo
        if (filters.type) {
            results = results.filter(p => p.type === filters.type);
        }

        // Filtra por status
        if (filters.status) {
            results = results.filter(p => p.status === filters.status);
        }

        // Filtra por preço
        if (filters.minPrice) {
            results = results.filter(p => p.price >= filters.minPrice);
        }
        if (filters.maxPrice) {
            results = results.filter(p => p.price <= filters.maxPrice);
        }

        // Filtra por área
        if (filters.minArea) {
            results = results.filter(p => p.area >= filters.minArea);
        }
        if (filters.maxArea) {
            results = results.filter(p => p.area <= filters.maxArea);
        }

        // Filtra por quartos
        if (filters.bedrooms) {
            results = results.filter(p => p.bedrooms >= filters.bedrooms);
        }

        // Filtra por localização
        if (filters.location) {
            const location = filters.location.toLowerCase();
            results = results.filter(p => 
                p.address.toLowerCase().includes(location) ||
                p.neighborhood?.toLowerCase().includes(location)
            );
        }

        return results;
    }

    // Busca clientes
    searchClients(filters = {}) {
        let results = Array.from(this.clients.values());

        // Filtra por status
        if (filters.status) {
            results = results.filter(c => c.status === filters.status);
        }

        // Filtra por fonte
        if (filters.source) {
            results = results.filter(c => c.source === filters.source);
        }

        // Filtra por orçamento
        if (filters.minBudget) {
            results = results.filter(c => c.budget >= filters.minBudget);
        }
        if (filters.maxBudget) {
            results = results.filter(c => c.budget <= filters.maxBudget);
        }

        // Filtra por nome
        if (filters.name) {
            const name = filters.name.toLowerCase();
            results = results.filter(c => c.name.toLowerCase().includes(name));
        }

        return results;
    }

    // Gera relatórios
    generateReports() {
        const totalProperties = this.properties.size;
        const totalClients = this.clients.size;
        const activeNegotiations = Array.from(this.negotiations.values())
            .filter(n => n.status === 'ongoing').length;
        const monthlyRevenue = Array.from(this.commissions.values())
            .filter(c => c.status === 'paid' && 
                new Date(c.paidDate).getMonth() === new Date().getMonth())
            .reduce((sum, c) => sum + c.amount, 0);

        const propertiesByStatus = {};
        for (const status of Object.keys(this.propertyStatus)) {
            propertiesByStatus[status] = Array.from(this.properties.values())
                .filter(p => p.status === status).length;
        }

        const clientsByStatus = {};
        for (const status of Object.keys(this.clientStatus)) {
            clientsByStatus[status] = Array.from(this.clients.values())
                .filter(c => c.status === status).length;
        }

        const visitsThisMonth = Array.from(this.visits.values())
            .filter(v => new Date(v.date).getMonth() === new Date().getMonth()).length;

        return {
            overview: {
                totalProperties,
                totalClients,
                activeNegotiations,
                monthlyRevenue,
                visitsThisMonth
            },
            propertiesByStatus,
            clientsByStatus,
            topPerformingProperties: this.getTopProperties(),
            recentActivity: this.getRecentActivity()
        };
    }

    // Obtém melhores imóveis
    getTopProperties(limit = 5) {
        return Array.from(this.properties.values())
            .sort((a, b) => b.visits.length - a.visits.length)
            .slice(0, limit);
    }

    // Obtém atividades recentes
    getRecentActivity(limit = 10) {
        const activities = [];

        // Adiciona visitas recentes
        Array.from(this.visits.values())
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit)
            .forEach(visit => {
                const client = this.clients.get(visit.clientId);
                const property = this.properties.get(visit.propertyId);
                activities.push({
                    type: 'visit',
                    date: visit.createdAt,
                    description: `Visita agendada: ${client?.name} → ${property?.title}`,
                    details: visit
                });
            });

        // Adiciona negociações recentes
        Array.from(this.negotiations.values())
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit)
            .forEach(negotiation => {
                const client = this.clients.get(negotiation.clientId);
                const property = this.properties.get(negotiation.propertyId);
                activities.push({
                    type: 'negotiation',
                    date: negotiation.createdAt,
                    description: `Negociação iniciada: ${client?.name} ↔ ${property?.title}`,
                    details: negotiation
                });
            });

        return activities
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }

    // Gera ID único
    generateId(prefix) {
        return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Exporta dados
    exportData() {
        return {
            properties: Object.fromEntries(this.properties),
            clients: Object.fromEntries(this.clients),
            visits: Object.fromEntries(this.visits),
            negotiations: Object.fromEntries(this.negotiations),
            commissions: Object.fromEntries(this.commissions),
            metadata: {
                exportDate: new Date().toISOString(),
                version: '1.0'
            }
        };
    }

    // Importa dados
    importData(data) {
        if (data.properties) {
            this.properties = new Map(Object.entries(data.properties));
        }
        if (data.clients) {
            this.clients = new Map(Object.entries(data.clients));
        }
        if (data.visits) {
            this.visits = new Map(Object.entries(data.visits));
        }
        if (data.negotiations) {
            this.negotiations = new Map(Object.entries(data.negotiations));
        }
        if (data.commissions) {
            this.commissions = new Map(Object.entries(data.commissions));
        }
    }
}

// Integração com o sistema existente
class CRMIntegration {
    constructor() {
        this.crm = new RealEstateCRM();
        this.initialized = false;
    }

    // Inicializa o CRM
    async initialize(existingData = {}) {
        if (this.initialized) return;
        
        // Importa dados existentes se houver
        if (existingData.properties || existingData.clients) {
            this.crm.importData(existingData);
        }
        
        this.initialized = true;
        console.log('CRM Imobiliário inicializado');
    }

    // Converte tarefas existentes para o modelo CRM
    migrateFromTasks(tasks = {}) {
        const migrated = {
            properties: {},
            clients: {},
            visits: {},
            negotiations: {}
        };

        // Tenta identificar e converter tarefas relevantes
        for (const [taskId, task] of Object.entries(tasks)) {
            if (task.title?.toLowerCase().includes('imóvel') || 
                task.title?.toLowerCase().includes('propriedade')) {
                // Converte para imóvel
                const property = this.crm.addProperty({
                    title: task.title,
                    description: task.description,
                    status: 'available'
                });
                migrated.properties[property.id] = property;
            } else if (task.title?.toLowerCase().includes('cliente') || 
                       task.title?.toLowerCase().includes('contato')) {
                // Converte para cliente
                const client = this.crm.addClient({
                    name: task.title,
                    notes: task.description,
                    status: 'lead'
                });
                migrated.clients[client.id] = client;
            }
        }

        return migrated;
    }

    // Event handlers
    onPropertyCreated(property) {
        if (!this.initialized) return;
        return this.crm.addProperty(property);
    }

    onClientCreated(client) {
        if (!this.initialized) return;
        return this.crm.addClient(client);
    }

    onVisitScheduled(visit) {
        if (!this.initialized) return;
        return this.crm.scheduleVisit(visit);
    }

    onNegotiationStarted(negotiation) {
        if (!this.initialized) return;
        return this.crm.startNegotiation(negotiation);
    }

    // Getters para dados
    getProperties() {
        return Array.from(this.crm.properties.values());
    }

    getClients() {
        return Array.from(this.crm.clients.values());
    }

    getVisits() {
        return Array.from(this.crm.visits.values());
    }

    getNegotiations() {
        return Array.from(this.crm.negotiations.values());
    }

    getReports() {
        return this.crm.generateReports();
    }

    // Search functions
    searchProperties(filters) {
        return this.crm.searchProperties(filters);
    }

    searchClients(filters) {
        return this.crm.searchClients(filters);
    }

    // Export/Import
    exportData() {
        return this.crm.exportData();
    }

    importData(data) {
        return this.crm.importData(data);
    }
}

// Exporta classes para uso global
window.RealEstateCRM = RealEstateCRM;
window.CRMIntegration = CRMIntegration;
