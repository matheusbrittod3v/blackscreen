// Dashboard Module
const Dashboard = {
    init() {
        this.setupNavigation();
        this.setupLogout();
        this.setupGoToBuild();
    },

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });
    },

    navigateTo(pageId) {
        if (!pageId) pageId = 'user-dashboard';

        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageId);
        });

        // Update pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.toggle('active', page.id === pageId);
        });

        // Load page data
        switch (pageId) {
            case 'user-dashboard':
                this.loadUserDashboard();
                break;
            case 'build-page':
                if (typeof Build !== 'undefined') {
                    Build.loadSettings();
                    Build.loadBuildLimit();
                }
                break;
            case 'history-page':
                this.loadHistory();
                break;
            case 'admin-dashboard':
                if (typeof Admin !== 'undefined') {
                    Admin.loadDashboard();
                }
                break;
        }
    },

    setupLogout() {
        const btn = document.getElementById('logout-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                Auth.logout();
            });
        }
    },

    setupGoToBuild() {
        const btn = document.getElementById('go-to-build');
        if (btn) {
            btn.addEventListener('click', () => {
                this.navigateTo('build-page');
            });
        }
    },

    updateUserInfo() {
        const user = Auth.currentUser;
        if (!user) return;

        const nameEl = document.getElementById('user-name');
        const roleEl = document.getElementById('user-role');
        const avatarEl = document.getElementById('user-avatar');

        if (nameEl) nameEl.textContent = user.name;
        if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Administrador' : 'Membro';
        if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();

        // Show/hide admin menu
        if (user.role === 'admin') {
            document.body.classList.add('is-admin');
        } else {
            document.body.classList.remove('is-admin');
        }
    },

    async loadUserDashboard() {
        try {
            const data = await API.get('/api/build/build-limit');

            const usedEl = document.getElementById('user-builds-used');
            const remEl = document.getElementById('user-builds-remaining');
            const limitEl = document.getElementById('user-build-limit');
            const progressEl = document.getElementById('builds-progress');

            if (usedEl) usedEl.textContent = data.used;
            if (remEl) remEl.textContent = data.remaining;
            if (limitEl) limitEl.textContent = data.limit;

            if (progressEl) {
                const progressPercent = (data.used / data.limit) * 100;
                progressEl.style.width = `${progressPercent}%`;
            }

            await this.loadRecentBuilds();
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    },

    async loadRecentBuilds() {
        try {
            const builds = await API.get('/api/build/history');
            const container = document.getElementById('user-recent-builds');

            if (builds.length === 0) {
                container.innerHTML = '<p class="empty-message">Nenhum build realizado ainda.</p>';
                return;
            }

            container.innerHTML = builds.slice(0, 5).map(build => `
                <div class="build-item">
                    <div class="build-status ${build.status}"></div>
                    <div class="build-details">
                        <span class="build-name">${build.buildName || `Build #${build.id}`}</span>
                        <span class="build-date">${formatDate(build.createdAt)}</span>
                    </div>
                    <span class="status-badge ${build.status}">${this.getStatusLabel(build.status)}</span>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading recent builds:', error);
        }
    },

    async loadHistory() {
        try {
            const builds = await API.get('/api/build/history');
            const tbody = document.getElementById('history-table-body');

            if (builds.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="empty-message">Nenhum build encontrado.</td></tr>';
                return;
            }

            tbody.innerHTML = builds.map(build => `
                <tr>
                    <td>#${build.id}</td>
                    <td>${build.buildName || '-'}</td>
                    <td><span class="status-badge ${build.status}">${this.getStatusLabel(build.status)}</span></td>
                    <td>${formatFileSize(build.fileSize)}</td>
                    <td>${build.downloadCount || 0}</td>
                    <td>${formatDate(build.createdAt)}</td>
                    <td>
                        ${build.status === 'completed'
                            ? `<a href="/api/build/download/${build.id}?token=${API.token}" class="btn-table-action" download>Baixar ZIP</a>`
                            : `<span style="color:var(--text-muted);font-size:0.75rem;">-</span>`
                        }
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading history:', error);
        }
    },

    getStatusLabel(status) {
        const labels = {
            pending: 'Pendente',
            building: 'Compilando',
            completed: 'Concluído',
            failed: 'Falhou'
        };
        return labels[status] || status;
    }
};
