// CRN Integration - Integration with NoteYou App
// Connects the Chemical Reaction Network system with the existing task management

let crnIntegration = null;
let crnSimulationInterval = null;
let crnVisualizationChart = null;

// Initialize CRN system when app loads
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for main app to initialize
    setTimeout(initializeCRNSystem, 1000);
});

// Initialize the CRN system
async function initializeCRNSystem() {
    try {
        crnIntegration = new CRNIntegration();
        
        // Initialize with existing tasks
        await crnIntegration.initialize(state.tasks || {});
        
        console.log('✅ CRN System initialized successfully');
        
        // Set up event listeners for task changes
        setupCRNEventListeners();
        
        // Update CRN display
        updateCRNDisplay();
        
    } catch (error) {
        console.error('❌ Failed to initialize CRN system:', error);
    }
}

// Set up event listeners for task changes
function setupCRNEventListeners() {
    // Listen for navigation to CRN section
    document.querySelectorAll('[data-section="crn"]').forEach(link => {
        link.addEventListener('click', () => {
            setTimeout(() => {
                initializeCRNVisualization();
                updateCRNDisplay();
            }, 100);
        });
    });
}

// Navigation handler for CRN section
function navigateToCRN() {
    hideAllSections();
    document.getElementById('crnSection').style.display = 'block';
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector('[data-section="crn"]').classList.add('active');
    
    // Initialize visualization if needed
    if (!crnVisualizationChart) {
        initializeCRNVisualization();
    }
    
    updateCRNDisplay();
}

// Initialize CRN visualization
function initializeCRNVisualization() {
    const canvas = document.getElementById('crnCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 400;
    
    // Create visualization
    drawCRNNetwork(ctx, canvas.width, canvas.height);
}

// Draw CRN network visualization
function drawCRNNetwork(ctx, width, height) {
    if (!crnIntegration || !crnIntegration.crn) return;
    
    const visualization = crnIntegration.getVisualization();
    if (!visualization) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.1)');
    gradient.addColorStop(1, 'rgba(118, 75, 162, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Position nodes in a triangle formation
    const nodePositions = {
        'todo': { x: width * 0.2, y: height * 0.7 },
        'inprogress': { x: width * 0.5, y: height * 0.3 },
        'done': { x: width * 0.8, y: height * 0.7 }
    };
    
    // Draw edges (reactions)
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    
    visualization.edges.forEach(edge => {
        const from = nodePositions[edge.from];
        const to = nodePositions[edge.to];
        
        if (from && to) {
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
            
            // Draw arrow
            drawArrow(ctx, from, to);
        }
    });
    
    // Draw nodes (species)
    visualization.nodes.forEach(node => {
        const pos = nodePositions[node.id];
        if (!pos) return;
        
        // Node circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, node.size, 0, 2 * Math.PI);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Node label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label.split('\n')[0], pos.x, pos.y - 5);
        
        // Concentration
        ctx.font = '12px Arial';
        ctx.fillText(`[${node.label.split('\n')[1].replace('[', '').replace(']', '')}]`, pos.x, pos.y + 10);
    });
}

// Draw arrow between two points
function drawArrow(ctx, from, to) {
    const headLength = 15;
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLength * Math.cos(angle - Math.PI / 6), to.y - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLength * Math.cos(angle + Math.PI / 6), to.y - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}

// Update CRN display with current data
function updateCRNDisplay() {
    if (!crnIntegration || !crnIntegration.crn) return;
    
    const stats = crnIntegration.getAnalytics();
    if (!stats) return;
    
    // Update statistics
    document.getElementById('crnTotalMolecules').textContent = stats.totalMolecules || 0;
    document.getElementById('crnSystemTime').textContent = (stats.time || 0).toFixed(1);
    document.getElementById('crnStability').textContent = Math.round((stats.systemStability || 0) * 100) + '%';
    document.getElementById('crnActiveReactions').textContent = 
        (stats.reactionActivity || []).filter(r => r.activity > 0.1).length;
    
    // Update progress bar
    const progress = stats.systemStability ? stats.systemStability * 100 : 0;
    document.getElementById('crnSystemProgress').style.width = progress + '%';
    
    // Update analysis text
    updateCRNAnalysis(stats);
    
    // Redraw visualization
    const canvas = document.getElementById('crnCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        drawCRNNetwork(ctx, canvas.width, canvas.height);
    }
}

// Update CRN analysis text
function updateCRNAnalysis(stats) {
    const analysisEl = document.getElementById('crnAnalysis');
    if (!analysisEl) return;
    
    let analysis = '';
    
    if (stats.totalMolecules === 0) {
        analysis = '🔬 Nenhuma molécula (tarefa) detectada. Adicione tarefas para iniciar as reações químicas.';
    } else if (stats.systemStability > 0.8) {
        analysis = `⚖️ Sistema em equilíbrio estável com ${stats.totalMolecules} moléculas. As reações estão balanceadas.`;
    } else if (stats.systemStability > 0.5) {
        analysis = `🔄 Sistema em transição com ${stats.totalMolecules} moléculas. Reações ativas buscando equilíbrio.`;
    } else {
        analysis = `⚡ Sistema altamente dinâmico! ${stats.totalMolecules} moléculas gerando muitas reações.`;
    }
    
    // Add dominant species info
    if (stats.dominantSpecies) {
        const species = crnIntegration.crn.species.get(stats.dominantSpecies);
        if (species) {
            analysis += `\n\n🧪 Espécie dominante: ${species.name} (${stats.dominantSpecies})`;
        }
    }
    
    // Add activity info
    const activeReactions = (stats.reactionActivity || []).filter(r => r.activity > 0.1);
    if (activeReactions.length > 0) {
        analysis += `\n\n⚗️ Reações mais ativas: ${activeReactions.map(r => r.reaction).join(', ')}`;
    }
    
    analysisEl.textContent = analysis;
}

// CRN Simulation Controls
function startCRNSimulation() {
    if (!crnIntegration) return;
    
    if (crnSimulationInterval) {
        clearInterval(crnSimulationInterval);
    }
    
    crnSimulationInterval = setInterval(() => {
        crnIntegration.simulateEvolution(1);
        updateCRNDisplay();
    }, 500);
    
    showToast('Simulação CRN', 'Simulação iniciada', '▶️', 'success');
}

function pauseCRNSimulation() {
    if (crnSimulationInterval) {
        clearInterval(crnSimulationInterval);
        crnSimulationInterval = null;
        showToast('Simulação CRN', 'Simulação pausada', '⏸️', 'info');
    }
}

function resetCRNSystem() {
    pauseCRNSimulation();
    
    if (crnIntegration) {
        crnIntegration.crn = new CRNSystem();
        crnIntegration.initialize(state.tasks || {});
        updateCRNDisplay();
        showToast('Sistema CRN', 'Sistema resetado', '🔄', 'success');
    }
}

function stepCRNSimulation() {
    if (!crnIntegration) return;
    
    crnIntegration.simulateEvolution(1);
    updateCRNDisplay();
}

// Override task functions to integrate with CRN
const originalCreateTask = window.createTask;
const originalUpdateTask = window.updateTask;
const originalDeleteTask = window.deleteTask;

// Enhanced create task function
window.createTask = async function(event) {
    const result = await originalCreateTask(event);
    
    if (result && crnIntegration) {
        crnIntegration.onTaskCreated(result);
        updateCRNDisplay();
    }
    
    return result;
};

// Enhanced update task function  
window.updateTask = async function(taskId, updates) {
    const oldTask = state.tasks[taskId];
    const result = await originalUpdateTask(taskId, updates);
    
    if (result && crnIntegration && oldTask) {
        const newTask = { ...oldTask, ...updates };
        crnIntegration.onTaskUpdated(oldTask, newTask);
        updateCRNDisplay();
    }
    
    return result;
};

// Enhanced delete task function
window.deleteTask = async function(taskId) {
    const task = state.tasks[taskId];
    const result = await originalDeleteTask(taskId);
    
    if (result && crnIntegration && task) {
        crnIntegration.onTaskDeleted(task);
        updateCRNDisplay();
    }
    
    return result;
};

// Export CRN data
function exportCRNData() {
    if (!crnIntegration) return null;
    
    return crnIntegration.crn.exportData();
}

// Import CRN data
function importCRNData(data) {
    if (!crnIntegration) return false;
    
    try {
        crnIntegration.crn = new CRNSystem();
        
        // Restore species
        if (data.species) {
            for (const [id, species] of Object.entries(data.species)) {
                crnIntegration.crn.species.set(id, species);
            }
        }
        
        // Restore reactions
        if (data.reactions) {
            crnIntegration.crn.reactions = data.reactions;
        }
        
        // Restore concentrations
        if (data.concentrations) {
            for (const [id, conc] of Object.entries(data.concentrations)) {
                crnIntegration.crn.concentrations.set(id, conc);
            }
        }
        
        // Restore rate constants
        if (data.rateConstants) {
            for (const [id, rate] of Object.entries(data.rateConstants)) {
                crnIntegration.crn.rateConstants.set(id, rate);
            }
        }
        
        updateCRNDisplay();
        return true;
    } catch (error) {
        console.error('Failed to import CRN data:', error);
        return false;
    }
}

// Add CRN section to navigation
function addCRNToNavigation() {
    const nav = document.querySelector('.sidebar-nav');
    if (nav && !nav.querySelector('[data-section="crn"]')) {
        const crnLink = document.createElement('a');
        crnLink.href = '#crn';
        crnLink.className = 'nav-item';
        crnLink.setAttribute('data-section', 'crn');
        crnLink.innerHTML = `
            <span class="nav-icon">⚗️</span>
            CRN
        `;
        crnLink.onclick = navigateToCRN;
        
        const analyticsLink = nav.querySelector('[data-section="analytics"]');
        if (analyticsLink) {
            nav.insertBefore(crnLink, analyticsLink.nextSibling);
        }
    }
}

// Initialize CRN navigation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(addCRNToNavigation, 500);
});

// Handle window resize for CRN visualization
window.addEventListener('resize', () => {
    if (document.getElementById('crnSection').style.display !== 'none') {
        initializeCRNVisualization();
    }
});

console.log('🧪 CRN Integration loaded successfully');
