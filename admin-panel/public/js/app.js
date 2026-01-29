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
            this.showAuth();
        }
    },

    showAuth() {
        document.getElementById('auth-view').classList.add('active');
        document.getElementById('dashboard-view').classList.remove('active');
    },

    showDashboard() {
        document.getElementById('auth-view').classList.remove('active');
        document.getElementById('dashboard-view').classList.add('active');

        // Update user info
        Dashboard.updateUserInfo();

        // Load initial data
        Dashboard.loadUserDashboard();
        Build.loadSettings();
        Build.loadBuildLimit();

        // If admin, show admin menu
        if (Auth.currentUser?.role === 'admin') {
            document.body.classList.add('is-admin');
        }
    }
};

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
