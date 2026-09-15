/**
 * BlackScreenTool - SPA Orchestrator Controller
 * Dynamically mounts component templates on-demand into #app and #modal-root
 */
class AppController {
    constructor() {
        this.currentView = null;
    }

    async init() {
        console.log('[App] Initializing On-Demand View Renderer...');
        const hasToken = !!localStorage.getItem('token');

        if (hasToken) {
            this.showDashboard('user-dashboard');
            try {
                const isAuthenticated = await Auth.checkAuth();
                if (!isAuthenticated) this.showLanding();
            } catch (error) {
                console.error('[App] Check auth error:', error);
                this.showLanding();
            }
        } else {
            this.showLanding();
        }
    }

    showLanding() {
        if (this.currentView === 'landing') return;

        const appContainer = document.getElementById('app');
        if (appContainer) {
            appContainer.innerHTML = LandingComponent.render();
            this.currentView = 'landing';
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
        const modalRoot = document.getElementById('modal-root');
        if (modalRoot) {
            modalRoot.innerHTML = AuthModalComponent.render();
            document.body.style.overflow = 'hidden';
            Auth.init();
            Auth.switchTab(tab);
        }
    }

    closeAuthModal() {
        const modalRoot = document.getElementById('modal-root');
        if (modalRoot) {
            modalRoot.innerHTML = '';
        }
        document.body.style.overflow = '';
    }

    showDashboard(defaultPage = 'user-dashboard') {
        const appContainer = document.getElementById('app');
        if (appContainer && this.currentView !== 'dashboard') {
            appContainer.innerHTML = DashboardComponent.render();
            this.currentView = 'dashboard';

            // Safe service re-binding on new DOM
            Dashboard.init();
            Build.init();
            Admin.init();
        }

        this.closeAuthModal();

        if (Auth.currentUser?.role === 'admin') {
            document.body.classList.add('is-admin');
        } else {
            document.body.classList.remove('is-admin');
        }

        try { Dashboard.updateUserInfo(); } catch(e) {}
        try { Dashboard.navigateTo(defaultPage); } catch(e) {}

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Global App instance exposed for inline DOM event handlers (onclick="App.showAuth(...)")
const App = new AppController();
window.App = App;

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        App.closeAuthModal();
        if (typeof Admin !== 'undefined' && typeof Admin.closeModal === 'function') {
            Admin.closeModal();
        }
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
