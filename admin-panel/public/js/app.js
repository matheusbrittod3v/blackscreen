/**
 * App - Main Single Page Application Orchestrator & View Router
 */
const App = {
    async init() {
        console.log('[App] Initializing secure frontend orchestrator...');

        // Initialize safe modules
        try { Auth.init(); } catch (e) { console.warn('[App] Auth init warning:', e); }
        try { Dashboard.init(); } catch (e) { console.warn('[App] Dashboard init warning:', e); }
        try { Build.init(); } catch (e) { console.warn('[App] Build init warning:', e); }
        try { Admin.init(); } catch (e) { console.warn('[App] Admin init warning:', e); }

        const hasToken = !!localStorage.getItem('token');

        if (hasToken) {
            // Instantly render dashboard if token exists to eliminate landing page reload flash
            this.showDashboard('user-dashboard');

            try {
                const isAuthenticated = await Auth.checkAuth();
                console.log('[App] checkAuth result:', isAuthenticated);
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
    },

    showLanding() {
        const landing = document.getElementById('landing-view');
        const dashboard = document.getElementById('dashboard-view');

        // Hide dashboard
        if (dashboard) {
            dashboard.className = 'view';
            dashboard.setAttribute('style', 'display:none !important');
        }

        // Show landing page
        if (landing) {
            landing.className = 'view active';
            landing.setAttribute('style', 'display:block !important; position:relative; z-index:1; min-height:100vh');
        }

        document.body.classList.remove('is-admin');
        this.closeAuthModal();

        // Update landing navbar CTA buttons dynamically based on session
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
    },

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
    },

    closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('style', 'display:none !important');
        }
        document.body.style.overflow = '';
    },

    showDashboard(defaultPage = 'user-dashboard') {
        const landing = document.getElementById('landing-view');
        const dashboard = document.getElementById('dashboard-view');

        // Hide landing page and close modal
        if (landing) {
            landing.className = 'view';
            landing.setAttribute('style', 'display:none !important');
        }
        this.closeAuthModal();

        // Show dashboard container
        if (dashboard) {
            dashboard.className = 'view active';
            dashboard.setAttribute('style', 'display:flex !important; position:relative; z-index:1; min-height:100vh');
        } else {
            console.error('[App] CRITICAL: #dashboard-view element missing from DOM!');
            return;
        }

        // Toggle admin menu visibility based on authenticated role
        if (Auth.currentUser?.role === 'admin') {
            document.body.classList.add('is-admin');
        } else {
            document.body.classList.remove('is-admin');
        }

        // Sync user state and navigate to requested page
        try { Dashboard.updateUserInfo(); } catch(e) { console.warn('[App] updateUserInfo error:', e); }
        try { Dashboard.navigateTo(defaultPage); } catch(e) { console.warn('[App] navigateTo error:', e); }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// Global escape key listener to close modals safely
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        App.closeAuthModal();
        if (typeof Admin !== 'undefined' && typeof Admin.closeModal === 'function') {
            Admin.closeModal();
        }
    }
});

// Start application when DOM tree is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
