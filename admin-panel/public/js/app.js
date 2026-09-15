/**
 * App Class - SPA Controller & Global Event Router
 */
class App {
    async init() {
        console.log('[App] Initializing ES6 SPA Orchestrator...');

        // Initialize services
        try { Auth.init(); } catch (e) { console.warn('[App] Auth init warning:', e); }
        try { Dashboard.init(); } catch (e) { console.warn('[App] Dashboard init warning:', e); }
        try { Build.init(); } catch (e) { console.warn('[App] Build init warning:', e); }
        try { Admin.init(); } catch (e) { console.warn('[App] Admin init warning:', e); }

        const hasToken = !!localStorage.getItem('token');

        if (hasToken) {
            this.showDashboard('user-dashboard');

            try {
                const isAuthenticated = await Auth.checkAuth();
                if (!isAuthenticated) {
                    this.showLanding();
                }
            } catch (error) {
                console.error('[App] Check auth exception:', error);
                this.showLanding();
            }
        } else {
            this.showLanding();
        }
    }

    showLanding() {
        const landing = document.getElementById('landing-view');
        const dashboard = document.getElementById('dashboard-view');

        if (dashboard) {
            dashboard.className = 'view';
            dashboard.setAttribute('style', 'display:none !important');
        }

        if (landing) {
            landing.className = 'view active';
            landing.setAttribute('style', 'display:block !important; position:relative; z-index:1; min-height:100vh');
        }

        document.body.classList.remove('is-admin');
        this.closeAuthModal();

        const actionsContainer = document.getElementById('landing-nav-auth-buttons');
        if (actionsContainer) {
            if (Auth.currentUser) {
                actionsContainer.innerHTML = `
                    <button class="btn-nav-ghost" onclick="App.showDashboard()">Ir para o Painel &rarr;</button>
                    <button class="btn-nav-cta" onclick="Auth.logout()">Sair</button>
                `;
            } else {
                actionsContainer.innerHTML = `
                    <button class="btn-nav-ghost" onclick="App.showAuth('login')">Entrar</button>
                    <button class="btn-nav-cta" onclick="App.showAuth('register')">Criar Conta</button>
                `;
            }
        }
    }

    showAuth(tab = 'login') {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.add('active');
            modal.setAttribute('style', 'display:flex !important');
            document.body.style.overflow = 'hidden';
        }

        if (typeof Auth !== 'undefined' && typeof Auth.switchTab === 'function') {
            Auth.switchTab(tab);
        }
    }

    closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('style', 'display:none !important');
        }
        document.body.style.overflow = '';
    }

    showDashboard(defaultPage = 'user-dashboard') {
        const landing = document.getElementById('landing-view');
        const dashboard = document.getElementById('dashboard-view');

        if (landing) {
            landing.className = 'view';
            landing.setAttribute('style', 'display:none !important');
        }
        this.closeAuthModal();

        if (dashboard) {
            dashboard.className = 'view active';
            dashboard.setAttribute('style', 'display:flex !important; position:relative; z-index:1; min-height:100vh');
        } else {
            console.error('[App] CRITICAL: #dashboard-view missing!');
            return;
        }

        if (Auth.currentUser?.role === 'admin') {
            document.body.classList.add('is-admin');
        } else {
            document.body.classList.remove('is-admin');
        }

        try { Dashboard.updateUserInfo(); } catch(e) { console.warn('[App] updateUserInfo error:', e); }
        try { Dashboard.navigateTo(defaultPage); } catch(e) { console.warn('[App] navigateTo error:', e); }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Instantiate and expose global App singleton
const windowApp = new App();
window.App = windowApp;

// Global ESC key listener for modal closing
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        windowApp.closeAuthModal();
        if (typeof Admin !== 'undefined' && typeof Admin.closeModal === 'function') {
            Admin.closeModal();
        }
    }
});

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => windowApp.init());
} else {
    windowApp.init();
}
