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
        const landing = document.getElementById('landing-view');
        const auth = document.getElementById('auth-view');
        const dashboard = document.getElementById('dashboard-view');

        if (landing) { landing.classList.add('active'); landing.style.display = 'block'; }
        if (auth) { auth.classList.remove('active'); auth.style.display = 'none'; }
        if (dashboard) { dashboard.classList.remove('active'); dashboard.style.display = 'none'; }

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
        const landing = document.getElementById('landing-view');
        const auth = document.getElementById('auth-view');
        const dashboard = document.getElementById('dashboard-view');

        if (landing) { landing.classList.remove('active'); landing.style.display = 'none'; }
        if (auth) { auth.classList.add('active'); auth.style.display = 'block'; }
        if (dashboard) { dashboard.classList.remove('active'); dashboard.style.display = 'none'; }

        Auth.switchTab(tab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    showDashboard() {
        const landing = document.getElementById('landing-view');
        const auth = document.getElementById('auth-view');
        const dashboard = document.getElementById('dashboard-view');

        if (landing) { landing.classList.remove('active'); landing.style.display = 'none'; }
        if (auth) { auth.classList.remove('active'); auth.style.display = 'none'; }
        if (dashboard) { dashboard.classList.add('active'); dashboard.style.display = 'block'; }

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
