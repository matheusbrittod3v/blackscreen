// Auth Module
const Auth = {
    currentUser: null,

    init() {
        this.setupTabs();
        this.setupForms();
        this.setupPasswordToggle();
    },

    setupTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        const forms = document.querySelectorAll('.auth-form');
        const indicator = document.querySelector('.tab-indicator');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;

                // Update tabs
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Update forms
                forms.forEach(form => {
                    form.classList.remove('active');
                    if (form.id === `${target}-form`) {
                        form.classList.add('active');
                    }
                });
            });
        });
    },

    setupForms() {
        // Login Form
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            btn.classList.add('loading');

            try {
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;

                const data = await API.post('/api/auth/login', { email, password });

                API.setToken(data.token);
                this.currentUser = data.user;

                showToast('Login realizado com sucesso!', 'success');
                App.showDashboard();
            } catch (error) {
                showToast(error.message, 'error');
            } finally {
                btn.classList.remove('loading');
            }
        });

        // Register Form
        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            btn.classList.add('loading');

            try {
                const name = document.getElementById('register-name').value;
                const email = document.getElementById('register-email').value;
                const password = document.getElementById('register-password').value;
                const confirmPassword = document.getElementById('register-confirm').value;

                if (password !== confirmPassword) {
                    throw new Error('As senhas não conferem');
                }

                const data = await API.post('/api/auth/register', {
                    name, email, password, confirmPassword
                });

                API.setToken(data.token);
                this.currentUser = data.user;

                showToast('Conta criada com sucesso!', 'success');
                App.showDashboard();
            } catch (error) {
                showToast(error.message, 'error');
            } finally {
                btn.classList.remove('loading');
            }
        });
    },

    setupPasswordToggle() {
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = btn.parentElement.querySelector('input');
                const eyeOpen = btn.querySelector('.eye-open');
                const eyeClosed = btn.querySelector('.eye-closed');

                if (input.type === 'password') {
                    input.type = 'text';
                    eyeOpen.classList.add('hidden');
                    eyeClosed.classList.remove('hidden');
                } else {
                    input.type = 'password';
                    eyeOpen.classList.remove('hidden');
                    eyeClosed.classList.add('hidden');
                }
            });
        });
    },

    async checkAuth() {
        if (!API.token) return false;

        try {
            const data = await API.get('/api/auth/me');
            this.currentUser = data.user;
            return true;
        } catch (error) {
            API.setToken(null);
            return false;
        }
    },

    logout() {
        API.setToken(null);
        this.currentUser = null;
        App.showAuth();
        showToast('Logout realizado', 'info');
    }
};
