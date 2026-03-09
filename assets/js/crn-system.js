// CRN System - Chemical Reaction Network for Task Management
// Transforma tarefas em reações químicas modeladas matematicamente

class CRNSystem {
    constructor() {
        this.species = new Map(); // Tipos de "moléculas" (tarefas)
        this.reactions = []; // Reações químicas (transições de estado)
        this.concentrations = new Map(); // Concentração de cada espécie
        this.rateConstants = new Map(); // Constantes de taxa para cada reação
        this.time = 0;
        this.history = [];
        
        this.initializeCRN();
    }

    // Inicializa o sistema CRN com estados básicos
    initializeCRN() {
        // Define as espécies (estados das tarefas)
        this.defineSpecies('todo', 'Tarefas Pendentes', 1.0);
        this.defineSpecies('inprogress', 'Em Progresso', 0.5);
        this.defineSpecies('done', 'Concluídas', 0.1);
        
        // Define as reações (transições entre estados)
        this.defineReaction('todo', 'inprogress', 0.3, 'start_work');
        this.defineReaction('inprogress', 'done', 0.5, 'complete_work');
        this.defineReaction('inprogress', 'todo', 0.1, 'revert_work');
        this.defineReaction('done', 'todo', 0.05, 'reopen_task');
        
        // Prioridades afetam as constantes de taxa
        this.priorityModifiers = {
            'low': 0.5,
            'medium': 1.0,
            'high': 2.0
        };
    }

    // Define uma espécie química (tipo de tarefa)
    defineSpecies(id, name, initialConcentration = 0) {
        this.species.set(id, {
            id,
            name,
            color: this.getSpeciesColor(id),
            molecularWeight: this.getMolecularWeight(id)
        });
        this.concentrations.set(id, initialConcentration);
    }

    // Define uma reação química (transição de estado)
    defineReaction(reactant, product, rateConstant, name) {
        const reaction = {
            id: `reaction_${reactant}_to_${product}`,
            reactant,
            product,
            rateConstant,
            name,
            activationEnergy: this.getActivationEnergy(reactant, product)
        };
        this.reactions.push(reaction);
        this.rateConstants.set(reaction.id, rateConstant);
    }

    // Simula uma etapa de tempo no sistema CRN
    simulateStep(deltaTime = 0.1) {
        const newConcentrations = new Map(this.concentrations);
        const reactionRates = [];

        // Calcula taxas de reação usando lei da ação de massa
        for (const reaction of this.reactions) {
            const reactantConc = this.concentrations.get(reaction.reactant) || 0;
            const rateConstant = this.rateConstants.get(reaction.id);
            const rate = rateConstant * reactantConc * deltaTime;
            
            reactionRates.push({
                reaction: reaction.id,
                rate,
                change: -rate
            });
            
            newConcentrations.set(reaction.reactant, 
                Math.max(0, (newConcentrations.get(reaction.reactant) || 0) - rate));
            newConcentrations.set(reaction.product,
                (newConcentrations.get(reaction.product) || 0) + rate);
        }

        // Atualiza concentrações
        this.concentrations = newConcentrations;
        this.time += deltaTime;
        
        // Registra histórico
        this.history.push({
            time: this.time,
            concentrations: new Map(this.concentrations),
            reactionRates
        });

        return {
            concentrations: Object.fromEntries(this.concentrations),
            reactionRates,
            time: this.time
        };
    }

    // Adiciona uma "molécula" (tarefa) ao sistema
    addMolecule(task) {
        const species = task.status || 'todo';
        const currentConc = this.concentrations.get(species) || 0;
        this.concentrations.set(species, currentConc + 1);
        
        // Ajusta constantes de taxa baseado na prioridade
        const modifier = this.priorityModifiers[task.priority] || 1.0;
        this.adjustRateConstants(modifier);
        
        return this.simulateStep();
    }

    // Remove uma "molécula" (tarefa) do sistema
    removeMolecule(task) {
        const species = task.status || 'todo';
        const currentConc = this.concentrations.get(species) || 0;
        this.concentrations.set(species, Math.max(0, currentConc - 1));
        
        return this.simulateStep();
    }

    // Ajusta constantes de taxa baseado em modificadores
    adjustRateConstants(modifier) {
        for (const reaction of this.reactions) {
            const baseRate = this.rateConstants.get(reaction.id);
            this.rateConstants.set(reaction.id, baseRate * modifier);
        }
    }

    // Converte tarefas existentes para o modelo CRN
    convertTasksToCRN(tasks) {
        // Reset concentrations
        for (const speciesId of this.species.keys()) {
            this.concentrations.set(speciesId, 0);
        }

        // Conta tarefas por estado
        const taskCounts = {};
        for (const task of Object.values(tasks)) {
            const status = task.status || 'todo';
            taskCounts[status] = (taskCounts[status] || 0) + 1;
        }

        // Define concentrações iniciais
        for (const [status, count] of Object.entries(taskCounts)) {
            this.concentrations.set(status, count);
        }

        return this.simulateStep();
    }

    // Gera visualização do sistema CRN
    generateVisualization() {
        const nodes = [];
        const edges = [];

        // Cria nós para espécies
        for (const [id, species] of this.species) {
            const concentration = this.concentrations.get(id) || 0;
            nodes.push({
                id,
                label: `${species.name}\n[${concentration.toFixed(2)}]`,
                color: species.color,
                size: Math.max(20, concentration * 20),
                type: 'species'
            });
        }

        // Cria arestas para reações
        for (const reaction of this.reactions) {
            const rate = this.rateConstants.get(reaction.id) || 0;
            edges.push({
                from: reaction.reactant,
                to: reaction.product,
                label: `${reaction.name}\nk=${rate}`,
                arrows: 'to',
                width: Math.max(1, rate * 5),
                color: { color: '#666' }
            });
        }

        return { nodes, edges };
    }

    // Obtém estatísticas do sistema CRN
    getStatistics() {
        const totalMolecules = Array.from(this.concentrations.values())
            .reduce((sum, conc) => sum + conc, 0);

        const dominantSpecies = Array.from(this.concentrations.entries())
            .reduce((max, [id, conc]) => conc > max.conc ? { id, conc } : max, { id: null, conc: 0 });

        const reactionActivity = this.reactions.map(reaction => ({
            reaction: reaction.id,
            rate: this.rateConstants.get(reaction.id) || 0,
            activity: (this.concentrations.get(reaction.reactant) || 0) * (this.rateConstants.get(reaction.id) || 0)
        }));

        return {
            totalMolecules,
            dominantSpecies: dominantSpecies.id,
            time: this.time,
            reactionActivity,
            systemStability: this.calculateStability()
        };
    }

    // Calcula estabilidade do sistema
    calculateStability() {
        // Sistema estável quando há equilíbrio entre concentrações
        const concentrations = Array.from(this.concentrations.values());
        const mean = concentrations.reduce((sum, c) => sum + c, 0) / concentrations.length;
        const variance = concentrations.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / concentrations.length;
        
        // Baixa variância = sistema estável
        return Math.max(0, 1 - (variance / (mean * mean)));
    }

    // Funções auxiliares
    getSpeciesColor(speciesId) {
        const colors = {
            'todo': '#ff6b6b',
            'inprogress': '#feca57', 
            'done': '#48dbfb'
        };
        return colors[speciesId] || '#95a5a6';
    }

    getMolecularWeight(speciesId) {
        const weights = {
            'todo': 100,
            'inprogress': 150,
            'done': 50
        };
        return weights[speciesId] || 100;
    }

    getActivationEnergy(reactant, product) {
        // Energia de ativação baseada na dificuldade da transição
        const energies = {
            'todo_to_inprogress': 20,
            'inprogress_to_done': 30,
            'inprogress_to_todo': 10,
            'done_to_todo': 25
        };
        return energies[`${reactant}_to_${product}`] || 15;
    }

    // Exporta dados para análise
    exportData() {
        return {
            species: Object.fromEntries(this.species),
            reactions: this.reactions,
            concentrations: Object.fromEntries(this.concentrations),
            rateConstants: Object.fromEntries(this.rateConstants),
            history: this.history,
            statistics: this.getStatistics()
        };
    }
}

// Integração com o sistema NoteYou existente
class CRNIntegration {
    constructor() {
        this.crn = new CRNSystem();
        this.initialized = false;
    }

    // Inicializa o sistema CRN com dados existentes
    async initialize(existingTasks = {}) {
        if (this.initialized) return;
        
        // Converte tarefas existentes para modelo CRN
        this.crn.convertTasksToCRN(existingTasks);
        this.initialized = true;
        
        console.log('CRN System initialized with', Object.keys(existingTasks).length, 'tasks');
    }

    // Atualiza o CRN quando uma tarefa é modificada
    onTaskCreated(task) {
        if (!this.initialized) return;
        return this.crn.addMolecule(task);
    }

    onTaskUpdated(oldTask, newTask) {
        if (!this.initialized) return;
        
        // Remove tarefa do estado antigo
        this.crn.removeMolecule(oldTask);
        
        // Adiciona ao novo estado
        return this.crn.addMolecule(newTask);
    }

    onTaskDeleted(task) {
        if (!this.initialized) return;
        return this.crn.removeMolecule(task);
    }

    // Simula evolução do sistema
    simulateEvolution(steps = 10) {
        if (!this.initialized) return [];
        
        const results = [];
        for (let i = 0; i < steps; i++) {
            const step = this.crn.simulateStep();
            results.push(step);
        }
        
        return results;
    }

    // Obtém visualização para o dashboard
    getVisualization() {
        if (!this.initialized) return null;
        return this.crn.generateVisualization();
    }

    // Obtém estatísticas para analytics
    getAnalytics() {
        if (!this.initialized) return null;
        return this.crn.getStatistics();
    }
}

// Exporta classes para uso global
window.CRNSystem = CRNSystem;
window.CRNIntegration = CRNIntegration;
