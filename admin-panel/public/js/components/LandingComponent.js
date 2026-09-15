/**
 * LandingComponent Class - Renders Landing Page HTML Template
 */
class LandingComponent {
    static render() {
        return `
        <div id="landing-view" class="view" style="display:none;">
            <div class="landing-container">
                <!-- Navigation -->
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

                <!-- Hero Section -->
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

                    <!-- Trust Badges -->
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

                    <!-- Mockup Card: Client Blackout vs Unlocker Virtual Desktop -->
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

                <!-- Features Section -->
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

                <!-- How It Works Section -->
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

                <!-- CTA Banner -->
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

                <!-- Footer -->
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
