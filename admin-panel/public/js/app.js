const App = {
    async init() {
        // Safe module initialization
        try { Auth.init(); } catch (e) { console.warn('Auth init warning:', e); }
        try { Dashboard.init(); } catch (e) { console.warn('Dashboard init warning:', e); }
        try { Build.init(); } catch (e) { console.warn('Build init warning:', e); }
        try { Admin.init(); } catch (e) { console.warn('Admin init warning:', e); }

        // Check auth state and show appropriate view
        try {
            const isAuthenticated = await Auth.checkAuth();
            if (isAuthenticated) {
                this.showDashboard();
            } else {
                this.showLanding();
            }
        } catch (error) {
            console.error('Check auth error:', error);
            this.showLanding();
        }
    },

    showLanding() {
        const landing = document.getElementById('landing-view');
        const dashboard = document.getElementById('dashboard-view');

        if (landing) { landing.classList.add('active'); landing.removeAttribute('style'); }
        if (dashboard) { dashboard.classList.remove('active'); dashboard.removeAttribute('style'); }

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

        if (typeof Auth.switchTab === 'function') {
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
        const landing = document.getElementById('landing-view');
        const dashboard = document.getElementById('dashboard-view');

        if (landing) { landing.classList.remove('active'); landing.removeAttribute('style'); }
        if (dashboard) { dashboard.classList.add('active'); dashboard.removeAttribute('style'); }

        this.closeAuthModal();

        // Update user info & load dashboard
        try { Dashboard.updateUserInfo(); } catch(e){}
        try { Dashboard.loadUserDashboard(); } catch(e){}
        try { Build.loadSettings(); } catch(e){}
        try { Build.loadBuildLimit(); } catch(e){}

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
