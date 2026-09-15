/**
 * AuthService Class - Handles Client Authentication & User Session State
 */
class AuthService {
    constructor() {
        this.currentUser = null;
    }

    init() {
        this.setupTabs();
        this.setupForms();
        this.setupPasswordToggle();
        this.checkUrlParams();
    }

    checkUrlParams() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('verified') === '1') {
            App.showAuth('login');
            setTimeout(() => {
                Utils.showToast('🎉 E-mail confirmado com sucesso! Você já pode entrar.', 'success');
            }, 300);
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (params.get('verify_error')) {
            App.showAuth('login');
            setTimeout(() => {
                Utils.showToast('⚠️ Link de confirmação inválido ou expirado. Solicite um novo abaixo.', 'error');
            }, 300);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                this.switchTab(target);
            });
        });
    }

    switchTab(target) {
        const tabs = document.querySelectorAll('.tab-btn');
        const forms = document.querySelectorAll('.auth-form');
        const title = document.getElementById('auth-panel-title');
        const subtitle = document.getElementById('auth-panel-subtitle');

        tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === target));
        forms.forEach(form => {
            form.classList.toggle('active', form.id === `${target}-form`);
        });

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
    }

    setupForms() {
        // Login Form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = e.target.querySelector('button[type="submit"]');
                if (btn) btn.disabled = true;

                const resendBox = document.getElementById('resend-verification-box');
                if (resendBox) resendBox.style.display = 'none';

                try {
                    const email = (document.getElementById('login-email')?.value || '').trim();
                    const password = document.getElementById('login-password')?.value || '';

                    if (!email || !password) {
                        throw new Error('Preencha seu e-mail e senha.');
                    }

                    const data = await API.post('/api/auth/login', { email, password });

                    API.setToken(data.token);
                    this.currentUser = data.user;

                    const passInput = document.getElementById('login-password');
                    if (passInput) passInput.value = '';

                    Utils.showToast('Login realizado com sucesso!', 'success');
                    App.showDashboard('user-dashboard');
                } catch (error) {
                    Utils.showToast(error.message, 'error');

                    if (error.data?.emailNotVerified || error.message?.includes('confirme seu e-mail')) {
                        const emailVal = (document.getElementById('login-email')?.value || '').trim();
                        this.showResendOption(emailVal);
                    }
                } finally {
                    if (btn) btn.disabled = false;
                }
            });
        }

        // Register Form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = e.target.querySelector('button[type="submit"]');
                if (btn) btn.disabled = true;

                try {
                    const name = (document.getElementById('register-name')?.value || '').trim();
                    const email = (document.getElementById('register-email')?.value || '').trim();
                    const password = document.getElementById('register-password')?.value || '';
                    const confirmPassword = document.getElementById('register-confirm')?.value || '';

                    if (!name || !email || !password) {
                        throw new Error('Preencha todos os campos obrigatórios.');
                    }

                    if (password.length < 6) {
                        throw new Error('A senha deve conter no mínimo 6 caracteres.');
                    }

                    if (password !== confirmPassword) {
                        throw new Error('As senhas digitadas não conferem.');
                    }

                    const data = await API.post('/api/auth/register', {
                        name, email, password, confirmPassword
                    });

                    if (data.requireVerification) {
                        Utils.showToast(data.message, 'success');
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
                        Utils.showToast('Conta criada com sucesso!', 'success');
                        App.showDashboard('user-dashboard');
                    }
                } catch (error) {
                    Utils.showToast(error.message, 'error');
                } finally {
                    if (btn) btn.disabled = false;
                }
            });
        }
    }

    showVerificationAlert(email) {
        const box = document.getElementById('resend-verification-box');
        if (box) {
            const safeEmail = Utils.escapeHtml(email);
            box.innerHTML = `
                <div style="background:rgba(108,92,231,0.15);border:1px solid rgba(108,92,231,0.35);border-radius:8px;padding:12px 14px;margin-top:14px;text-align:center;">
                    <p style="font-size:0.8rem;color:#cbd5e1;margin:0 0 8px;">
                        📧 Enviamos um e-mail com link de confirmação para <strong>${safeEmail}</strong>.
                    </p>
                    <button type="button" class="btn-demo-quick" style="width:100%;padding:6px 10px;" onclick="Auth.resendVerification('${safeEmail}')">
                        Reenviar E-mail de Confirmação
                    </button>
                </div>
            `;
            box.style.display = 'block';
        }
    }

    showResendOption(email) {
        const box = document.getElementById('resend-verification-box');
        if (box) {
            const safeEmail = Utils.escapeHtml(email);
            box.innerHTML = `
                <div style="background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:12px 14px;margin-top:14px;text-align:center;">
                    <p style="font-size:0.8rem;color:#fca5a5;margin:0 0 8px;">
                        ⚠️ Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada e spam.
                    </p>
                    <button type="button" class="btn-demo-quick" style="width:100%;padding:6px 10px;" onclick="Auth.resendVerification('${safeEmail}')">
                        Reenviar Link de Confirmação
                    </button>
                </div>
            `;
            box.style.display = 'block';
        }
    }

    async resendVerification(email) {
        if (!email) {
            email = (document.getElementById('login-email')?.value || '').trim();
        }
        if (!email) {
            return Utils.showToast('Por favor, informe seu e-mail no campo de login.', 'error');
        }

        try {
            const data = await API.post('/api/auth/resend-verification', { email });
            Utils.showToast(data.message, 'success');
        } catch (error) {
            Utils.showToast(error.message, 'error');
        }
    }

    setupPasswordToggle() {
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = btn.parentElement.querySelector('input');
                const eyeOpen = btn.querySelector('.eye-open');
                const eyeClosed = btn.querySelector('.eye-closed');

                if (input.type === 'password') {
                    input.type = 'text';
                    if (eyeOpen) eyeOpen.classList.add('hidden');
                    if (eyeClosed) eyeClosed.classList.remove('hidden');
                } else {
                    input.type = 'password';
                    if (eyeOpen) eyeOpen.classList.remove('hidden');
                    if (eyeClosed) eyeClosed.classList.add('hidden');
                }
            });
        });
    }

    async checkAuth() {
        if (!API.token) return false;

        try {
            const data = await API.get('/api/auth/me');
            if (data && data.user) {
                this.currentUser = data.user;
                return true;
            }
            API.setToken(null);
            this.currentUser = null;
            return false;
        } catch (error) {
            API.setToken(null);
            this.currentUser = null;
            return false;
        }
    }

    logout() {
        API.setToken(null);
        this.currentUser = null;
        document.body.classList.remove('is-admin');
        App.showLanding();
        Utils.showToast('Logout realizado com sucesso', 'info');
    }
}

// Global Auth Instance
const Auth = new AuthService();
