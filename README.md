# NoteYou 3.0 - Sistema Completo de Gerenciamento de Tarefas e Notas

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/shadowruge/noteYou)
[![Deploy](https://img.shields.io/badge/deploy-success-brightgreen.svg)](https://shadowruge.github.io/noteYou/)

## 🚀 Visão Geral

NoteYou 3.0 é uma aplicação web completa e profissional para gerenciamento de tarefas estilo Kanban e notas pessoais, desenvolvida com tecnologias modernas e foco em performance e segurança.

## ✨ Funcionalidades Principais

### 🔐 **Autenticação Segura**
- Sistema de login/registro local
- Hashing SHA-256 com salt único por usuário
- Sessão persistente e segura
- Proteção contra extensões problemáticas (Firefox, MetaMask, etc.)

### 📋 **Gestão de Tarefas Kanban**
- Board visual e intuitivo
- Drag & Drop entre colunas
- Três estados: A Fazer → Em Progresso → Concluído
- Prioridades: Baixa, Média, Alta
- Atribuição de responsáveis
- Filtros avançados

### 📝 **Sistema de Notas Completo**
- Criação, edição e exclusão de notas
- Tags para organização
- Busca full-text
- Formatação básica
- Exportação em JSON

### 👤 **Perfil do Usuário**
- Configurações pessoais
- Avatar com iniciais automáticas
- Preferências de idioma e fuso horário
- Estatísticas de uso
- Alteração de senha
- Exclusão segura de conta

### 📊 **Analytics e Estatísticas**
- Dashboard com métricas detalhadas
- Gráficos interativos (Chart.js)
- Estatísticas em tempo real
- Exportação de relatórios

### 🎨 **Design e UX**
- Interface moderna e responsiva
- Temas: Claro, Escuro, Automático
- Mobile-first approach
- Animações sutis e funcionais
- Feedback visual com toast notifications

## 🛠️ Stack Tecnológico

- **Frontend:** HTML5, CSS3, JavaScript ES6+
- **Banco de Dados:** Sistema Híbrido (localStorage + IndexedDB)
- **Autenticação:** SHA-256 + Salt
- **UI Framework:** CSS Grid + Flexbox
- **Gráficos:** Chart.js
- **Arquitetura:** SPA (Single Page Application)

## 🚀 Deploy

### **Acesso Online**
- **URL:** https://shadowruge.github.io/noteYou/
- **Status:** ✅ Produção Ativa
- **Compatibilidade:** Firefox, Chrome, Safari, Edge

### **Instalação Local**
```bash
# Clonar repositório
git clone https://github.com/shadowruge/noteYou.git

# Entrar no diretório
cd noteYou

# Abrir no navegador
# Recomendado: usar servidor local para melhor desenvolvimento
python3 -m http.server 8000
# ou
npx serve .
```

## 🔒 Segurança

### **Implementações de Segurança**
- ✅ Hashing de senhas com SHA-256 + salt
- ✅ Validação completa de inputs
- ✅ Sessão segura com timeout
- ✅ CSP Headers configurados
- ✅ Proteção contra XSS
- ✅ Polyfills para lockdown de extensões
- ✅ Sistema de recuperação automática

### **Compatibilidade de Extensões**
- Detecção automática de extensões problemáticas
- Polyfills essenciais para lockdown de segurança
- Sistema de fallback robusto
- Interface de aviso e recuperação

## 📱 Responsividade

### **Breakpoints**
- **Desktop:** > 768px
- **Tablet:** 768px - 480px
- **Mobile:** < 480px
- **Small Mobile:** < 320px

### **Recursos Mobile**
- Touch-friendly interface
- Swipe gestures para Kanban
- Menu otimizado para polegar
- Performance otimizada

## 🔄 Atualizações e Migração

### **Migração Automática**
- Detecção de dados legados
- Migração transparente para novo formato
- Backup automático antes da migração
- Verificação de integridade pós-migração

### **Versionamento**
- Sistema de tags semânticas
- Histórico completo de alterações
- Rollback automático em caso de falha

## 🛠️ Desenvolvimento

### **Estrutura do Projeto**
```
noteYou/
├── index.html                 # Página principal
├── assets/
│   ├── css/
│   │   ├── styles.css        # Estilos principais
│   │   ├── mobile.css        # Responsivo mobile
│   │   └── additional-styles.css # Estilos adicionais
│   └── js/
│       ├── app.js            # Aplicação principal
│       ├── app-functions.js  # Funções auxiliares
│       ├── hybrid-system.js # Sistema híbrido
│       ├── data-migration.js # Migração de dados
│       └── lazy-loader.js    # Lazy loading
└── README.md                 # Este arquivo
```

### **Contribuição**
1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📊 Performance

### **Métricas**
- **First Paint:** < 100ms
- **Time to Interactive:** < 500ms
- **Bundle Size:** ~85KB (minificado)
- **Memory Usage:** < 50MB
- **Network Requests:** Mínimas

### **Otimizações**
- Lazy loading de módulos
- Cache inteligente
- Async/Await para I/O
- Event delegation
- Minificação de assets

## 🐛 Troubleshooting

### **Problemas Comuns**

#### **Extensões Firefox Bloqueando Login**
- **Sintoma:** Login/registro não funcionam
- **Causa:** Extensões de privacidade bloqueando funções
- **Solução:** O sistema detecta automaticamente e aplica polyfills

#### **Dados Não Persistindo**
- **Sintoma:** Perda de dados ao recarregar
- **Causa:** localStorage desativado
- **Solução:** Verificar configurações do navegador

#### **Performance Lenta**
- **Sintoma:** Carregamento lento
- **Causa:** Muitos dados no localStorage
- **Solução:** Limpar dados antigos ou usar export/import

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Créditos

- **Desenvolvimento:** NoteYou Team
- **Design System:** Baseado em princípios modernos de UX
- **Inspiração:** Metodologias ágeis e Kanban

## 📞 Suporte

- **Issues:** https://github.com/shadowruge/noteYou/issues
- **Discussions:** https://github.com/shadowruge/noteYou/discussions
- **Wiki:** https://github.com/shadowruge/noteYou/wiki

---

**🎉 NoteYou 3.0 - Produtividade simplificada com tecnologia de ponta!**

*Acesse agora: https://shadowruge.github.io/noteYou/*
