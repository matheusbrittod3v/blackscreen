/**
 * AdminComponent Class - Renders Admin Dashboard & User Modal HTML Template
 */
class AdminComponent {
    static render() {
        return `
        <!-- Admin Dashboard Section -->
        <section id="admin-dashboard" class="page">
            <header class="page-header">
                <h1>Painel Administrativo</h1>
                <p>Gerencie usuários, builds e monitore o sistema.</p>
            </header>

            <div class="admin-stats-grid">
                <div class="admin-stat-card glass-card gradient-blue">
                    <div class="admin-stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                    <div class="admin-stat-content">
                        <span class="admin-stat-value" id="admin-total-users">0</span>
                        <span class="admin-stat-label">Total de Usuários</span>
                    </div>
                </div>
                <div class="admin-stat-card glass-card gradient-purple">
                    <div class="admin-stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                            <polyline points="2 17 12 22 22 17"></polyline>
                            <polyline points="2 12 12 17 22 12"></polyline>
                        </svg>
                    </div>
                    <div class="admin-stat-content">
                        <span class="admin-stat-value" id="admin-total-builds">0</span>
                        <span class="admin-stat-label">Total de Builds</span>
                    </div>
                </div>
                <div class="admin-stat-card glass-card gradient-green">
                    <div class="admin-stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </div>
                    <div class="admin-stat-content">
                        <span class="admin-stat-value" id="admin-active-users">0</span>
                        <span class="admin-stat-label">Usuários Ativos</span>
                    </div>
                </div>
            </div>

            <div class="admin-tabs-container">
                <div class="admin-tabs">
                    <button class="admin-tab active" data-admin-tab="users">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                        </svg>
                        Clientes
                    </button>
                    <button class="admin-tab" data-admin-tab="builds">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                            <polyline points="2 17 12 22 22 17"></polyline>
                        </svg>
                        Builds
                    </button>
                    <button class="admin-tab" data-admin-tab="activity">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                        Atividade
                    </button>
                </div>

                <div class="admin-tab-content active" id="users-tab">
                    <div class="tab-header">
                        <h3>Gerenciamento de Clientes</h3>
                        <button class="btn-primary" id="add-user-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Novo Cliente
                        </button>
                    </div>
                    <div class="table-container glass-card">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nome</th>
                                    <th>Email</th>
                                    <th>Tipo</th>
                                    <th>Limite</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="users-table-body">
                                <tr>
                                    <td colspan="7">Carregando...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="admin-tab-content" id="builds-tab">
                    <div class="tab-header">
                        <h3>Todos os Builds</h3>
                    </div>
                    <div class="table-container glass-card">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Usuário</th>
                                    <th>Nome</th>
                                    <th>Status</th>
                                    <th>Tamanho</th>
                                    <th>Data</th>
                                    <th>Ação</th>
                                </tr>
                            </thead>
                            <tbody id="admin-builds-table-body">
                                <tr>
                                    <td colspan="7">Carregando...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="admin-tab-content" id="activity-tab">
                    <div class="tab-header">
                        <h3>Log de Atividades</h3>
                    </div>
                    <div class="activity-list glass-card" id="activity-list">
                        <p class="empty-message">Carregando atividades...</p>
                    </div>
                </div>
            </div>
        </section>
        `;
    }

    static renderUserModal() {
        return `
        <div id="user-modal" class="modal">
            <div class="modal-overlay"></div>
            <div class="modal-container glass-card">
                <div class="modal-header">
                    <h2 id="modal-title">Novo Cliente</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <form id="user-form" class="modal-form">
                    <input type="hidden" id="edit-user-id">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="modal-user-name">Nome</label>
                            <input type="text" id="modal-user-name" required>
                        </div>
                        <div class="form-group">
                            <label for="modal-user-email">Email</label>
                            <input type="email" id="modal-user-email" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="modal-user-password">Senha <span class="hint">(deixe vazio para manter)</span></label>
                            <input type="password" id="modal-user-password" autocomplete="new-password">
                        </div>
                        <div class="form-group">
                            <label for="modal-user-role">Tipo</label>
                            <select id="modal-user-role">
                                <option value="user">Usuário</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="modal-user-limit">Limite Mensal de Builds</label>
                            <input type="number" id="modal-user-limit" value="5" min="1">
                        </div>
                        <div class="form-group">
                            <label for="modal-user-active">Status</label>
                            <select id="modal-user-active">
                                <option value="true">Ativo</option>
                                <option value="false">Inativo</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary modal-cancel">Cancelar</button>
                        <button type="submit" class="btn-primary">
                            <span class="btn-text">Salvar</span>
                            <span class="btn-loader"></span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
        `;
    }
}
