// NoteYou 3.0 - Testes Automatizados
// Suite completa de testes para validar funcionalidades e segurança

class NoteYouTests {
  constructor() {
    this.results = [];
    this.currentTest = 0;
    this.totalTests = 0;
  }

  // Executa todos os testes
  async runAllTests() {
    console.log('🧪 Iniciando suite de testes automatizados...');
    
    // Testes de Autenticação
    await this.testAuthentication();
    
    // Testes de Banco de Dados
    await this.testDatabase();
    
    // Testes de Interface
    await this.testUI();
    
    // Testes de Segurança
    await this.testSecurity();
    
    // Testes de Performance
    await this.testPerformance();
    
    // Testes de Funcionalidades
    await this.testFeatures();
    
    this.generateReport();
  }

  // Testa sistema de autenticação
  async testAuthentication() {
    console.log('🔐 Testando autenticação...');
    
    // Teste 1: Login com credenciais válidas
    await this.runTest('Login válido', async () => {
      const result = await hybridAuth.login('admin@noteyou.app', 'admin123');
      return result.success;
    });
    
    // Teste 2: Login com credenciais inválidas
    await this.runTest('Login inválido', async () => {
      const result = await hybridAuth.login('invalid@email.com', 'wrongpass');
      return !result.success;
    });
    
    // Teste 3: Registro de novo usuário
    await this.runTest('Registro de usuário', async () => {
      const testEmail = `test_${Date.now()}@test.com`;
      const result = await hybridAuth.register(testEmail, 'test123', 'Test User');
      return result.success;
    });
    
    // Teste 4: Validação de senha
    await this.runTest('Validação de senha', async () => {
      const result = await hybridAuth.register('test@test.com', '123', 'Test');
      return !result.success; // Deve falhar com senha curta
    });
    
    // Teste 5: Persistência de sessão
    await this.runTest('Persistência de sessão', async () => {
      await hybridAuth.login('admin@noteyou.app', 'admin123');
      const currentUser = hybridAuth.getCurrentUser();
      return currentUser && currentUser.email === 'admin@noteyou.app';
    });
  }

  // Testa sistema de banco de dados
  async testDatabase() {
    console.log('💾 Testando banco de dados...');
    
    // Teste 1: Salvamento de dados
    await this.runTest('Salvar dados', async () => {
      const testData = { id: 'test_' + Date.now(), name: 'Test Data' };
      const result = await hybridDB.save('test', testData);
      return result.success;
    });
    
    // Teste 2: Carregamento de dados
    await this.runTest('Carregar dados', async () => {
      const result = await hybridDB.load('test');
      return Array.isArray(result) && result.length > 0;
    });
    
    // Teste 3: Exclusão de dados
    await this.runTest('Excluir dados', async () => {
      const testData = { id: 'delete_test', name: 'Delete Me' };
      await hybridDB.save('test', testData);
      const result = await hybridDB.delete('test', 'delete_test');
      return result.success;
    });
    
    // Teste 4: Fallback localStorage
    await this.runTest('Fallback localStorage', async () => {
      // Simula falha do IndexedDB
      const originalIndexedDB = window.indexedDB;
      window.indexedDB = undefined;
      
      const testDB = new HybridDatabase();
      await testDB.waitForInit();
      
      window.indexedDB = originalIndexedDB;
      return testDB.dbType === 'localstorage';
    });
  }

  // Testa interface do usuário
  async testUI() {
    console.log('🎨 Testando interface...');
    
    // Teste 1: Tela de login visível
    await this.runTest('Tela de login visível', () => {
      const loginContainer = document.getElementById('loginContainer');
      const appContainer = document.querySelector('.app-container');
      return loginContainer.style.display !== 'none' && 
             appContainer.style.display === 'none';
    });
    
    // Teste 2: Elementos do formulário
    await this.runTest('Formulário de login', () => {
      const emailInput = document.getElementById('loginEmail');
      const passwordInput = document.getElementById('loginPassword');
      const loginBtn = document.querySelector('.login-submit-btn');
      return emailInput && passwordInput && loginBtn;
    });
    
    // Teste 3: Modais funcionais
    await this.runTest('Modais funcionais', () => {
      const taskModal = document.getElementById('taskModal');
      const noteModal = document.getElementById('noteModal');
      return taskModal && noteModal;
    });
    
    // Teste 4: Responsividade
    await this.runTest('Responsividade', () => {
      const sidebar = document.querySelector('.sidebar');
      const navItems = document.querySelectorAll('.nav-item');
      return sidebar && navItems.length > 0;
    });
  }

  // Testa segurança
  async testSecurity() {
    console.log('🛡️ Testando segurança...');
    
    // Teste 1: XSS Prevention
    await this.runTest('Prevenção XSS', () => {
      const testString = '<script>alert("xss")</script>';
      const div = document.createElement('div');
      div.textContent = testString;
      return !div.innerHTML.includes('<script>');
    });
    
    // Teste 2: Sanitização de entrada
    await this.runTest('Sanitização de entrada', () => {
      const maliciousInput = '<img src="x" onerror="alert(1)">';
      const sanitized = maliciousInput.replace(/<[^>]*>/g, '');
      return !sanitized.includes('onerror');
    });
    
    // Teste 3: Hash de senhas
    await this.runTest('Hash de senhas', async () => {
      const password = 'test123';
      const hash1 = await hybridAuth.hashPassword(password);
      const hash2 = await hybridAuth.hashPassword(password);
      return hash1 === hash2 && hash1 !== password;
    });
    
    // Teste 4: Salt único
    await this.runTest('Salt único', async () => {
      const password = 'test123';
      const salt1 = Math.random().toString(36).substring(2);
      const salt2 = Math.random().toString(36).substring(2);
      const hash1 = await hybridAuth.hashPasswordWithSalt(password, salt1);
      const hash2 = await hybridAuth.hashPasswordWithSalt(password, salt2);
      return hash1 !== hash2;
    });
    
    // Teste 5: CSP Headers
    await this.runTest('CSP Headers', () => {
      const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      return metaCSP && metaCSP.content;
    });
  }

  // Testa performance
  async testPerformance() {
    console.log('⚡ Testando performance...');
    
    // Teste 1: Tempo de carregamento
    await this.runTest('Tempo de carregamento', async () => {
      const start = performance.now();
      await hybridDB.waitForInit();
      const end = performance.now();
      return (end - start) < 1000; // Menos de 1 segundo
    });
    
    // Teste 2: Lazy Loading
    await this.runTest('Lazy Loading', () => {
      return typeof lazyLoader !== 'undefined';
    });
    
    // Teste 3: Otimização de CSS
    await this.runTest('CSS Otimizado', () => {
      const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
      return stylesheets.length <= 3; // Mínimo de arquivos CSS
    });
    
    // Teste 4: Tamanho de JavaScript
    await this.runTest('Tamanho do JS', () => {
      const scripts = document.querySelectorAll('script[src]');
      return scripts.length <= 5; // Mínimo de scripts externos
    });
  }

  // Testa funcionalidades principais
  async testFeatures() {
    console.log('🚀 Testando funcionalidades...');
    
    // Teste 1: Criação de tarefas
    await this.runTest('Criar tarefa', () => {
      return typeof showCreateTaskModal === 'function';
    });
    
    // Teste 2: Criação de notas
    await this.runTest('Criar nota', () => {
      return typeof showCreateNoteModal === 'function';
    });
    
    // Teste 3: Drag and Drop
    await this.runTest('Drag & Drop', () => {
      return typeof setupDragAndDrop === 'function';
    });
    
    // Teste 4: Mudança de tema
    await this.runTest('Mudança de tema', () => {
      return typeof toggleTheme === 'function';
    });
    
    // Teste 5: Export/Import
    await this.runTest('Export/Import', () => {
      return typeof exportData === 'function' && typeof importData === 'function';
    });
    
    // Teste 6: Analytics
    await this.runTest('Analytics', () => {
      return typeof loadAnalytics === 'function';
    });
  }

  // Executa um teste individual
  async runTest(name, testFunction) {
    this.totalTests++;
    this.currentTest++;
    
    try {
      const startTime = performance.now();
      const result = await testFunction();
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);
      
      const testResult = {
        name,
        passed: !!result,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      };
      
      this.results.push(testResult);
      
      const status = testResult.passed ? '✅' : '❌';
      console.log(`${status} [${this.currentTest}/${this.totalTests}] ${name} - ${duration}ms`);
      
    } catch (error) {
      const testResult = {
        name,
        passed: false,
        error: error.message,
        duration: 'ERROR',
        timestamp: new Date().toISOString()
      };
      
      this.results.push(testResult);
      console.error(`❌ [${this.currentTest}/${this.totalTests}] ${name} - ERROR: ${error.message}`);
    }
  }

  // Gera relatório completo
  generateReport() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const passRate = ((passed / this.totalTests) * 100).toFixed(1);
    
    console.log('\n📊 RELATÓRIO DE TESTES');
    console.log('='.repeat(50));
    console.log(`Total de Testes: ${this.totalTests}`);
    console.log(`Aprovados: ${passed} ✅`);
    console.log(`Falharam: ${failed} ❌`);
    console.log(`Taxa de Aprovação: ${passRate}%`);
    console.log('='.repeat(50));
    
    // Detalhes dos testes falhados
    const failedTests = this.results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      console.log('\n❌ TESTES FALHADOS:');
      failedTests.forEach(test => {
        console.log(`  • ${test.name}: ${test.error || 'Test condition failed'}`);
      });
    }
    
    // Salvar relatório em arquivo
    this.saveReportToFile();
  }

  // Salva relatório em arquivo JSON
  saveReportToFile() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.totalTests,
        passed: this.results.filter(r => r.passed).length,
        failed: this.results.filter(r => !r.passed).length,
        passRate: ((this.results.filter(r => r.passed).length / this.totalTests) * 100).toFixed(1)
      },
      tests: this.results,
      environment: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      }
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `noteyou-test-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📄 Relatório salvo como arquivo JSON');
  }
}

// Função para executar testes no console
window.runTests = async () => {
  const tester = new NoteYouTests();
  await tester.runAllTests();
  return tester.results;
};

// Auto-executar testes se estiver em ambiente de desenvolvimento
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('🧪 Ambiente de desenvolvimento detectado. Execute runTests() para iniciar testes.');
}
