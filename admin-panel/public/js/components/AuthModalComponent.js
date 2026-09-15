/**
 * AuthModalComponent - Modular View Template for Auth Modal (Login/Register)
 */
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
