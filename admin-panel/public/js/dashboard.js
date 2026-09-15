/**
 * DashboardService Class - Handles User Navigation, Metrics & Isolated Data Views
 */
class DashboardService {
    init() {
        this.setupNavigation();
        this.setupLogout();
        this.setupGoToBuild();
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });
    }

    navigateTo(pageId) {
        if (!pageId) pageId = 'user-dashboard';

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageId);
        });

        document.querySelectorAll('.page').forEach(page => {
            page.classList.toggle('active', page.id === pageId);
        });

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
    }

    setupLogout() {
        const btn = document.getElementById('logout-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                Auth.logout();
            });
        }
    }

    setupGoToBuild() {
        const btn = document.getElementById('go-to-build');
        if (btn) {
            btn.addEventListener('click', () => {
                this.navigateTo('build-page');
            });
        }
    }

    updateUserInfo() {
        const user = Auth.currentUser;
        if (!user) return;

        const nameEl = document.getElementById('user-name');
        const roleEl = document.getElementById('user-role');
        const avatarEl = document.getElementById('user-avatar');

        if (nameEl) nameEl.textContent = user.name || 'Usuário';
        if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Administrador' : 'Membro';
        if (avatarEl) avatarEl.textContent = (user.name || 'U').charAt(0).toUpperCase();

        if (user.role === 'admin') {
            document.body.classList.add('is-admin');
        } else {
            document.body.classList.remove('is-admin');
        }
    }

    async loadUserDashboard() {
        try {
            const data = await API.get('/api/build/build-limit');

            const usedEl = document.getElementById('user-builds-used');
            const remEl = document.getElementById('user-builds-remaining');
            const limitEl = document.getElementById('user-build-limit');
            const progressEl = document.getElementById('builds-progress');

            if (usedEl) usedEl.textContent = data.used ?? 0;
            if (remEl) remEl.textContent = data.remaining ?? 0;
            if (limitEl) limitEl.textContent = data.limit ?? 5;

            if (progressEl && data.limit > 0) {
                const progressPercent = Math.min(100, Math.max(0, (data.used / data.limit) * 100));
                progressEl.style.width = `${progressPercent}%`;
            }

            await this.loadRecentBuilds();
        } catch (error) {
            console.error('[DashboardService] Error loading stats:', error);
        }
    }

    async loadRecentBuilds() {
        try {
            const builds = await API.get('/api/build/history');
            const container = document.getElementById('user-recent-builds');
            if (!container) return;

            if (!Array.isArray(builds) || builds.length === 0) {
                container.innerHTML = '<p class="empty-message">Nenhum build realizado ainda.</p>';
                return;
            }

            container.innerHTML = builds.slice(0, 5).map(build => this.renderRecentBuildItem(build)).join('');
        } catch (error) {
            console.error('[DashboardService] Error loading recent builds:', error);
        }
    }

    async loadHistory() {
        try {
            const builds = await API.get('/api/build/history');
            const tbody = document.getElementById('history-table-body');
            if (!tbody) return;

            if (!Array.isArray(builds) || builds.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="empty-message">Nenhum build encontrado.</td></tr>';
                return;
            }

            tbody.innerHTML = builds.map(build => this.renderHistoryRow(build)).join('');
        } catch (error) {
            console.error('[DashboardService] Error loading history:', error);
        }
    }

    getStatusLabel(status) {
        const labels = {
            pending: 'Pendente',
            building: 'Compilando',
            completed: 'Concluído',
            failed: 'Falhou'
        };
        return labels[status] || status;
    }

    // Isolated HTML Component Rendering Methods
    renderRecentBuildItem(build) {
        const safeName = Utils.escapeHtml(build.buildName || `Build #${build.id}`);
        const safeStatus = Utils.escapeHtml(build.status || 'pending');
        const safeDate = Utils.formatDate(build.createdAt);
        const statusLabel = Utils.escapeHtml(this.getStatusLabel(build.status));

        return `
            <div class="build-item">
                <div class="build-status ${safeStatus}"></div>
                <div class="build-details">
                    <span class="build-name">${safeName}</span>
                    <span class="build-date">${safeDate}</span>
                </div>
                <span class="status-badge ${safeStatus}">${statusLabel}</span>
            </div>
        `;
    }

    renderHistoryRow(build) {
        const safeId = Utils.escapeHtml(build.id);
        const safeName = Utils.escapeHtml(build.buildName || '-');
        const safeStatus = Utils.escapeHtml(build.status || 'pending');
        const safeSize = Utils.formatFileSize(build.fileSize);
        const safeDownloads = Utils.escapeHtml(build.downloadCount || 0);
        const safeDate = Utils.formatDate(build.createdAt);
        const statusLabel = Utils.escapeHtml(this.getStatusLabel(build.status));

        const actionHtml = build.status === 'completed'
            ? `<a href="/api/build/download/${safeId}?token=${encodeURIComponent(API.token)}" class="btn-table-action" download>Baixar ZIP</a>`
            : `<span style="color:var(--text-muted);font-size:0.75rem;">-</span>`;

        return `
            <tr>
                <td>#${safeId}</td>
                <td>${safeName}</td>
                <td><span class="status-badge ${safeStatus}">${statusLabel}</span></td>
                <td>${safeSize}</td>
                <td>${safeDownloads}</td>
                <td>${safeDate}</td>
                <td>${actionHtml}</td>
            </tr>
        `;
    }
}

// Global Dashboard Instance
const Dashboard = new DashboardService();
