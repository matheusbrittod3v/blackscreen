// Auth Module
const Auth = {
    currentUser: null,

    init() {
        this.setupTabs();
        this.setupForms();
        this.setupPasswordToggle();
        this.checkUrlParams();
    },

    checkUrlParams() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('verified') === '1') {
            App.showAuth('login');
            setTimeout(() => {
                showToast('🎉 E-mail confirmado com sucesso! Você já pode entrar.', 'success');
            }, 300);
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (params.get('verify_error')) {
            App.showAuth('login');
            setTimeout(() => {
                showToast('⚠️ Link de confirmação inválido ou expirado. Solicite um novo abaixo.', 'error');
            }, 300);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    },

    setupTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                this.switchTab(target);
            });
        });
    },

    switchTab(target) {
        const tabs = document.querySelectorAll('.tab-btn');
        const forms = document.querySelectorAll('.auth-form');
        const title = document.getElementById('auth-panel-title');
        const subtitle = document.getElementById('auth-panel-subtitle');

        tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === target));
        forms.forEach(form => {
            form.classList.toggle('active', form.id === `${target}-form`);
        });

        // Hide resend box when switching tabs
        const resendBox = document.getElementById('resend-verification-box');
        if (resendBox) resendBox.style.display = 'none';

        if (title && subtitle) {
            if (target === 'register') {
                title.textContent = 'Crie sua Conta Isolada';
                subtitle.textContent = 'Cadastre-se para obter um espaço privativo de builds e configurações';
            } else {
                title.textContent = 'Acesse sua Conta';
                subtitle.textContent = 'Entre com suas credenciais para gerenciar seus builds';
            }
        }
    },

    fillDemo(type) {
        this.switchTab('login');
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        if (type === 'admin') {
            emailInput.value = 'admin@blacktool.com';
            passwordInput.value = 'admin123';
        } else {
            emailInput.value = 'user@blacktool.com';
            passwordInput.value = 'user123';
        }
        showToast(`Credenciais de ${type === 'admin' ? 'Administrador' : 'Usuário'} preenchidas!`, 'info');
    },

    setupForms() {
        // Login Form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = e.target.querySelector('button[type="submit"]');
                if (btn) btn.classList.add('loading');

                const resendBox = document.getElementById('resend-verification-box');
                if (resendBox) resendBox.style.display = 'none';

                try {
                    const email = document.getElementById('login-email')?.value || '';
                    const password = document.getElementById('login-password')?.value || '';

                    const data = await API.post('/api/auth/login', { email, password });

                    API.setToken(data.token);
                    this.currentUser = data.user;

                    showToast('Login realizado com sucesso!', 'success');
                    App.showDashboard();
                } catch (error) {
                    showToast(error.message, 'error');

                    if (error.data?.emailNotVerified || error.message?.includes('confirme seu e-mail')) {
                        const emailVal = document.getElementById('login-email')?.value || '';
                        this.showResendOption(emailVal);
                    }
                } finally {
                    if (btn) btn.classList.remove('loading');
                }
            });
        }

        // Register Form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = e.target.querySelector('button[type="submit"]');
                if (btn) btn.classList.add('loading');

                try {
                    const name = document.getElementById('register-name')?.value || '';
                    const email = document.getElementById('register-email')?.value || '';
                    const password = document.getElementById('register-password')?.value || '';
                    const confirmPassword = document.getElementById('register-confirm')?.value || '';

                    if (password !== confirmPassword) {
                        throw new Error('As senhas não conferem');
                    }

                    const data = await API.post('/api/auth/register', {
                        name, email, password, confirmPassword
                    });

                    if (data.requireVerification) {
                        showToast(data.message, 'success');
                        this.switchTab('login');
                        const loginEmail = document.getElementById('login-email');
                        const loginPass = document.getElementById('login-password');
                        if (loginEmail) loginEmail.value = email;
                        if (loginPass) loginPass.value = '';
                        registerForm.reset();
                        this.showVerificationAlert(email);
                    } else if (data.token) {
                        API.setToken(data.token);
                        this.currentUser = data.user;
                        showToast('Conta criada com sucesso!', 'success');
                        App.showDashboard();
                    }
                } catch (error) {
                    showToast(error.message, 'error');
                } finally {
                    if (btn) btn.classList.remove('loading');
                }
            });
        }
    },

    showVerificationAlert(email) {
        const box = document.getElementById('resend-verification-box');
        if (box) {
            box.innerHTML = `
                <div style="background:rgba(108,92,231,0.15);border:1px solid rgba(108,92,231,0.35);border-radius:8px;padding:12px 14px;margin-top:14px;text-align:center;">
                    <p style="font-size:0.8rem;color:#cbd5e1;margin:0 0 8px;">
                        📧 Enviamos um e-mail com link de confirmação para <strong>${email}</strong>.
                    </p>
                    <button type="button" class="btn-demo-quick" style="width:100%;padding:6px 10px;" onclick="Auth.resendVerification('${email}')">
                        Reenviar E-mail de Confirmação
                    </button>
                </div>
            `;
            box.style.display = 'block';
        }
    },

    showResendOption(email) {
        const box = document.getElementById('resend-verification-box');
        if (box) {
            box.innerHTML = `
                <div style="background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:12px 14px;margin-top:14px;text-align:center;">
                    <p style="font-size:0.8rem;color:#fca5a5;margin:0 0 8px;">
                        ⚠️ Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada e spam.
                    </p>
                    <button type="button" class="btn-demo-quick" style="width:100%;padding:6px 10px;" onclick="Auth.resendVerification('${email}')">
                        Reenviar Link de Confirmação
                    </button>
                </div>
            `;
            box.style.display = 'block';
        }
    },

    async resendVerification(email) {
        if (!email) {
            email = document.getElementById('login-email').value;
        }
        if (!email) {
            return showToast('Por favor, informe seu e-mail no campo de login.', 'error');
        }

        try {
            const data = await API.post('/api/auth/resend-verification', { email });
            showToast(data.message, 'success');
        } catch (error) {
            showToast(error.message, 'error');
        }
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
        App.showLanding();
        showToast('Logout realizado com sucesso', 'info');
    }
};
