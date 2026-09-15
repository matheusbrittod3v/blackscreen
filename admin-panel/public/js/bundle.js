/**
 * BlackScreenTool - Single Entry Point Bundle
 * Dynamic On-Demand View Renderer & Security Modules
 */

/* ============================================
   1. UTILS & SECURITY HELPERS
   ============================================ */
class Utils {
    static escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    static formatDate(dateString) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return '-';
        }
    }

    static formatFileSize(bytes) {
        if (!bytes || isNaN(bytes) || bytes === 0) return '-';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
    }

    static showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = String(message || '');
        toast.className = `toast ${type} show`;

        if (this._toastTimer) clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    }
}

function showToast(message, type = 'info') { Utils.showToast(message, type); }
function formatDate(dateString) { return Utils.formatDate(dateString); }
function formatFileSize(bytes) { return Utils.formatFileSize(bytes); }

/* ============================================
   2. API CLIENT SERVICE
   ============================================ */
class ApiService {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
        return headers;
    }

    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: { ...this.getHeaders(), ...options.headers }
            });

            let data = {};
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                data = { message: text };
            }

            if (!response.ok) {
                if ((response.status === 401 || response.status === 403) && this.token) {
                    if (data.error !== 'Conta desativada' && !endpoint.includes('/login')) {
                        this.setToken(null);
                        if (typeof Auth !== 'undefined') Auth.currentUser = null;
                        if (typeof window.App !== 'undefined' && typeof window.App.showLanding === 'function') {
                            window.App.showLanding();
                            Utils.showToast('Sessão expirada. Por favor, faça login novamente.', 'warning');
                        }
                    }
                }
                const err = new Error(data.error || data.message || 'Erro na requisição');
                err.data = data;
                err.status = response.status;
                throw err;
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    async get(endpoint) { return this.request(endpoint, { method: 'GET' }); }
    async post(endpoint, body) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) }); }
    async put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) }); }
    async delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }

    async upload(endpoint, formData) {
        const headers = {};
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers,
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            const err = new Error(data.error || 'Erro no envio do arquivo');
            err.data = data;
            err.status = response.status;
            throw err;
        }
        return data;
    }
}

const API = new ApiService();

/* ============================================
   3. DYNAMIC TEMPLATE COMPONENTS
   ============================================ */
class LandingComponent {
    static render() {
        return `
        <div id="landing-view" class="view active" style="display:block !important; position:relative; z-index:1; min-height:100vh;">
            <div class="landing-container">
                <nav class="landing-nav">
                    <div class="landing-brand" onclick="App.showLanding()">
                        <div class="logo-icon" style="background:transparent;">
                            <img src="img/logo.png" alt="BlackScreen Tool" style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 0 12px rgba(225,29,72,0.7));">
                        </div>
                        <span>BlackScreen<span class="gradient-text">Tool</span> <span style="font-size:0.65rem;background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.4);padding:2px 6px;border-radius:4px;color:#f87171;vertical-align:middle;margin-left:4px;">FOR UNLOCKERS</span></span>
                    </div>

                    <ul class="landing-links">
                        <li><a href="#features">Recursos Unlocker</a></li>
                        <li><a href="#how-it-works">Como Funciona</a></li>
                        <li><a href="#security-unlock">Segurança & Sigilo</a></li>
                    </ul>

                    <div class="landing-nav-actions" id="landing-nav-auth-buttons">
                        <button class="btn-nav-ghost" onclick="App.showAuth('login')">Entrar</button>
                        <button class="btn-nav-cta" onclick="App.showAuth('register')">Criar Conta</button>
                    </div>
                </nav>

                <section class="landing-hero">
                    <h1 class="hero-title">
                        Escureça a Tela do Cliente e Trabalhe em uma <br>
                        <span class="gradient-text">Área de Trabalho Virtual</span> com Sigilo Absoluto
                    </h1>

                    <p class="hero-description">
                        O <strong>Black Screen Tool</strong> foi desenvolvido especialmente para unlockers realizarem procedimentos remotos (FRP, iCloud, MDM, Xiaomi, Flashing). Crie um desktop virtual secreto, escureça o monitor do cliente e exiba sua mensagem e logo animada enquanto você opera suas ferramentas protegido de olhares curiosos.
                    </p>

                    <div class="hero-actions">
                        <button class="btn-hero-primary" onclick="App.showAuth('register')">
                            <span>Criar Meu Executável Personalizado</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </button>
                        <button class="btn-hero-secondary" onclick="App.showAuth('login')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                                <polyline points="10 17 15 12 10 7"></polyline>
                                <line x1="15" y1="12" x2="3" y2="12"></line>
                            </svg>
                            <span>Acessar Painel do Unlocker</span>
                        </button>
                    </div>

                    <div class="hero-badges">
                        <div class="hero-badge-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="9" y1="3" x2="9" y2="21"></line>
                            </svg>
                            <span>Área de Trabalho Virtual Isolada</span>
                        </div>
                        <div class="hero-badge-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                            </svg>
                            <span>Tela Preta (Blackout) no Cliente</span>
                        </div>
                        <div class="hero-badge-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                            </svg>
                            <span>Logo & GIF Animado Personalizado</span>
                        </div>
                        <div class="hero-badge-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <span>Destravamento por Senha Master</span>
                        </div>
                    </div>

                    <div class="hero-mockup-wrapper" id="security-unlock">
                        <div class="hero-mockup-card">
                            <div class="mockup-header">
                                <div class="mockup-dots">
                                    <div class="mockup-dot red"></div>
                                    <div class="mockup-dot yellow"></div>
                                    <div class="mockup-dot green"></div>
                                </div>
                                <span class="mockup-title">Visão Comparativa em Tempo Real: Cliente vs Unlocker</span>
                                <span class="mockup-badge">MODO UNLOCK ATIVO</span>
                            </div>
                            <div class="mockup-content">
                                <div class="mockup-pane" style="background:#000000;border:1px solid rgba(255,255,255,0.12);text-align:center;padding:24px 18px;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                                    <div style="font-size:0.75rem;color:var(--danger);text-transform:uppercase;font-weight:700;letter-spacing:1px;margin-bottom:12px;background:rgba(239,68,68,0.15);padding:3px 10px;border-radius:4px;">
                                        👁️ O que o Cliente Vê no Monitor
                                    </div>
                                    <div style="width:110px;height:110px;margin-bottom:6px;filter:drop-shadow(0 0 25px rgba(225,29,72,0.8));">
                                        <img src="img/logo.png" alt="BlackScreen Tool Hydra Logo" style="width:100%;height:100%;object-fit:contain;">
                                    </div>
                                    <div style="font-size:0.7rem;color:var(--accent-pink);font-weight:700;letter-spacing:0.5px;margin-bottom:8px;">
                                        ⚡ MARCA DO SERVIDOR & ANIMADO
                                    </div>
                                    <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:12px;margin:8px 0;width:90%;">
                                        <p style="font-size:0.82rem;font-weight:600;color:#fff;margin:0 0 4px;">
                                            &ldquo;Procedimento técnico em andamento. Aguarde...&rdquo;
                                        </p>
                                        <p style="font-size:0.72rem;color:#f87171;margin:0;">
                                            ⚠️ Não mexa no mouse nem desconecte o cabo USB!
                                        </p>
                                    </div>
                                    <div style="font-size:0.68rem;color:var(--text-muted);margin-top:6px;">
                                        🔒 Teclado e Mouse do cliente inoperantes. Bloqueado com sua Senha.
                                    </div>
                                </div>

                                <div class="mockup-pane" style="background:#0d1117;border:1px solid rgba(108,92,231,0.3);padding:20px;">
                                    <div style="font-size:0.75rem;color:var(--accent-green);text-transform:uppercase;font-weight:700;letter-spacing:1px;margin-bottom:12px;background:rgba(39,201,63,0.15);padding:3px 10px;border-radius:4px;display:inline-block;">
                                        🤫 Sua Área Virtual Secreta (Invisível)
                                    </div>
                                    <div class="mockup-terminal" style="font-size:0.78rem;line-height:1.7;">
                                        <span class="t-purple">&gt; Desktop Virtual #2 Criado</span> [Isolamento 100%]<br>
                                        <span class="t-green">&#10004; Tela do cliente: Blackout Ativo</span><br>
                                        <span class="t-cyan">&gt; Executando UnlockTool / Chimera / Pandora...</span><br>
                                        <span class="t-cyan">&gt; Porta COM3 (Qualcomm EDL 9008): Conectada</span><br>
                                        <span class="t-green">&#10004; Bypass FRP / MDM: 100% Concluído</span><br>
                                        <span class="t-purple">&gt; Digite sua senha master para restaurar a tela.</span>
                                    </div>
                                    <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center;">
                                        <span style="font-size:0.72rem;color:var(--text-muted);">Suas senhas, dongles e créditos protegidos</span>
                                        <span style="font-size:0.7rem;font-weight:700;color:var(--accent-green);">SIGILO TOTAL</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="features" class="landing-features">
                    <div class="section-header">
                        <h2>Recursos Criados Exclusivamente para Unlockers</h2>
                        <p>Tudo o que você precisa para prestar suporte remoto profissional, proteger seus métodos e manter o cliente sob controle durante o serviço.</p>
                    </div>

                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon-wrapper">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                    <line x1="8" y1="21" x2="16" y2="21"></line>
                                    <line x1="12" y1="17" x2="12" y2="21"></line>
                                </svg>
                            </div>
                            <h3>Áreas de Trabalho Virtuais</h3>
                            <p>Crie um desktop Windows virtual em segundo plano. Opere suas ferramentas de desbloqueio sem que o cliente veja seus arquivos, licenças de dongles ou créditos de servidor.</p>
                        </div>

                        <div class="feature-card">
                            <div class="feature-icon-wrapper">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                                </svg>
                            </div>
                            <h3>Blackout (Tela Preta) no Cliente</h3>
                            <p>Escurece completamente o monitor do cliente durante o atendimento via AnyDesk ou TeamViewer, evitando que ele clique, feche janelas ou interrompa o processo.</p>
                        </div>

                        <div class="feature-card">
                            <div class="feature-icon-wrapper">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </div>
                            <h3>Mensagem Personalizada na Tela</h3>
                            <p>Exiba orientações personalizadas na tela preta do cliente, como alertas de segurança: <em>&ldquo;Aguarde, procedimento técnico em andamento. Não desconecte o cabo USB!&rdquo;</em>.</p>
                        </div>

                        <div class="feature-card">
                            <div class="feature-icon-wrapper">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                                </svg>
                            </div>
                            <h3>Logo e GIF Animado do Servidor</h3>
                            <p>Carregue a identidade visual do seu servidor ou assistência: logo PNG transparente, ícone do executável (.ico) e animação GIF personalizada em alta resolução.</p>
                        </div>

                        <div class="feature-card">
                            <div class="feature-icon-wrapper">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                            </div>
                            <h3>Senha Master de Desbloqueio</h3>
                            <p>Apenas quem tem sua senha master consegue restaurar a tela do cliente. Ao finalizar o bypass ou gravação de software, destranque a tela em 1 segundo.</p>
                        </div>

                        <div class="feature-card">
                            <div class="feature-icon-wrapper">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                                    <polyline points="2 17 12 22 22 17"></polyline>
                                    <polyline points="2 12 12 17 22 12"></polyline>
                                </svg>
                            </div>
                            <h3>Compilação em Nuvem em 1 Clique</h3>
                            <p>Não instale compiladores pesados no seu PC. Nosso servidor .NET 9 gera seu pacote ZIP com o BlackScreenTool.exe configurado e pronto para download imediato.</p>
                        </div>
                    </div>
                </section>

                <section id="how-it-works" class="landing-steps">
                    <div class="section-header">
                        <h2>Como Funciona no seu Dia a Dia de Unlocker</h2>
                        <p>O fluxo de trabalho mais rápido e seguro para seus atendimentos remotos.</p>
                    </div>

                    <div class="steps-grid">
                        <div class="step-card">
                            <div class="step-number">1</div>
                            <h3>Configure sua Marca & Senha</h3>
                            <p>No painel web, defina sua senha master de desbloqueio, digite a mensagem para o cliente e envie sua logo PNG e GIF animado.</p>
                        </div>
                        <div class="step-card">
                            <div class="step-number">2</div>
                            <h3>Gere seu Executável Único</h3>
                            <p>Clique em Iniciar Compilação. Em poucos segundos o servidor compila seu BlackScreenTool.exe customizado para você baixar.</p>
                        </div>
                        <div class="step-card">
                            <div class="step-number">3</div>
                            <h3>Execute no Cliente com Sigilo</h3>
                            <p>Abra no PC do cliente durante o AnyDesk. A tela escurece com sua marca, seu desktop virtual se abre e você trabalha com 100% de sigilo.</p>
                        </div>
                    </div>
                </section>

                <section class="landing-cta" id="status-section">
                    <div class="cta-box">
                        <h2>Leve seus Atendimentos de Unlocker ao Nível Profissional</h2>
                        <p>Cadastre-se gratuitamente no BlackScreen Tool e tenha seu próprio software de tela preta e desktop virtual com a identidade do seu serviço.</p>
                        <button class="btn-hero-primary" onclick="App.showAuth('register')">
                            <span>Criar Minha Conta de Unlocker</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </button>
                    </div>
                </section>

                <footer class="landing-footer">
                    <div class="footer-brand">
                        <div class="logo-icon" style="width:40px;height:40px;background:transparent;">
                            <img src="img/logo.png" alt="BlackScreen Tool" style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 0 10px rgba(225,29,72,0.6));">
                        </div>
                        <span>BlackScreen Tool &bull; A ferramenta essencial para Unlockers &copy; 2026. blackscreentool.com.br</span>
                    </div>
                </footer>
            </div>
        </div>
        `;
    }
}

class AuthModalComponent {
    static render() {
        return `
        <div id="auth-modal" class="auth-modal-overlay active" style="display: flex !important;">
            <div class="auth-modal-backdrop" onclick="App.closeAuthModal()"></div>
            <div class="auth-modal-dialog">
                <button class="auth-modal-close" onclick="App.closeAuthModal()" title="Fechar (Esc)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div class="auth-split-card">
                    <div class="auth-showcase-panel">
                        <div class="auth-showcase-content">
                            <div class="showcase-brand">
                                <div class="logo-icon" style="background:transparent;">
                                    <img src="img/logo.png" alt="BlackScreen Tool" style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 0 15px rgba(225,29,72,0.7));">
                                </div>
                                <h2>BlackScreen<span class="gradient-text">Tool</span></h2>
                            </div>
                            <p class="showcase-tagline">
                                Painel de Compilação & Customização de Tela Preta e Áreas de Trabalho Virtuais para Unlockers.
                            </p>

                            <ul class="showcase-features">
                                <li class="showcase-feature-item">
                                    <div class="feature-check-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <div class="feature-text">
                                        <strong>Área de Trabalho Virtual Oculta</strong>
                                        <span>Opere suas ferramentas e dongles sem que o cliente veja seus procedimentos</span>
                                    </div>
                                </li>
                                <li class="showcase-feature-item">
                                    <div class="feature-check-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <div class="feature-text">
                                        <strong>Tela Preta com Logo e GIF Animado</strong>
                                        <span>Exiba sua marca e mensagem personalizada na tela do cliente durante o serviço</span>
                                    </div>
                                </li>
                                <li class="showcase-feature-item">
                                    <div class="feature-check-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <div class="feature-text">
                                        <strong>Bloqueio Seguro com Senha Master</strong>
                                        <span>O cliente não consegue mexer no PC até que você digite a senha de liberação</span>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div class="auth-form-panel">
                        <div class="auth-form-header">
                            <h3 id="auth-panel-title">Acesse sua Conta</h3>
                            <p id="auth-panel-subtitle">Entre com suas credenciais para gerenciar seus builds</p>
                        </div>

                        <div class="auth-tabs">
                            <button class="tab-btn active" data-tab="login">Entrar</button>
                            <button class="tab-btn" data-tab="register">Criar Conta</button>
                            <div class="tab-indicator"></div>
                        </div>

                        <form id="login-form" class="auth-form active">
                            <div class="form-group">
                                <label for="login-email">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                        <polyline points="22,6 12,13 2,6"></polyline>
                                    </svg>
                                    Email
                                </label>
                                <input type="email" id="login-email" placeholder="seu@email.com" required>
                            </div>
                            <div class="form-group">
                                <label for="login-password">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                    Senha
                                </label>
                                <div class="password-input">
                                    <input type="password" id="login-password" placeholder="••••••••" required autocomplete="current-password">
                                    <button type="button" class="toggle-password">
                                        <svg class="eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                        <svg class="eye-closed hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <button type="submit" class="btn-primary btn-full">
                                <span class="btn-text">Entrar no Painel</span>
                                <span class="btn-loader"></span>
                            </button>
                            <div id="resend-verification-box" style="display:none;"></div>
                        </form>

                        <form id="register-form" class="auth-form">
                            <div class="form-group">
                                <label for="register-name">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                    Nome Completo
                                </label>
                                <input type="text" id="register-name" placeholder="Seu nome completo" required>
                            </div>
                            <div class="form-group">
                                <label for="register-email">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                        <polyline points="22,6 12,13 2,6"></polyline>
                                    </svg>
                                    Email
                                </label>
                                <input type="email" id="register-email" placeholder="seu@email.com" required>
                            </div>
                            <div class="form-group">
                                <label for="register-password">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                    Senha
                                </label>
                                <input type="password" id="register-password" placeholder="Mínimo 6 caracteres" required autocomplete="new-password">
                            </div>
                            <div class="form-group">
                                <label for="register-confirm">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                    </svg>
                                    Confirmar Senha
                                </label>
                                <input type="password" id="register-confirm" placeholder="Repita sua senha" required autocomplete="new-password">
                            </div>
                            <button type="submit" class="btn-primary btn-full">
                                <span class="btn-text">Criar Minha Conta Isolada</span>
                                <span class="btn-loader"></span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
}

class DashboardComponent {
    static render() {
        return `
        <div id="dashboard-view" class="view active" style="display:flex !important; position:relative; z-index:1; min-height:100vh;">
            <nav class="sidebar">
                <div class="sidebar-header">
                    <div class="logo-mini" style="background:transparent;width:44px;height:44px;">
                        <img src="img/logo.png" alt="BlackScreen Tool" style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 0 10px rgba(225,29,72,0.6));">
                    </div>
                    <span class="logo-text">BlackScreenTool</span>
                </div>
                <ul class="nav-menu">
                    <li class="nav-item active" data-page="user-dashboard">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="9"></rect>
                            <rect x="14" y="3" width="7" height="5"></rect>
                            <rect x="14" y="12" width="7" height="9"></rect>
                            <rect x="3" y="16" width="7" height="5"></rect>
                        </svg>
                        Dashboard
                    </li>
                    <li class="nav-item" data-page="build-page">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                            <polyline points="2 17 12 22 22 17"></polyline>
                            <polyline points="2 12 12 17 22 12"></polyline>
                        </svg>
                        Build
                    </li>
                    <li class="nav-item" data-page="history-page">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        Histórico
                    </li>
                    <li class="nav-item admin-only" data-page="admin-dashboard">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                        Admin
                    </li>
                </ul>
                <div class="sidebar-footer">
                    <div class="user-info">
                        <div class="user-avatar" id="user-avatar">U</div>
                        <div class="user-details">
                            <span class="user-name" id="user-name">Usuário</span>
                            <span class="user-role" id="user-role">Membro</span>
                        </div>
                    </div>
                    <button id="logout-btn" class="btn-logout" title="Sair">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                    </button>
                </div>
            </nav>

            <main class="main-content">
                <section id="user-dashboard" class="page active">
                    <header class="page-header">
                        <h1>Dashboard</h1>
                        <p>Bem-vindo de volta! Aqui está seu resumo.</p>
                    </header>
                    <div class="dashboard-grid">
                        <div class="stat-card glass-card builds-card">
                            <div class="stat-icon builds-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                                    <polyline points="2 17 12 22 22 17"></polyline>
                                    <polyline points="2 12 12 17 22 12"></polyline>
                                </svg>
                            </div>
                            <div class="stat-info">
                                <span class="stat-value" id="user-builds-used">0</span>
                                <span class="stat-label">Builds este mês</span>
                            </div>
                            <div class="stat-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" id="builds-progress"></div>
                                </div>
                                <span class="progress-text"><span id="user-builds-remaining">5</span> restantes</span>
                            </div>
                        </div>
                        <div class="stat-card glass-card limit-card">
                            <div class="stat-icon limit-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                            </div>
                            <div class="stat-info">
                                <span class="stat-value" id="user-build-limit">5</span>
                                <span class="stat-label">Limite Mensal</span>
                            </div>
                        </div>
                        <div class="action-card glass-card">
                            <h3>Iniciar Novo Build</h3>
                            <p>Configure e compile seu projeto rapidamente.</p>
                            <button class="btn-primary" id="go-to-build">
                                Ir para Build
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="recent-section glass-card">
                        <h3>Builds Recentes</h3>
                        <div id="user-recent-builds" class="builds-list">
                            <p class="empty-message">Nenhum build realizado ainda.</p>
                        </div>
                    </div>
                </section>

                <section id="build-page" class="page">
                    <header class="page-header">
                        <h1>Build Tool</h1>
                        <p>Configure e compile seu executável personalizado.</p>
                    </header>
                    <div class="build-container">
                        <div class="config-grid">
                            <form id="settings-form" class="glass-card config-form">
                                <div class="card-header">
                                    <span class="icon">⚙️</span>
                                    <h3>Configurações Gerais</h3>
                                </div>
                                <div class="input-group">
                                    <label for="correctPassword">Senha de Desbloqueio</label>
                                    <input type="password" id="correctPassword" placeholder="Ex: Sidney2012@" autocomplete="current-password">
                                </div>
                                <div class="input-group">
                                    <label for="customMessage">Mensagem da Tela Preta</label>
                                    <textarea id="customMessage" rows="5" placeholder="Digite a mensagem que aparecerá..."></textarea>
                                </div>
                                <button type="submit" id="saveSettings" class="btn-primary">
                                    <span class="btn-text">Salvar Configurações</span>
                                    <span class="btn-loader"></span>
                                </button>
                            </form>
                            <div class="glass-card assets-form">
                                <div class="card-header">
                                    <span class="icon">🖼️</span>
                                    <h3>Logos e Ícones</h3>
                                </div>
                                <div class="upload-grid">
                                    <div class="upload-item">
                                        <label>Logo Principal (PNG)</label>
                                        <div class="drop-zone" onclick="document.getElementById('file-png').click()">
                                            <div class="drop-content">
                                                <span class="upload-icon">📁</span>
                                                <p>logo.png</p>
                                            </div>
                                            <input type="file" id="file-png" hidden accept=".png">
                                        </div>
                                    </div>
                                    <div class="upload-item">
                                        <label>Ícone Executável (ICO)</label>
                                        <div class="drop-zone" onclick="document.getElementById('file-ico').click()">
                                            <div class="drop-content">
                                                <span class="upload-icon">💎</span>
                                                <p>logo.ico</p>
                                            </div>
                                            <input type="file" id="file-ico" hidden accept=".ico">
                                        </div>
                                    </div>
                                    <div class="upload-item">
                                        <label>Logo Animada (GIF)</label>
                                        <div class="drop-zone" onclick="document.getElementById('file-gif').click()">
                                            <div class="drop-content">
                                                <span class="upload-icon">✨</span>
                                                <p>logo.gif</p>
                                            </div>
                                            <input type="file" id="file-gif" hidden accept=".gif">
                                        </div>
                                    </div>
                                </div>
                                <button id="uploadAssets" class="btn-secondary">Sincronizar Arquivos</button>
                            </div>
                        </div>
                        <div class="glass-card build-card">
                            <div class="build-info">
                                <h3>Pronto para Compilar?</h3>
                                <p>Digite um nome para a build e clique para gerar o executável.</p>
                                <div class="input-group" style="margin:14px 0;">
                                    <label for="buildName">Nome da Build</label>
                                    <input type="text" id="buildName" placeholder="Ex: Cliente_Marcos_FRP">
                                </div>
                                <div class="build-limit-warning" id="build-limit-warning">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                    <span>Você tem <strong id="remaining-count">5</strong> builds restantes este mês.</span>
                                </div>
                            </div>
                            <button id="startBuild" class="btn-build">
                                🚀 INICIAR COMPILAÇÃO
                            </button>
                        </div>
                    </div>
                </section>

                <section id="history-page" class="page">
                    <header class="page-header">
                        <h1>Histórico de Builds</h1>
                        <p>Visualize todos os seus builds anteriores.</p>
                    </header>
                    <div class="glass-card">
                        <div id="build-history" class="builds-table-container">
                            <table class="builds-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nome</th>
                                        <th>Status</th>
                                        <th>Tamanho</th>
                                        <th>Downloads</th>
                                        <th>Data</th>
                                        <th>Ação</th>
                                    </tr>
                                </thead>
                                <tbody id="history-table-body">
                                    <tr>
                                        <td colspan="7" class="empty-message">Carregando...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                ${AdminComponent.render()}
            </main>
        </div>
        `;
    }
}

class AdminComponent {
    static render() {
        return `
        <section id="admin-dashboard" class="page">
            <header class="page-header">
                <h1>Painel Administrativo</h1>
                <p>Gerencie usuários, builds e monitore o sistema.</p>
            </header>

            <div class="admin-stats-grid">
                <div class="admin-stat-card glass-card gradient-blue">
                    <div class="admin-stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                    <div class="admin-stat-content">
                        <span class="admin-stat-value" id="admin-total-users">0</span>
                        <span class="admin-stat-label">Total de Usuários</span>
                    </div>
                </div>
                <div class="admin-stat-card glass-card gradient-purple">
                    <div class="admin-stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                            <polyline points="2 17 12 22 22 17"></polyline>
                            <polyline points="2 12 12 17 22 12"></polyline>
                        </svg>
                    </div>
                    <div class="admin-stat-content">
                        <span class="admin-stat-value" id="admin-total-builds">0</span>
                        <span class="admin-stat-label">Total de Builds</span>
                    </div>
                </div>
                <div class="admin-stat-card glass-card gradient-green">
                    <div class="admin-stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </div>
                    <div class="admin-stat-content">
                        <span class="admin-stat-value" id="admin-active-users">0</span>
                        <span class="admin-stat-label">Usuários Ativos</span>
                    </div>
                </div>
            </div>

            <div class="admin-tabs-container">
                <div class="admin-tabs">
                    <button class="admin-tab active" data-admin-tab="users">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                        </svg>
                        Clientes
                    </button>
                    <button class="admin-tab" data-admin-tab="builds">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                            <polyline points="2 17 12 22 22 17"></polyline>
                        </svg>
                        Builds
                    </button>
                    <button class="admin-tab" data-admin-tab="activity">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                        Atividade
                    </button>
                </div>

                <div class="admin-tab-content active" id="users-tab">
                    <div class="tab-header">
                        <h3>Gerenciamento de Clientes</h3>
                        <button class="btn-primary" id="add-user-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Novo Cliente
                        </button>
                    </div>
                    <div class="table-container glass-card">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nome</th>
                                    <th>Email</th>
                                    <th>Tipo</th>
                                    <th>Limite</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="users-table-body">
                                <tr>
                                    <td colspan="7">Carregando...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="admin-tab-content" id="builds-tab">
                    <div class="tab-header">
                        <h3>Todos os Builds</h3>
                    </div>
                    <div class="table-container glass-card">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Usuário</th>
                                    <th>Nome</th>
                                    <th>Status</th>
                                    <th>Tamanho</th>
                                    <th>Data</th>
                                    <th>Ação</th>
                                </tr>
                            </thead>
                            <tbody id="admin-builds-table-body">
                                <tr>
                                    <td colspan="7">Carregando...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="admin-tab-content" id="activity-tab">
                    <div class="tab-header">
                        <h3>Log de Atividades</h3>
                    </div>
                    <div class="activity-list glass-card" id="activity-list">
                        <p class="empty-message">Carregando atividades...</p>
                    </div>
                </div>
            </div>
        </section>
        `;
    }

    static renderUserModal() {
        return `
        <div id="user-modal" class="modal active" style="display:flex !important;">
            <div class="modal-overlay"></div>
            <div class="modal-container glass-card">
                <div class="modal-header">
                    <h2 id="modal-title">Novo Cliente</h2>
                    <button class="modal-close" onclick="Admin.closeModal()">&times;</button>
                </div>
                <form id="user-form" class="modal-form">
                    <input type="hidden" id="edit-user-id">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="modal-user-name">Nome</label>
                            <input type="text" id="modal-user-name" required>
                        </div>
                        <div class="form-group">
                            <label for="modal-user-email">Email</label>
                            <input type="email" id="modal-user-email" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="modal-user-password">Senha <span class="hint">(deixe vazio para manter)</span></label>
                            <input type="password" id="modal-user-password" autocomplete="new-password">
                        </div>
                        <div class="form-group">
                            <label for="modal-user-role">Tipo</label>
                            <select id="modal-user-role">
                                <option value="user">Usuário</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="modal-user-limit">Limite Mensal de Builds</label>
                            <input type="number" id="modal-user-limit" value="5" min="1">
                        </div>
                        <div class="form-group">
                            <label for="modal-user-active">Status</label>
                            <select id="modal-user-active">
                                <option value="true">Ativo</option>
                                <option value="false">Inativo</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary modal-cancel" onclick="Admin.closeModal()">Cancelar</button>
                        <button type="submit" class="btn-primary">
                            <span class="btn-text">Salvar</span>
                            <span class="btn-loader"></span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
        `;
    }
}

/* ============================================
   4. BUSINESS LOGIC SERVICES
   ============================================ */
class AuthService {
    constructor() { this.currentUser = null; }

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
            setTimeout(() => { Utils.showToast('🎉 E-mail confirmado com sucesso! Você já pode entrar.', 'success'); }, 300);
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (params.get('verify_error')) {
            App.showAuth('login');
            setTimeout(() => { Utils.showToast('⚠️ Link de confirmação inválido ou expirado. Solicite um novo abaixo.', 'error'); }, 300);
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
        forms.forEach(form => { form.classList.toggle('active', form.id === `${target}-form`); });

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

                    if (!email || !password) throw new Error('Preencha seu e-mail e senha.');

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

                    if (!name || !email || !password) throw new Error('Preencha todos os campos obrigatórios.');
                    if (password.length < 6) throw new Error('A senha deve conter no mínimo 6 caracteres.');
                    if (password !== confirmPassword) throw new Error('As senhas digitadas não conferem.');

                    const data = await API.post('/api/auth/register', { name, email, password, confirmPassword });

                    if (data.requireVerification) {
                        Utils.showToast(data.message, 'success');
                        this.switchTab('login');
                        const loginEmail = document.getElementById('login-email');
                        if (loginEmail) loginEmail.value = email;
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
                    <p style="font-size:0.8rem;color:#cbd5e1;margin:0 0 8px;">📧 Enviamos um e-mail com link de confirmação para <strong>${safeEmail}</strong>.</p>
                    <button type="button" class="btn-demo-quick" style="width:100%;padding:6px 10px;" onclick="Auth.resendVerification('${safeEmail}')">Reenviar E-mail de Confirmação</button>
                </div>`;
            box.style.display = 'block';
        }
    }

    showResendOption(email) {
        const box = document.getElementById('resend-verification-box');
        if (box) {
            const safeEmail = Utils.escapeHtml(email);
            box.innerHTML = `
                <div style="background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:12px 14px;margin-top:14px;text-align:center;">
                    <p style="font-size:0.8rem;color:#fca5a5;margin:0 0 8px;">⚠️ Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada e spam.</p>
                    <button type="button" class="btn-demo-quick" style="width:100%;padding:6px 10px;" onclick="Auth.resendVerification('${safeEmail}')">Reenviar Link de Confirmação</button>
                </div>`;
            box.style.display = 'block';
        }
    }

    async resendVerification(email) {
        if (!email) email = (document.getElementById('login-email')?.value || '').trim();
        if (!email) return Utils.showToast('Por favor, informe seu e-mail no campo de login.', 'error');
        try {
            const data = await API.post('/api/auth/resend-verification', { email });
            Utils.showToast(data.message, 'success');
        } catch (error) { Utils.showToast(error.message, 'error'); }
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
            if (data && data.user) { this.currentUser = data.user; return true; }
            API.setToken(null); this.currentUser = null; return false;
        } catch (error) { API.setToken(null); this.currentUser = null; return false; }
    }

    logout() {
        API.setToken(null);
        this.currentUser = null;
        document.body.classList.remove('is-admin');
        App.showLanding();
        Utils.showToast('Logout realizado com sucesso', 'info');
    }
}

const Auth = new AuthService();

class DashboardService {
    init() {
        this.setupNavigation();
        this.setupLogout();
        this.setupGoToBuild();
    }

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });
    }

    navigateTo(pageId) {
        if (!pageId) pageId = 'user-dashboard';
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageId);
        });
        document.querySelectorAll('.page').forEach(page => {
            page.classList.toggle('active', page.id === pageId);
        });

        switch (pageId) {
            case 'user-dashboard': this.loadUserDashboard(); break;
            case 'build-page': if (typeof Build !== 'undefined') { Build.loadSettings(); Build.loadBuildLimit(); } break;
            case 'history-page': this.loadHistory(); break;
            case 'admin-dashboard': if (typeof Admin !== 'undefined') { Admin.loadDashboard(); } break;
        }
    }

    setupLogout() {
        const btn = document.getElementById('logout-btn');
        if (btn) btn.addEventListener('click', () => Auth.logout());
    }

    setupGoToBuild() {
        const btn = document.getElementById('go-to-build');
        if (btn) btn.addEventListener('click', () => this.navigateTo('build-page'));
    }

    updateUserInfo() {
        const user = Auth.currentUser;
        if (!user) return;
        const nameEl = document.getElementById('user-name');
        const roleEl = document.getElementById('user-role');
        const avatarEl = document.getElementById('user-avatar');

        if (nameEl) nameEl.textContent = user.name || 'Usuário';
        if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Administrador' : 'Membro';
        if (avatarEl) avatarEl.textContent = (user.name || 'U').charAt(0).toUpperCase();

        if (user.role === 'admin') document.body.classList.add('is-admin');
        else document.body.classList.remove('is-admin');
    }

    async loadUserDashboard() {
        try {
            const data = await API.get('/api/build/build-limit');
            const usedEl = document.getElementById('user-builds-used');
            const remEl = document.getElementById('user-builds-remaining');
            const limitEl = document.getElementById('user-build-limit');
            const progressEl = document.getElementById('builds-progress');

            if (usedEl) usedEl.textContent = data.used ?? 0;
            if (remEl) remEl.textContent = data.remaining ?? 0;
            if (limitEl) limitEl.textContent = data.limit ?? 5;
            if (progressEl && data.limit > 0) {
                const progressPercent = Math.min(100, Math.max(0, (data.used / data.limit) * 100));
                progressEl.style.width = `${progressPercent}%`;
            }
            await this.loadRecentBuilds();
        } catch (error) { console.error('[Dashboard] Error loading dashboard stats:', error); }
    }

    async loadRecentBuilds() {
        try {
            const builds = await API.get('/api/build/history');
            const container = document.getElementById('user-recent-builds');
            if (!container) return;
            if (!Array.isArray(builds) || builds.length === 0) {
                container.innerHTML = '<p class="empty-message">Nenhum build realizado ainda.</p>';
                return;
            }
            container.innerHTML = builds.slice(0, 5).map(b => this.renderRecentBuildItem(b)).join('');
        } catch (error) { console.error('[Dashboard] Error loading recent builds:', error); }
    }

    async loadHistory() {
        try {
            const builds = await API.get('/api/build/history');
            const tbody = document.getElementById('history-table-body');
            if (!tbody) return;
            if (!Array.isArray(builds) || builds.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="empty-message">Nenhum build encontrado.</td></tr>';
                return;
            }
            tbody.innerHTML = builds.map(b => this.renderHistoryRow(b)).join('');
        } catch (error) { console.error('[Dashboard] Error loading history:', error); }
    }

    getStatusLabel(status) {
        const labels = { pending: 'Pendente', building: 'Compilando', completed: 'Concluído', failed: 'Falhou' };
        return labels[status] || status;
    }

    renderRecentBuildItem(build) {
        const safeName = Utils.escapeHtml(build.buildName || `Build #${build.id}`);
        const safeStatus = Utils.escapeHtml(build.status || 'pending');
        const safeDate = Utils.formatDate(build.createdAt);
        const statusLabel = Utils.escapeHtml(this.getStatusLabel(build.status));
        return `
            <div class="build-item">
                <div class="build-status ${safeStatus}"></div>
                <div class="build-details">
                    <span class="build-name">${safeName}</span>
                    <span class="build-date">${safeDate}</span>
                </div>
                <span class="status-badge ${safeStatus}">${statusLabel}</span>
            </div>`;
    }

    renderHistoryRow(build) {
        const safeId = Utils.escapeHtml(build.id);
        const safeName = Utils.escapeHtml(build.buildName || '-');
        const safeStatus = Utils.escapeHtml(build.status || 'pending');
        const safeSize = Utils.formatFileSize(build.fileSize);
        const safeDownloads = Utils.escapeHtml(build.downloadCount || 0);
        const safeDate = Utils.formatDate(build.createdAt);
        const statusLabel = Utils.escapeHtml(this.getStatusLabel(build.status));
        const actionHtml = build.status === 'completed'
            ? `<a href="/api/build/download/${safeId}?token=${encodeURIComponent(API.token)}" class="btn-table-action" download>Baixar ZIP</a>`
            : `<span style="color:var(--text-muted);font-size:0.75rem;">-</span>`;
        return `
            <tr>
                <td>#${safeId}</td>
                <td>${safeName}</td>
                <td><span class="status-badge ${safeStatus}">${statusLabel}</span></td>
                <td>${safeSize}</td>
                <td>${safeDownloads}</td>
                <td>${safeDate}</td>
                <td>${actionHtml}</td>
            </tr>`;
    }
}

const Dashboard = new DashboardService();

class BuildService {
    init() {
        this.setupSettingsForm();
        this.setupFileUploads();
        this.setupBuild();
        this.loadSettings();
        this.loadBuildLimit();
    }

    async loadSettings() {
        if (!API.token) return;
        try {
            const settings = await API.get('/api/build/settings');
            if (settings) {
                const passInput = document.getElementById('correctPassword');
                const msgInput = document.getElementById('customMessage');
                if (passInput) passInput.value = settings.CorrectPassword || '';
                if (msgInput) msgInput.value = settings.CustomMessage || '';
            }
        } catch (error) { console.error('[Build] Error loading settings:', error); }
    }

    async loadBuildLimit() {
        if (!API.token) return;
        try {
            const data = await API.get('/api/build/build-limit');
            if (data) {
                const remCount = document.getElementById('remaining-count');
                if (remCount) remCount.textContent = data.remaining;
                const buildBtn = document.getElementById('startBuild');
                const warning = document.getElementById('build-limit-warning');

                if (!data.canBuild && Auth.currentUser?.role !== 'admin') {
                    if (buildBtn) buildBtn.disabled = true;
                    if (warning) {
                        warning.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg><span>Você atingiu seu limite de builds mensal.</span>`;
                        warning.style.background = 'rgba(239, 68, 68, 0.1)'; warning.style.color = 'var(--danger)';
                    }
                } else if (warning) { warning.innerHTML = ''; if (buildBtn) buildBtn.disabled = false; }
            }
        } catch (error) { console.error('[Build] Error loading build limit:', error); }
    }

    setupSettingsForm() {
        const settingsForm = document.getElementById('settings-form');
        const saveBtn = document.getElementById('saveSettings');
        if (!settingsForm) return;

        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (saveBtn) saveBtn.disabled = true;
            try {
                const CorrectPassword = document.getElementById('correctPassword')?.value || '';
                const CustomMessage = document.getElementById('customMessage')?.value || '';
                await API.post('/api/build/settings', { CorrectPassword, CustomMessage });
                Utils.showToast('Configurações salvas com sucesso!', 'success');
            } catch (error) { Utils.showToast(error.message, 'error'); }
            finally { if (saveBtn) saveBtn.disabled = false; }
        });
    }

    setupFileUploads() {
        const uploadBtn = document.getElementById('uploadAssets');
        ['file-png', 'file-ico', 'file-gif'].forEach(id => {
            const input = document.getElementById(id);
            if (!input) return;
            const zone = input.closest('.drop-zone');
            input.addEventListener('change', (e) => {
                if (e.target.files.length > 0 && zone) {
                    zone.classList.add('selected');
                    const p = zone.querySelector('p');
                    if (p) p.textContent = Utils.escapeHtml(e.target.files[0].name);
                }
            });
        });

        if (uploadBtn) {
            uploadBtn.addEventListener('click', async () => {
                const pngFile = document.getElementById('file-png')?.files[0];
                const icoFile = document.getElementById('file-ico')?.files[0];
                const gifFile = document.getElementById('file-gif')?.files[0];

                if (!pngFile && !icoFile && !gifFile) return Utils.showToast('Selecione ao menos um arquivo para enviar.', 'error');
                uploadBtn.disabled = true;
                const formData = new FormData();
                if (pngFile) formData.append('png', pngFile);
                if (icoFile) formData.append('ico', icoFile);
                if (gifFile) formData.append('gif', gifFile);

                try {
                    const result = await API.upload('/api/build/upload', formData);
                    Utils.showToast(result.message || 'Arquivos enviados com sucesso!', 'success');
                } catch (error) { Utils.showToast(error.message, 'error'); }
                finally { uploadBtn.disabled = false; }
            });
        }
    }

    setupBuild() {
        const buildBtn = document.getElementById('startBuild');
        if (!buildBtn) return;
        buildBtn.addEventListener('click', async () => {
            const buildNameInput = document.getElementById('buildName');
            const buildName = (buildNameInput?.value || '').trim();
            if (!buildName) return Utils.showToast('Informe um nome para a sua build.', 'error');
            buildBtn.disabled = true;
            Utils.showToast('Gerando compilado seguro... Por favor aguarde.', 'info');
            try {
                const CorrectPassword = document.getElementById('correctPassword')?.value || '';
                const CustomMessage = document.getElementById('customMessage')?.value || '';
                const result = await API.post('/api/build/generate', { buildName, CorrectPassword, CustomMessage });
                Utils.showToast('🎉 Build gerado com sucesso!', 'success');
                if (buildNameInput) buildNameInput.value = '';
                this.loadBuildLimit();
                Dashboard.loadRecentBuilds();
                Dashboard.loadHistory();
                if (result.downloadUrl) window.location.href = result.downloadUrl;
            } catch (error) { Utils.showToast(error.message, 'error'); }
            finally { buildBtn.disabled = false; }
        });
    }
}

const Build = new BuildService();

class AdminService {
    init() {
        this.setupTabs();
        this.setupModal();
        this.setupUserForm();
    }

    isAdmin() { return Auth.currentUser && Auth.currentUser.role === 'admin'; }

    setupTabs() {
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                if (!this.isAdmin()) return Utils.showToast('Acesso negado: Requer privilégios de administrador.', 'error');
                const target = tab.dataset.adminTab;
                document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.toggle('active', c.id === `${target}-tab`));
                switch (target) {
                    case 'users': this.loadUsers(); break;
                    case 'builds': this.loadBuilds(); break;
                    case 'activity': this.loadActivity(); break;
                }
            });
        });
    }

    setupModal() {
        const addBtn = document.getElementById('add-user-btn');
        if (addBtn) addBtn.addEventListener('click', () => { if (this.isAdmin()) this.openModal(); });
    }

    openModal(user = null) {
        if (!this.isAdmin()) return Utils.showToast('Acesso negado: Requer privilégios de administrador.', 'error');
        const modalRoot = document.getElementById('modal-root');
        if (modalRoot) {
            modalRoot.innerHTML = AdminComponent.renderUserModal();
        }
        const modal = document.getElementById('user-modal');
        if (!modal) return;
        const title = document.getElementById('modal-title');
        const form = document.getElementById('user-form');
        if (form) form.reset();

        if (user) {
            if (title) title.textContent = 'Editar Cliente';
            document.getElementById('edit-user-id').value = user.id;
            document.getElementById('modal-user-name').value = user.name || '';
            document.getElementById('modal-user-email').value = user.email || '';
            document.getElementById('modal-user-password').value = '';
            document.getElementById('modal-user-role').value = user.role || 'user';
            document.getElementById('modal-user-limit').value = user.monthlyBuildLimit ?? 5;
            document.getElementById('modal-user-active').value = (user.isActive !== false).toString();
        } else {
            if (title) title.textContent = 'Novo Cliente';
            document.getElementById('edit-user-id').value = '';
        }
        this.setupUserForm();
    }

    closeModal() {
        const modalRoot = document.getElementById('modal-root');
        if (modalRoot) modalRoot.innerHTML = '';
    }

    setupUserForm() {
        const form = document.getElementById('user-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!this.isAdmin()) return Utils.showToast('Acesso negado: Apenas administradores podem gerenciar usuários.', 'error');
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            const editId = document.getElementById('edit-user-id')?.value;
            const name = (document.getElementById('modal-user-name')?.value || '').trim();
            const email = (document.getElementById('modal-user-email')?.value || '').trim();
            const password = document.getElementById('modal-user-password')?.value || '';
            const role = document.getElementById('modal-user-role')?.value || 'user';
            const monthlyBuildLimit = parseInt(document.getElementById('modal-user-limit')?.value || '5', 10);
            const isActive = document.getElementById('modal-user-active')?.value === 'true';

            try {
                if (editId) {
                    const updateData = { name, email, role, monthlyBuildLimit, isActive };
                    if (password) updateData.password = password;
                    await API.put(`/api/admin/users/${editId}`, updateData);
                    Utils.showToast('Cliente atualizado com sucesso!', 'success');
                } else {
                    if (!password) throw new Error('Senha é obrigatória para cadastrar novo usuário.');
                    await API.post('/api/admin/users', { name, email, password, role, monthlyBuildLimit, isActive });
                    Utils.showToast('Novo cliente cadastrado com sucesso!', 'success');
                }
                this.closeModal();
                this.loadUsers();
                this.loadDashboard();
            } catch (error) { Utils.showToast(error.message, 'error'); }
            finally { if (submitBtn) submitBtn.disabled = false; }
        });
    }

    async loadDashboard() {
        if (!this.isAdmin()) return;
        try {
            const stats = await API.get('/api/admin/stats');
            const totalUsersEl = document.getElementById('admin-total-users');
            const totalBuildsEl = document.getElementById('admin-total-builds');
            const activeUsersEl = document.getElementById('admin-active-users');

            if (totalUsersEl) totalUsersEl.textContent = stats.totalUsers ?? 0;
            if (totalBuildsEl) totalBuildsEl.textContent = stats.totalBuilds ?? 0;
            if (activeUsersEl) activeUsersEl.textContent = stats.activeUsers ?? 0;
            this.loadUsers();
        } catch (error) { console.error('[Admin] Error loading stats:', error); }
    }

    async loadUsers() {
        if (!this.isAdmin()) return;
        try {
            const users = await API.get('/api/admin/users');
            const tbody = document.getElementById('users-table-body');
            if (!tbody) return;
            if (!Array.isArray(users) || users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="empty-message">Nenhum cliente cadastrado.</td></tr>';
                return;
            }
            tbody.innerHTML = users.map(u => this.renderUserRow(u)).join('');
        } catch (error) { console.error('[Admin] Error loading users:', error); }
    }

    editUserFromData(user) {
        if (!this.isAdmin()) return;
        this.openModal(user);
    }

    async deleteUser(userId) {
        if (!this.isAdmin()) return;
        if (!confirm('Tem certeza que deseja excluir este cliente? Essa ação é irreversível.')) return;
        try {
            await API.delete(`/api/admin/users/${userId}`);
            Utils.showToast('Cliente excluído com sucesso.', 'success');
            this.loadUsers();
            this.loadDashboard();
        } catch (error) { Utils.showToast(error.message, 'error'); }
    }

    async loadBuilds() {
        if (!this.isAdmin()) return;
        try {
            const builds = await API.get('/api/admin/builds');
            const tbody = document.getElementById('admin-builds-table-body');
            if (!tbody) return;
            if (!Array.isArray(builds) || builds.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="empty-message">Nenhum build no histórico do sistema.</td></tr>';
                return;
            }
            tbody.innerHTML = builds.map(b => this.renderBuildRow(b)).join('');
        } catch (error) { console.error('[Admin] Error loading builds:', error); }
    }

    async loadActivity() {
        if (!this.isAdmin()) return;
        try {
            const logs = await API.get('/api/admin/activity');
            const container = document.getElementById('activity-list');
            if (!container) return;
            if (!Array.isArray(logs) || logs.length === 0) {
                container.innerHTML = '<p class="empty-message">Nenhuma atividade registrada.</p>';
                return;
            }
            container.innerHTML = logs.map(l => this.renderActivityRow(l)).join('');
        } catch (error) { console.error('[Admin] Error loading activity logs:', error); }
    }

    renderUserRow(u) {
        const safeId = Utils.escapeHtml(u.id);
        const safeName = Utils.escapeHtml(u.name);
        const safeEmail = Utils.escapeHtml(u.email);
        const safeRole = Utils.escapeHtml(u.role === 'admin' ? 'Administrador' : 'Membro');
        const safeLimit = Utils.escapeHtml(u.monthlyBuildLimit ?? 5);
        const isActive = u.isActive !== false;
        const statusBadge = isActive ? '<span class="status-badge completed">Ativo</span>' : '<span class="status-badge failed">Desativado</span>';
        const safeUserJson = Utils.escapeHtml(JSON.stringify(u));
        return `
            <tr>
                <td>#${safeId}</td>
                <td><strong>${safeName}</strong></td>
                <td>${safeEmail}</td>
                <td>${safeRole}</td>
                <td>${safeLimit} builds/mês</td>
                <td>${statusBadge}</td>
                <td>
                    <button type="button" class="btn-table-action" onclick='Admin.editUserFromData(${safeUserJson})'>Editar</button>
                    <button type="button" class="btn-table-action danger" onclick="Admin.deleteUser(${safeId})">Excluir</button>
                </td>
            </tr>`;
    }

    renderBuildRow(b) {
        const safeId = Utils.escapeHtml(b.id);
        const safeUser = Utils.escapeHtml(b.User?.name || b.User?.email || `User #${b.userId}`);
        const safeName = Utils.escapeHtml(b.buildName || '-');
        const safeStatus = Utils.escapeHtml(b.status);
        const safeSize = Utils.formatFileSize(b.fileSize);
        const safeDate = Utils.formatDate(b.createdAt);
        const statusLabel = Utils.escapeHtml(Dashboard.getStatusLabel(b.status));
        return `
            <tr>
                <td>#${safeId}</td>
                <td><strong>${safeUser}</strong></td>
                <td>${safeName}</td>
                <td><span class="status-badge ${safeStatus}">${statusLabel}</span></td>
                <td>${safeSize}</td>
                <td>${safeDate}</td>
                <td>${b.status === 'completed' ? `<a href="/api/build/download/${safeId}?token=${encodeURIComponent(API.token)}" class="btn-table-action" download>Baixar</a>` : '-'}</td>
            </tr>`;
    }

    renderActivityRow(l) {
        const safeAction = Utils.escapeHtml(l.action);
        const safeDesc = Utils.escapeHtml(l.description);
        const safeUser = Utils.escapeHtml(l.User?.name || l.User?.email || 'Sistema');
        const safeIp = Utils.escapeHtml(l.ipAddress || '-');
        const safeDate = Utils.formatDate(l.createdAt);
        return `
            <div class="activity-item" style="padding:12px 16px;border-bottom:1px solid var(--glass-border);display:flex;align-items:center;justify-content:space-between;gap:12px;">
                <div>
                    <span class="status-badge info" style="margin-right:8px;">${safeAction}</span>
                    <strong>${safeUser}</strong>: ${safeDesc}
                </div>
                <div style="text-align:right;font-size:0.75rem;color:var(--text-muted);">
                    <div>${safeDate}</div>
                    <div>IP: ${safeIp}</div>
                </div>
            </div>`;
    }
}

const Admin = new AdminService();

/* ============================================
   5. SPA CONTROLLER - LAZY / ON-DEMAND VIEW RENDERER
   ============================================ */
class App {
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

const windowApp = new App();
window.App = windowApp;

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        windowApp.closeAuthModal();
        if (typeof Admin !== 'undefined' && typeof Admin.closeModal === 'function') {
            Admin.closeModal();
        }
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => windowApp.init());
} else {
    windowApp.init();
}
