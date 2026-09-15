/**
 * Admin Module - Client & Audit Management Panel
 */
const Admin = {
    init() {
        this.setupTabs();
        this.setupModal();
        this.setupUserForm();
    },

    setupTabs() {
        const tabs = document.querySelectorAll('.admin-tab');
        const contents = document.querySelectorAll('.admin-tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.adminTab;

                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                contents.forEach(content => {
                    content.classList.toggle('active', content.id === `${target}-tab`);
                });

                switch (target) {
                    case 'users':
                        this.loadUsers();
                        break;
                    case 'builds':
                        this.loadBuilds();
                        break;
                    case 'activity':
                        this.loadActivity();
                        break;
                }
            });
        });
    },

    setupModal() {
        const modal = document.getElementById('user-modal');
        if (!modal) return;
        const addBtn = document.getElementById('add-user-btn');
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.modal-cancel');
        const overlay = modal.querySelector('.modal-overlay');

        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.openModal();
            });
        }

        [closeBtn, cancelBtn, overlay].forEach(el => {
            if (el) {
                el.addEventListener('click', () => {
                    this.closeModal();
                });
            }
        });
    },

    openModal(user = null) {
        const modal = document.getElementById('user-modal');
        if (!modal) return;
        const title = document.getElementById('modal-title');
        const form = document.getElementById('user-form');

        if (form) form.reset();
        const editId = document.getElementById('edit-user-id');
        if (editId) editId.value = '';

        if (user) {
            if (title) title.textContent = 'Editar Cliente';
            if (editId) editId.value = user.id;
            const nameEl = document.getElementById('modal-user-name');
            const emailEl = document.getElementById('modal-user-email');
            const passEl = document.getElementById('modal-user-password');
            const roleEl = document.getElementById('modal-user-role');
            const limitEl = document.getElementById('modal-user-limit');
            const activeEl = document.getElementById('modal-user-active');

            if (nameEl) nameEl.value = user.name || '';
            if (emailEl) emailEl.value = user.email || '';
            if (passEl) passEl.value = '';
            if (roleEl) roleEl.value = user.role || 'user';
            if (limitEl) limitEl.value = user.monthlyBuildLimit ?? 5;
            if (activeEl) activeEl.value = (user.isActive !== false).toString();
        } else {
            if (title) title.textContent = 'Novo Cliente';
            const passEl = document.getElementById('modal-user-password');
            if (passEl) passEl.value = '';
        }

        modal.classList.add('active');
    },

    closeModal() {
        const modal = document.getElementById('user-modal');
        if (modal) modal.classList.remove('active');
    },

    setupUserForm() {
        const form = document.getElementById('user-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            const editId = document.getElementById('edit-user-id')?.value;
            const name = (document.getElementById('modal-user-name')?.value || '').trim();
            const email = (document.getElementById('modal-user-email')?.value || '').trim();
            const password = document.getElementById('modal-user-password')?.value || '';
            const role = document.getElementById('modal-user-role')?.value || 'user';
            const monthlyBuildLimit = parseInt(document.getElementById('modal-user-limit')?.value || '5', 10);
            const isActive = document.getElementById('modal-user-active')?.value === 'true';

            try {
                if (editId) {
                    const updateData = { name, email, role, monthlyBuildLimit, isActive };
                    if (password) updateData.password = password;
                    await API.put(`/api/admin/users/${editId}`, updateData);
                    Utils.showToast('Cliente atualizado com sucesso!', 'success');
                } else {
                    if (!password) {
                        throw new Error('Senha é obrigatória para cadastrar novo usuário.');
                    }
                    await API.post('/api/admin/users', { name, email, password, role, monthlyBuildLimit, isActive });
                    Utils.showToast('Novo cliente cadastrado com sucesso!', 'success');
                }
                this.closeModal();
                this.loadUsers();
                this.loadDashboard();
            } catch (error) {
                Utils.showToast(error.message, 'error');
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    },

    async loadDashboard() {
        if (Auth.currentUser?.role !== 'admin') return;

        try {
            const stats = await API.get('/api/admin/stats');
            const totalUsersEl = document.getElementById('admin-total-users');
            const totalBuildsEl = document.getElementById('admin-total-builds');
            const activeUsersEl = document.getElementById('admin-active-users');

            if (totalUsersEl) totalUsersEl.textContent = stats.totalUsers ?? 0;
            if (totalBuildsEl) totalBuildsEl.textContent = stats.totalBuilds ?? 0;
            if (activeUsersEl) activeUsersEl.textContent = stats.activeUsers ?? 0;

            this.loadUsers();
        } catch (error) {
            console.error('[Admin] Error loading admin stats:', error);
        }
    },

    async loadUsers() {
        try {
            const users = await API.get('/api/admin/users');
            const tbody = document.getElementById('users-table-body');
            if (!tbody) return;

            if (!Array.isArray(users) || users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="empty-message">Nenhum cliente cadastrado.</td></tr>';
                return;
            }

            tbody.innerHTML = users.map(u => {
                const safeId = Utils.escapeHtml(u.id);
                const safeName = Utils.escapeHtml(u.name);
                const safeEmail = Utils.escapeHtml(u.email);
                const safeRole = Utils.escapeHtml(u.role === 'admin' ? 'Administrador' : 'Membro');
                const safeLimit = Utils.escapeHtml(u.monthlyBuildLimit ?? 5);
                const isActive = u.isActive !== false;
                const statusBadge = isActive
                    ? '<span class="status-badge completed">Ativo</span>'
                    : '<span class="status-badge failed">Desativado</span>';

                const safeUserJson = Utils.escapeHtml(JSON.stringify(u));

                return `
                    <tr>
                        <td>#${safeId}</td>
                        <td><strong>${safeName}</strong></td>
                        <td>${safeEmail}</td>
                        <td>${safeRole}</td>
                        <td>${safeLimit} builds/mês</td>
                        <td>${statusBadge}</td>
                        <td>
                            <button type="button" class="btn-table-action" onclick='Admin.editUserFromData(${safeUserJson})'>Editar</button>
                            <button type="button" class="btn-table-action danger" onclick="Admin.deleteUser(${safeId})">Excluir</button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('[Admin] Error loading users:', error);
        }
    },

    editUserFromData(user) {
        this.openModal(user);
    },

    async deleteUser(userId) {
        if (!confirm('Tem certeza que deseja excluir este cliente? Essa ação é irreversível.')) return;
        try {
            await API.delete(`/api/admin/users/${userId}`);
            Utils.showToast('Cliente excluído com sucesso.', 'success');
            this.loadUsers();
            this.loadDashboard();
        } catch (error) {
            Utils.showToast(error.message, 'error');
        }
    },

    async loadBuilds() {
        try {
            const builds = await API.get('/api/admin/builds');
            const tbody = document.getElementById('admin-builds-table-body');
            if (!tbody) return;

            if (!Array.isArray(builds) || builds.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="empty-message">Nenhum build no histórico do sistema.</td></tr>';
                return;
            }

            tbody.innerHTML = builds.map(b => {
                const safeId = Utils.escapeHtml(b.id);
                const safeUser = Utils.escapeHtml(b.User?.name || b.User?.email || `User #${b.userId}`);
                const safeName = Utils.escapeHtml(b.buildName || '-');
                const safeStatus = Utils.escapeHtml(b.status);
                const safeSize = Utils.formatFileSize(b.fileSize);
                const safeDate = Utils.formatDate(b.createdAt);
                const statusLabel = Utils.escapeHtml(Dashboard.getStatusLabel(b.status));

                return `
                    <tr>
                        <td>#${safeId}</td>
                        <td><strong>${safeUser}</strong></td>
                        <td>${safeName}</td>
                        <td><span class="status-badge ${safeStatus}">${statusLabel}</span></td>
                        <td>${safeSize}</td>
                        <td>${safeDate}</td>
                        <td>
                            ${b.status === 'completed'
                                ? `<a href="/api/build/download/${safeId}?token=${encodeURIComponent(API.token)}" class="btn-table-action" download>Baixar</a>`
                                : '-'
                            }
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('[Admin] Error loading admin builds:', error);
        }
    },

    async loadActivity() {
        try {
            const logs = await API.get('/api/admin/activity');
            const container = document.getElementById('activity-list');
            if (!container) return;

            if (!Array.isArray(logs) || logs.length === 0) {
                container.innerHTML = '<p class="empty-message">Nenhuma atividade registrada.</p>';
                return;
            }

            container.innerHTML = logs.map(l => {
                const safeAction = Utils.escapeHtml(l.action);
                const safeDesc = Utils.escapeHtml(l.description);
                const safeUser = Utils.escapeHtml(l.User?.name || l.User?.email || 'Sistema');
                const safeIp = Utils.escapeHtml(l.ipAddress || '-');
                const safeDate = Utils.formatDate(l.createdAt);

                return `
                    <div class="activity-item" style="padding:12px 16px;border-bottom:1px solid var(--glass-border);display:flex;align-items:center;justify-content:space-between;gap:12px;">
                        <div>
                            <span class="status-badge info" style="margin-right:8px;">${safeAction}</span>
                            <strong>${safeUser}</strong>: ${safeDesc}
                        </div>
                        <div style="text-align:right;font-size:0.75rem;color:var(--text-muted);">
                            <div>${safeDate}</div>
                            <div>IP: ${safeIp}</div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('[Admin] Error loading activity logs:', error);
        }
    }
};
