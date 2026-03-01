// NoteYou 3.0 - Lazy Loader (Desativado)
// Sistema de carregamento dinâmico de módulos - não utilizado neste projeto

class LazyLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
  }

  async loadModule(moduleName, modulePath) {
    // Método mantido para compatibilidade, mas não faz nada
    console.log(`📦 Lazy loading desativado para: ${moduleName}`);
    return Promise.resolve();
  }

  isLoaded(moduleName) {
    return false;
  }
}

class ModuleRegistry {
  constructor() {
    this.modules = new Map();
  }

  register(name, path) {
    this.modules.set(name, path);
  }

  get(name) {
    return this.modules.get(name);
  }
}

class SmartLoader {
  constructor(lazyLoader, moduleRegistry) {
    this.lazyLoader = lazyLoader;
    this.moduleRegistry = moduleRegistry;
  }

  init() {
    console.log('🚀 SmartLoader desativado - não necessário');
  }

  observe(element, moduleName, modulePath) {
    // Método mantido para compatibilidade, mas não faz nada
    console.log(`📦 Observer desativado para: ${moduleName}`);
  }
}

// Definição dos módulos disponíveis (mantido para compatibilidade)
const APP_MODULES = {
  critical: [],
  secondary: [],
  optional: []
};

// Instanciar sistemas
const lazyLoader = new LazyLoader();
const moduleRegistry = new ModuleRegistry();
const smartLoader = new SmartLoader(lazyLoader, moduleRegistry);

// Exportar para uso global
window.lazyLoader = lazyLoader;
window.moduleRegistry = moduleRegistry;
window.smartLoader = smartLoader;
window.APP_MODULES = APP_MODULES;

// Inicialização
async function initLazyLoading() {
  try {
    console.log('🚀 Lazy loading desativado - módulos já carregados nos arquivos principais');
    console.log('✅ Sistema de lazy loading inicializado (desativado)');
  } catch (error) {
    console.error('❌ Erro na inicialização do lazy loading:', error);
  }
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLazyLoading);
} else {
  initLazyLoading();
}
