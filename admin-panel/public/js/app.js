const App = {
    async init() {
        console.log('[App] init() started');

        // Safe module initialization
        try { Auth.init(); } catch (e) { console.warn('[App] Auth init warning:', e); }
        try { Dashboard.init(); } catch (e) { console.warn('[App] Dashboard init warning:', e); }
        try { Build.init(); } catch (e) { console.warn('[App] Build init warning:', e); }
        try { Admin.init(); } catch (e) { console.warn('[App] Admin init warning:', e); }

        // Check auth state and show appropriate view
        try {
            const isAuthenticated = await Auth.checkAuth();
            console.log('[App] isAuthenticated:', isAuthenticated);
            if (isAuthenticated) {
                this.showDashboard();
            } else {
                this.showLanding();
            }
        } catch (error) {
            console.error('[App] Check auth error:', error);
            this.showLanding();
        }
    },

    showLanding() {
        console.log('[App] showLanding()');
        const landing = document.getElementById('landing-view');
        const dashboard = document.getElementById('dashboard-view');

        // Hide dashboard
        if (dashboard) {
            dashboard.className = 'view';
            dashboard.setAttribute('style', 'display:none !important');
        }
        // Show landing
        if (landing) {
            landing.className = 'view active';
            landing.setAttribute('style', 'display:block !important; position:relative; z-index:1; min-height:100vh');
        }

        this.closeAuthModal();

        // Update landing navbar action buttons according to auth state
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
            modal.style.display = 'flex';
            modal.classList.add('active');
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
            modal.style.display = 'none';
        }
        document.body.style.overflow = '';
    },

    showDashboard() {
        console.log('[App] showDashboard() called');
        const landing = document.getElementById('landing-view');
        const dashboard = document.getElementById('dashboard-view');

        // Hide landing
        if (landing) {
            landing.className = 'view';
            landing.setAttribute('style', 'display:none !important');
        }
        // Show dashboard with !important inline to beat any CSS rule
        if (dashboard) {
            dashboard.className = 'view active';
            dashboard.setAttribute('style', 'display:flex !important; position:relative; z-index:1; min-height:100vh');
            console.log('[App] dashboard display set to flex, className:', dashboard.className, 'computedDisplay:', getComputedStyle(dashboard).display);
        } else {
            console.error('[App] dashboard-view element NOT FOUND!');
        }

        this.closeAuthModal();

        // Update user info & load dashboard
        try { Dashboard.updateUserInfo(); } catch(e) { console.warn('[App] updateUserInfo error:', e); }
        try { Dashboard.loadUserDashboard(); } catch(e) { console.warn('[App] loadUserDashboard error:', e); }
        try { Build.loadSettings(); } catch(e) {}
        try { Build.loadBuildLimit(); } catch(e) {}

        // If admin, show admin menu
        if (Auth.currentUser?.role === 'admin') {
            document.body.classList.add('is-admin');
        } else {
            document.body.classList.remove('is-admin');
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// Listen for Escape key to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        App.closeAuthModal();
    }
});

// Start app reliably when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
