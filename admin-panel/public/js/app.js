// Main App
const App = {
    async init() {
        // Initialize modules
        Auth.init();
        Dashboard.init();
        Build.init();
        Admin.init();

        // Check auth state
        const isAuthenticated = await Auth.checkAuth();

        if (isAuthenticated) {
            this.showDashboard();
        } else {
            this.showLanding();
        }
    },

    showLanding() {
        document.getElementById('landing-view')?.classList.add('active');
        document.getElementById('auth-view')?.classList.remove('active');
        document.getElementById('dashboard-view')?.classList.remove('active');

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

        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    showAuth(tab = 'login') {
        document.getElementById('landing-view')?.classList.remove('active');
        document.getElementById('auth-view')?.classList.add('active');
        document.getElementById('dashboard-view')?.classList.remove('active');

        Auth.switchTab(tab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    showDashboard() {
        document.getElementById('landing-view')?.classList.remove('active');
        document.getElementById('auth-view')?.classList.remove('active');
        document.getElementById('dashboard-view')?.classList.add('active');

        // Update user info
        Dashboard.updateUserInfo();

        // Load initial data
        Dashboard.loadUserDashboard();
        Build.loadSettings();
        Build.loadBuildLimit();

        // If admin, show admin menu
        if (Auth.currentUser?.role === 'admin') {
            document.body.classList.add('is-admin');
        } else {
            document.body.classList.remove('is-admin');
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
