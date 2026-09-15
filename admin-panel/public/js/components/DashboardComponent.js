/**
 * DashboardComponent - Modular View Template for Authenticated User Dashboard & Sub-pages
 */
class DashboardComponent {
    static render() {
        return `
        <div id="dashboard-view" class="view active" style="display:flex !important; position:relative; z-index:1; min-height:100vh;">
            <nav class="sidebar">
                <div class="sidebar-header">
                    <div class="logo-mini" style="background:transparent;width:44px;height:44px;">
                        <img src="img/logo.png" alt="BlackScreen Tool" style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 0 10px rgba(225,29,72,0.6));">
                    </div>
                    <span class="logo-text">BlackScreenTool</span>
                </div>
                <ul class="nav-menu">
                    <li class="nav-item active" data-page="user-dashboard">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="9"></rect>
                            <rect x="14" y="3" width="7" height="5"></rect>
                            <rect x="14" y="12" width="7" height="9"></rect>
                            <rect x="3" y="16" width="7" height="5"></rect>
                        </svg>
                        Dashboard
                    </li>
                    <li class="nav-item" data-page="build-page">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                            <polyline points="2 17 12 22 22 17"></polyline>
                            <polyline points="2 12 12 17 22 12"></polyline>
                        </svg>
                        Build
                    </li>
                    <li class="nav-item" data-page="history-page">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        Histórico
                    </li>
                    <li class="nav-item admin-only" data-page="admin-dashboard">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                        Admin
                    </li>
                </ul>
                <div class="sidebar-footer">
                    <div class="user-info">
                        <div class="user-avatar" id="user-avatar">U</div>
                        <div class="user-details">
                            <span class="user-name" id="user-name">Usuário</span>
                            <span class="user-role" id="user-role">Membro</span>
                        </div>
                    </div>
                    <button id="logout-btn" class="btn-logout" title="Sair">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                    </button>
                </div>
            </nav>

            <main class="main-content">
                <section id="user-dashboard" class="page active">
                    <header class="page-header">
                        <h1>Dashboard</h1>
                        <p>Bem-vindo de volta! Aqui está seu resumo.</p>
                    </header>
                    <div class="dashboard-grid">
                        <div class="stat-card glass-card builds-card">
                            <div class="stat-icon builds-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                                    <polyline points="2 17 12 22 22 17"></polyline>
                                    <polyline points="2 12 12 17 22 12"></polyline>
                                </svg>
                            </div>
                            <div class="stat-info">
                                <span class="stat-value" id="user-builds-used">0</span>
                                <span class="stat-label">Builds este mês</span>
                            </div>
                            <div class="stat-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" id="builds-progress"></div>
                                </div>
                                <span class="progress-text"><span id="user-builds-remaining">5</span> restantes</span>
                            </div>
                        </div>
                        <div class="stat-card glass-card limit-card">
                            <div class="stat-icon limit-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                            </div>
                            <div class="stat-info">
                                <span class="stat-value" id="user-build-limit">5</span>
                                <span class="stat-label">Limite Mensal</span>
                            </div>
                        </div>
                        <div class="action-card glass-card">
                            <h3>Iniciar Novo Build</h3>
                            <p>Configure e compile seu projeto rapidamente.</p>
                            <button class="btn-primary" id="go-to-build">
                                Ir para Build
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="recent-section glass-card">
                        <h3>Builds Recentes</h3>
                        <div id="user-recent-builds" class="builds-list">
                            <p class="empty-message">Nenhum build realizado ainda.</p>
                        </div>
                    </div>
                </section>

                <section id="build-page" class="page">
                    <header class="page-header">
                        <h1>Build Tool</h1>
                        <p>Configure e compile seu executável personalizado.</p>
                    </header>
                    <div class="build-container">
                        <div class="config-grid">
                             <form id="settings-form" class="glass-card config-form">
                                 <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                                     <div>
                                         <span class="icon">⚙️</span>
                                         <h3 style="display:inline-block;margin-left:6px;">Configurações Gerais</h3>
                                     </div>
                                     <span id="settings-auto-save-status" style="font-size:0.75rem;color:var(--text-muted);font-weight:500;">✨ Salvo automaticamente</span>
                                 </div>
                                 <div class="input-group">
                                     <label for="correctPassword">Senha de Desbloqueio</label>
                                     <input type="password" id="correctPassword" placeholder="Ex: Sidney2012@" autocomplete="current-password">
                                 </div>
                                 <div class="input-group">
                                     <label for="customMessage">Mensagem da Tela Preta</label>
                                     <textarea id="customMessage" rows="5" placeholder="Digite a mensagem que aparecerá..."></textarea>
                                 </div>
                             </form>
                            <div class="glass-card assets-form">
                                <div class="card-header">
                                    <span class="icon">🖼️</span>
                                    <h3>Logos e Ícones</h3>
                                </div>
                                <div class="upload-grid">
                                    <div class="upload-item">
                                        <label>Logo Principal (PNG)</label>
                                        <div class="drop-zone" onclick="document.getElementById('file-png').click()">
                                            <div class="drop-content">
                                                <span class="upload-icon">📁</span>
                                                <p id="png-filename-display">logo.png</p>
                                            </div>
                                            <input type="file" id="file-png" hidden accept=".png">
                                        </div>
                                    </div>
                                    <div class="upload-item">
                                        <label>Ícone Executável (ICO)</label>
                                        <div class="drop-zone" onclick="document.getElementById('file-ico').click()">
                                            <div class="drop-content">
                                                <span class="upload-icon">💎</span>
                                                <p id="ico-filename-display">logo.ico</p>
                                            </div>
                                            <input type="file" id="file-ico" hidden accept=".ico">
                                        </div>
                                    </div>
                                    <div class="upload-item">
                                        <label>Logo Animada (GIF)</label>
                                        <div class="drop-zone" onclick="document.getElementById('file-gif').click()">
                                            <div class="drop-content">
                                                <span class="upload-icon">✨</span>
                                                <p id="gif-filename-display">logo.gif</p>
                                            </div>
                                            <input type="file" id="file-gif" hidden accept=".gif">
                                        </div>
                                    </div>
                                </div>
                                <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;">
                                    <button id="convertPngToIco" type="button" class="btn-secondary" disabled style="width:100%;opacity:0.5;cursor:not-allowed;" title="Selecione um logo.png para converter em .ico">⚡ Converter PNG &rarr; ICO</button>
                                </div>
                            </div>
                        </div>
                        <div class="glass-card build-card">
                            <div class="build-info">
                                <h3>Pronto para Compilar?</h3>
                                <p>Digite um nome para a build e clique para gerar o executável.</p>
                                <div class="input-group" style="margin:14px 0;">
                                    <label for="buildName">Nome da Build</label>
                                    <input type="text" id="buildName" placeholder="Ex: Cliente_Marcos_FRP">
                                </div>
                                <div class="build-limit-warning" id="build-limit-warning">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                    <span>Você tem <strong id="remaining-count">5</strong> builds restantes este mês.</span>
                                </div>
                            </div>
                            <button id="startBuild" class="btn-build">
                                🚀 INICIAR COMPILAÇÃO
                            </button>
                        </div>

                        <!-- Active Build Live Status & Download Card -->
                        <div id="active-build-container" class="glass-card active-build-card" style="margin-top:20px;display:none;padding:24px;border:1px solid rgba(225,29,72,0.3);background:rgba(20,20,30,0.6);border-radius:12px;">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                                <h4 style="margin:0;font-size:1.1rem;color:#fff;display:flex;align-items:center;gap:8px;">
                                    <span>⚙️</span> Build em Andamento / Atual
                                </h4>
                                <span id="active-build-badge" class="status-badge queued">Na Fila</span>
                            </div>
                            <div style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:16px;">
                                <p style="margin:4px 0;color:#fff;"><strong>Nome:</strong> <span id="active-build-name">-</span></p>
                                <p style="margin:4px 0;"><strong>ID:</strong> #<span id="active-build-id">-</span></p>
                                <p style="margin:6px 0;font-weight:500;" id="active-build-info">Aguardando processamento na fila...</p>
                            </div>
                            <div id="active-build-progress-wrap" style="background:rgba(255,255,255,0.08);height:8px;border-radius:4px;overflow:hidden;margin-bottom:16px;">
                                <div id="active-build-progress-bar" style="width:15%;height:100%;background:linear-gradient(90deg, #f43f5e, #10b981);transition:width 0.4s ease;"></div>
                            </div>
                            <div id="active-build-actions" style="display:flex;justify-content:flex-end;">
                                <a id="active-build-download-btn" href="#" class="btn-primary" download style="display:none;text-decoration:none;padding:12px 24px;font-weight:700;font-size:0.95rem;background:linear-gradient(135deg, #10b981, #059669);box-shadow:0 6px 20px rgba(16,185,129,0.3);">
                                    📥 BAIXAR EXECUTÁVEL (.ZIP)
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="history-page" class="page">
                    <header class="page-header">
                        <h1>Histórico de Builds</h1>
                        <p>Visualize todos os seus builds anteriores.</p>
                    </header>
                    <div class="glass-card">
                        <div id="build-history" class="builds-table-container">
                            <table class="builds-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nome</th>
                                        <th>Status</th>
                                        <th>Tamanho</th>
                                        <th>Downloads</th>
                                        <th>Data</th>
                                        <th>Ação</th>
                                    </tr>
                                </thead>
                                <tbody id="history-table-body">
                                    <tr>
                                        <td colspan="7" class="empty-message">Carregando...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                ${AdminComponent.render()}
            </main>
        </div>
        `;
    }
}
