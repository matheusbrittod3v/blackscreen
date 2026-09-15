/**
 * BuildService Class - Manages build configurations, asset uploads, and compilation trigger
 */
class BuildService {
    init() {
        this.setupSettingsForm();
        this.setupFileUploads();
        this.setupBuild();
        this.loadSettings();
        this.loadBuildLimit();

        // Connect real-time gRPC streaming channel
        if (typeof gRPC !== 'undefined') {
            gRPC.connectStream();
        }
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
        } catch (error) {
            console.error('[Build] Error loading settings:', error);
        }
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
                        warning.style.background = 'rgba(239, 68, 68, 0.1)';
                        warning.style.color = 'var(--danger)';
                    }
                } else if (warning) {
                    warning.innerHTML = '';
                    if (buildBtn) buildBtn.disabled = false;
                }
            }
        } catch (error) {
            console.error('[Build] Error loading build limit:', error);
        }
    }

    setupSettingsForm() {
        const passInput = document.getElementById('correctPassword');
        const msgInput = document.getElementById('customMessage');
        const statusEl = document.getElementById('settings-auto-save-status');

        if (!passInput && !msgInput) return;

        let saveTimeout = null;

        const autoSave = () => {
            if (statusEl) {
                statusEl.textContent = '⏳ Salvando...';
                statusEl.style.color = 'var(--text-muted)';
            }
            if (saveTimeout) clearTimeout(saveTimeout);

            saveTimeout = setTimeout(async () => {
                try {
                    const CorrectPassword = passInput?.value || '';
                    const CustomMessage = msgInput?.value || '';
                    await API.post('/api/build/settings', { CorrectPassword, CustomMessage });
                    if (statusEl) {
                        statusEl.textContent = '✨ Salvo automaticamente';
                        statusEl.style.color = 'var(--accent-green)';
                        setTimeout(() => {
                            if (statusEl) {
                                statusEl.textContent = '✨ Salvo automaticamente';
                                statusEl.style.color = 'var(--text-muted)';
                            }
                        }, 2000);
                    }
                } catch (error) {
                    console.error('Auto save error:', error);
                    if (statusEl) {
                        statusEl.textContent = '❌ Erro ao salvar';
                        statusEl.style.color = 'var(--danger)';
                    }
                }
            }, 600);
        };

        if (passInput) passInput.addEventListener('input', autoSave);
        if (msgInput) msgInput.addEventListener('input', autoSave);
    }

    setupFileUploads() {
        const convertBtn = document.getElementById('convertPngToIco');

        ['file-png', 'file-ico', 'file-gif'].forEach(id => {
            const input = document.getElementById(id);
            if (!input) return;
            const zone = input.closest('.drop-zone');
            input.addEventListener('change', async (e) => {
                if (e.target.files.length > 0 && zone) {
                    const file = e.target.files[0];
                    zone.classList.add('selected');
                    const p = zone.querySelector('p');
                    if (p) p.textContent = Utils.escapeHtml(file.name);

                    // Automatically upload file on selection!
                    const formData = new FormData();
                    if (id === 'file-png') formData.append('logo_png', file);
                    else if (id === 'file-ico') formData.append('logo_ico', file);
                    else if (id === 'file-gif') formData.append('logo_gif', file);

                    try {
                        const result = await API.upload('/api/build/upload', formData);
                        Utils.showToast(`✨ ${file.name} sincronizado automaticamente!`, 'success');
                    } catch (uploadErr) {
                        console.error('Auto upload error:', uploadErr);
                        Utils.showToast(`❌ Erro ao enviar ${file.name}: ${uploadErr.message}`, 'error');
                    }

                    // Enable convert button if PNG selected
                    if (id === 'file-png' && convertBtn) {
                        convertBtn.disabled = false;
                        convertBtn.style.opacity = '1';
                        convertBtn.style.cursor = 'pointer';
                        convertBtn.title = 'Converter seu logo.png em logo.ico';
                    }
                }
            });
        });

        if (convertBtn) {
            convertBtn.addEventListener('click', async () => {
                const pngFile = document.getElementById('file-png')?.files[0];
                if (pngFile) {
                    const formData = new FormData();
                    formData.append('logo_png', pngFile);
                    try {
                        await API.upload('/api/build/upload', formData);
                    } catch (e) {}
                }

                convertBtn.disabled = true;
                Utils.showToast('⚙️ Convertendo PNG para Ícone (.ico)... Aguarde.', 'info');
                try {
                    const result = await API.post('/api/build/convert-png-to-ico', {});
                    Utils.showToast(result.message || '✨ Ícone (.ico) gerado com sucesso!', 'success');
                    
                    if (result.downloadUrl) {
                        this.showConvertedIcoModal(result.downloadUrl);
                    }
                } catch (error) {
                    Utils.showToast(error.message, 'error');
                } finally {
                    convertBtn.disabled = false;
                }
            });
        }
    }

    showConvertedIcoModal(downloadUrl) {
        const modalRoot = document.getElementById('modal-root');
        if (!modalRoot) return;

        modalRoot.innerHTML = `
        <div id="converted-ico-modal" class="modal active" style="display:flex !important;">
            <div class="modal-overlay" onclick="Build.closeIcoModal()"></div>
            <div class="modal-container glass-card" style="max-width:440px;text-align:center;padding:28px 24px;position:relative;z-index:100001;">
                <div style="font-size:3rem;margin-bottom:12px;">✨💎</div>
                <h2 style="font-size:1.3rem;margin-bottom:8px;color:#fff;">Ícone (.ico) Gerado com Sucesso!</h2>
                <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:24px;line-height:1.5;">
                    Seu arquivo <strong>logo.png</strong> foi convertido para o formato executável do Windows (<strong>logo.ico</strong>). Clique abaixo para baixá-lo.
                </p>
                <div style="display:flex;gap:12px;justify-content:center;">
                    <button type="button" class="btn-secondary" onclick="Build.closeIcoModal()">Fechar</button>
                    <a href="${downloadUrl}" class="btn-primary" download="logo.ico" onclick="setTimeout(() => Build.closeIcoModal(), 1000)" style="text-decoration:none;display:inline-flex;align-items:center;gap:8px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Baixar Ícone (.ico)
                    </a>
                </div>
            </div>
        </div>
        `;
    }

    closeIcoModal() {
        const modalRoot = document.getElementById('modal-root');
        if (modalRoot) modalRoot.innerHTML = '';
    }

    downloadAsset(fileName) {
        if (!API.token) return Utils.showToast('Você precisa estar autenticado para baixar.', 'error');
        Utils.showToast(`📥 Baixando ${fileName}...`, 'info');
        window.location.href = `/api/build/assets/${encodeURIComponent(fileName)}?download=1&token=${encodeURIComponent(API.token)}`;
    }

    updateActiveBuildCard(payload) {
        const container = document.getElementById('active-build-container');
        const badge = document.getElementById('active-build-badge');
        const nameEl = document.getElementById('active-build-name');
        const idEl = document.getElementById('active-build-id');
        const infoEl = document.getElementById('active-build-info');
        const progressBar = document.getElementById('active-build-progress-bar');
        const downloadBtn = document.getElementById('active-build-download-btn');
        const startBtn = document.getElementById('startBuild');

        if (!container) return;
        container.style.display = 'block';

        if (payload.buildName) nameEl.textContent = payload.buildName;
        if (payload.buildId) idEl.textContent = payload.buildId;

        const statusLabels = {
            queued: 'Na Fila',
            building: 'Compilando',
            completed: 'Concluído',
            failed: 'Falhou'
        };

        const status = payload.status || 'queued';
        if (badge) {
            badge.className = `status-badge ${status}`;
            badge.textContent = statusLabels[status] || status;
        }

        if (status === 'queued') {
            const posText = payload.queuePosition ? ` (Posição na fila: #${payload.queuePosition})` : '';
            if (infoEl) infoEl.textContent = `⏳ Build adicionado à fila. Aguarde o processamento pelo worker...${posText}`;
            if (progressBar) progressBar.style.width = '25%';
            if (downloadBtn) downloadBtn.style.display = 'none';
            if (startBtn) startBtn.disabled = true;
        } else if (status === 'building') {
            if (infoEl) infoEl.textContent = '⚙️ Compilando executável em segundo plano via C#/.NET 9...';
            if (progressBar) progressBar.style.width = '65%';
            if (downloadBtn) downloadBtn.style.display = 'none';
            if (startBtn) startBtn.disabled = true;
        } else if (status === 'completed') {
            const sizeText = payload.fileSize ? ` (${Utils.formatFileSize(payload.fileSize)})` : '';
            if (infoEl) infoEl.textContent = `🎉 Executável compilado com sucesso! Clique abaixo para baixar.${sizeText}`;
            if (progressBar) progressBar.style.width = '100%';
            if (startBtn) startBtn.disabled = false;

            const downloadUrl = payload.downloadUrl || `/api/build/download/${payload.buildId}?token=${encodeURIComponent(API.token)}`;
            if (downloadBtn) {
                downloadBtn.href = downloadUrl;
                downloadBtn.style.display = 'inline-flex';
            }
        } else if (status === 'failed') {
            if (infoEl) infoEl.textContent = `❌ Falha na compilação: ${payload.error || 'Erro interno'}`;
            if (progressBar) {
                progressBar.style.width = '100%';
                progressBar.style.background = 'var(--danger)';
            }
            if (downloadBtn) downloadBtn.style.display = 'none';
            if (startBtn) startBtn.disabled = false;
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
            Utils.showToast('⏳ Adicionando build à fila de compilação...', 'info');

            try {
                // Auto sync selected files if any were chosen right before build
                const pngFile = document.getElementById('file-png')?.files[0];
                const icoFile = document.getElementById('file-ico')?.files[0];
                const gifFile = document.getElementById('file-gif')?.files[0];
                if (pngFile || icoFile || gifFile) {
                    const formData = new FormData();
                    if (pngFile) formData.append('logo_png', pngFile);
                    if (icoFile) formData.append('logo_ico', icoFile);
                    if (gifFile) formData.append('logo_gif', gifFile);
                    await API.upload('/api/build/upload', formData).catch(() => {});
                }

                const CorrectPassword = document.getElementById('correctPassword')?.value || '';
                const CustomMessage = document.getElementById('customMessage')?.value || '';
                const result = await API.post('/api/build/generate', { buildName, CorrectPassword, CustomMessage });
                
                if (buildNameInput) buildNameInput.value = '';
                this.loadBuildLimit();
                Dashboard.loadRecentBuilds();
                Dashboard.loadHistory();

                if (result.buildId) {
                    Utils.showToast(`🚀 Build #${result.buildId} adicionado à fila!`, 'info');
                    this.updateActiveBuildCard({
                        buildId: result.buildId,
                        buildName,
                        status: 'queued',
                        queuePosition: result.queuePosition
                    });
                    this.pollBuildStatus(result.buildId);
                } else {
                    Utils.showToast('Build enviado para compilação.', 'info');
                    buildBtn.disabled = false;
                }
            } catch (error) {
                Utils.showToast(error.message, 'error');
                buildBtn.disabled = false;
            }
        });
    }

    pollBuildStatus(buildId) {
        const buildBtn = document.getElementById('startBuild');
        let lastStateKey = '';

        const pollInterval = setInterval(async () => {
            try {
                const statusData = await API.get(`/api/build/status/${buildId}`);
                const { status, queuePosition, downloadUrl } = statusData;
                const currentStateKey = `${status}:${queuePosition}`;

                Dashboard.loadRecentBuilds();
                Dashboard.loadHistory();
                this.updateActiveBuildCard(statusData);

                if (currentStateKey !== lastStateKey) {
                    lastStateKey = currentStateKey;
                    if (status === 'queued') {
                        const posMsg = queuePosition ? ` (Posição: #${queuePosition})` : '';
                        Utils.showToast(`⏳ Build #${buildId} na fila...${posMsg}`, 'info');
                    } else if (status === 'building') {
                        Utils.showToast(`⚙️ Compilando Build #${buildId} em segundo plano...`, 'info');
                    }
                }

                if (status === 'completed') {
                    clearInterval(pollInterval);
                    if (buildBtn) buildBtn.disabled = false;
                    Utils.showToast(`🎉 Build #${buildId} concluído com sucesso!`, 'success');
                    this.loadBuildLimit();
                } else if (status === 'failed') {
                    clearInterval(pollInterval);
                    if (buildBtn) buildBtn.disabled = false;
                    Utils.showToast(`❌ Falha na compilação do Build #${buildId}. Verifique os logs.`, 'error');
                    this.loadBuildLimit();
                }
            } catch (err) {
                console.error('[BuildService] Status poll error:', err);
            }
        }, 2500);
    }
}

// Global instance
const Build = new BuildService();
