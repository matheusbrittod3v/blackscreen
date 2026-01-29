// Admin Module
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

                // Load tab data
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
        const addBtn = document.getElementById('add-user-btn');
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.modal-cancel');
        const overlay = modal.querySelector('.modal-overlay');

        addBtn.addEventListener('click', () => {
            this.openModal();
        });

        [closeBtn, cancelBtn, overlay].forEach(el => {
            el.addEventListener('click', () => {
                this.closeModal();
            });
        });
    },

    openModal(user = null) {
        const modal = document.getElementById('user-modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('user-form');

        form.reset();
        document.getElementById('edit-user-id').value = '';

        if (user) {
            title.textContent = 'Editar Cliente';
            document.getElementById('edit-user-id').value = user.id;
            document.getElementById('modal-user-name').value = user.name;
            document.getElementById('modal-user-email').value = user.email;
            document.getElementById('modal-user-password').value = ''; // Always clear password on edit
            document.getElementById('modal-user-role').value = user.role;
            document.getElementById('modal-user-limit').value = user.monthlyBuildLimit;
            document.getElementById('modal-user-active').value = user.isActive.toString();
        } else {
            title.textContent = 'Novo Cliente';
            document.getElementById('modal-user-password').value = '';
        }

        modal.classList.add('active');
    },

    closeModal() {
        document.getElementById('user-modal').classList.remove('active');
    },

    setupUserForm() {
        const form = document.getElementById('user-form');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            btn.classList.add('loading');

            try {
                const id = document.getElementById('edit-user-id').value;
                const userData = {
                    name: document.getElementById('modal-user-name').value,
                    email: document.getElementById('modal-user-email').value,
                    role: document.getElementById('modal-user-role').value,
                    monthlyBuildLimit: parseInt(document.getElementById('modal-user-limit').value),
                    isActive: document.getElementById('modal-user-active').value === 'true'
                };

                const password = document.getElementById('modal-user-password').value;
                console.log('UserData being sent:', userData);
                console.log('Password length:', password ? password.length : 0);
                if (password) {
                    userData.password = password;
                }

                if (id) {
                    await API.put(`/api/admin/users/${id}`, userData);
                    showToast('Cliente atualizado com sucesso!', 'success');
                } else {
                    if (!password) {
                        throw new Error('Senha é obrigatória para novos clientes');
                    }
                    await API.post('/api/admin/users', userData);
                    showToast('Cliente criado com sucesso!', 'success');
                }

                this.closeModal();
                this.loadUsers();
                this.loadDashboard();
            } catch (error) {
                showToast(error.message, 'error');
            } finally {
                btn.classList.remove('loading');
            }
        });
    },

    async loadDashboard() {
        try {
            const data = await API.get('/api/admin/dashboard');

            document.getElementById('admin-total-users').textContent = data.stats.totalUsers;
            document.getElementById('admin-total-builds').textContent = data.stats.totalBuilds;
            document.getElementById('admin-builds-month').textContent = data.stats.buildsThisMonth;
            document.getElementById('admin-total-admins').textContent = data.stats.adminCount;

            this.loadUsers();
        } catch (error) {
            console.error('Error loading admin dashboard:', error);
        }
    },

    async loadUsers() {
        try {
            const users = await API.get('/api/admin/users');
            const tbody = document.getElementById('users-table-body');

            if (users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="empty-message">Nenhum usuário encontrado.</td></tr>';
                return;
            }

            tbody.innerHTML = users.map(user => `
                <tr>
                    <td>#${user.id}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td><span class="role-badge ${user.role}">${user.role === 'admin' ? 'Admin' : 'Usuário'}</span></td>
                    <td>${user.monthlyBuildLimit}</td>
                    <td>${user.buildsThisMonth || 0} / ${user.monthlyBuildLimit}</td>
                    <td><span class="active-badge ${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Ativo' : 'Inativo'}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon edit" onclick="Admin.editUser(${user.id})" title="Editar">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="btn-icon delete" onclick="Admin.deleteUser(${user.id})" title="Excluir">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading users:', error);
        }
    },

    async editUser(id) {
        try {
            const user = await API.get(`/api/admin/users/${id}`);
            this.openModal(user);
        } catch (error) {
            showToast('Erro ao carregar usuário', 'error');
        }
    },

    async deleteUser(id) {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

        try {
            await API.delete(`/api/admin/users/${id}`);
            showToast('Usuário excluído com sucesso!', 'success');
            this.loadUsers();
            this.loadDashboard();
        } catch (error) {
            showToast(error.message, 'error');
        }
    },

    async loadBuilds() {
        try {
            const builds = await API.get('/api/admin/builds');
            const tbody = document.getElementById('admin-builds-table-body');

            if (builds.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="empty-message">Nenhum build encontrado.</td></tr>';
                return;
            }

            tbody.innerHTML = builds.map(build => `
                <tr>
                    <td>#${build.id}</td>
                    <td>${build.userName || '-'}</td>
                    <td>${build.buildName || '-'}</td>
                    <td><span class="status-badge ${build.status}">${Dashboard.getStatusLabel(build.status)}</span></td>
                    <td>${formatFileSize(build.fileSize)}</td>
                    <td>${build.downloadCount || 0}</td>
                    <td>${formatDate(build.createdAt)}</td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading builds:', error);
        }
    },

    async loadActivity() {
        try {
            const activities = await API.get('/api/admin/activity');
            const container = document.getElementById('activity-list');

            if (activities.length === 0) {
                container.innerHTML = '<p class="empty-message">Nenhuma atividade registrada.</p>';
                return;
            }

            container.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon ${this.getActivityIconClass(activity.action)}">
                        ${this.getActivityIcon(activity.action)}
                    </div>
                    <div class="activity-content">
                        <span class="activity-title">${activity.userName || activity.userEmail || 'Sistema'}</span>
                        <span class="activity-description">${activity.description || activity.action}</span>
                    </div>
                    <span class="activity-time">${relativeTime(activity.createdAt)}</span>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading activity:', error);
        }
    },

    getActivityIconClass(action) {
        if (action.includes('LOGIN')) return 'login';
        if (action.includes('REGISTER')) return 'register';
        if (action.includes('BUILD')) return 'build';
        if (action.includes('USER')) return 'user';
        return '';
    },

    getActivityIcon(action) {
        if (action.includes('LOGIN')) return '🔑';
        if (action.includes('REGISTER')) return '👤';
        if (action.includes('BUILD')) return '🚀';
        if (action.includes('USER')) return '✏️';
        return '📋';
    }
};
