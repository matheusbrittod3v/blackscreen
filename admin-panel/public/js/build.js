// Build Module
const Build = {
    init() {
        this.setupSettingsForm();
        this.setupFileUploads();
        this.setupBuild();
        this.loadSettings();
        this.loadBuildLimit();
    },

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
            console.error('Error loading settings:', error);
        }
    },

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
                        warning.innerHTML = `
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <span>Você atingiu seu limite de builds mensal.</span>
                        `;
                        warning.style.background = 'rgba(239, 68, 68, 0.1)';
                        warning.style.color = 'var(--danger)';
                    }
                }
            }
        } catch (error) {
            console.error('Error loading build limit:', error);
        }
    },

    setupSettingsForm() {
        const settingsForm = document.getElementById('settings-form');
        const saveBtn = document.getElementById('saveSettings');
        if (!settingsForm) return;

        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (saveBtn) saveBtn.classList.add('loading');

            try {
                const CorrectPassword = document.getElementById('correctPassword')?.value || '';
                const CustomMessage = document.getElementById('customMessage')?.value || '';

                await API.post('/api/build/settings', { CorrectPassword, CustomMessage });
                showToast('Configurações salvas com sucesso!', 'success');
            } catch (error) {
                showToast(error.message, 'error');
            } finally {
                if (saveBtn) saveBtn.classList.remove('loading');
            }
        });
    },

    setupFileUploads() {
        const uploadBtn = document.getElementById('uploadAssets');

        // File input visual feedback
        ['file-png', 'file-ico', 'file-gif'].forEach(id => {
            const input = document.getElementById(id);
            if (!input) return;
            const zone = input.closest('.drop-zone');

            input.addEventListener('change', (e) => {
                if (e.target.files.length > 0 && zone) {
                    zone.classList.add('selected');
                    const p = zone.querySelector('p');
                    if (p) p.textContent = e.target.files[0].name;
                }
            });
        });

        if (uploadBtn) {
            uploadBtn.addEventListener('click', async () => {
                const formData = new FormData();
                const png = document.getElementById('file-png')?.files[0];
                const ico = document.getElementById('file-ico')?.files[0];
                const gif = document.getElementById('file-gif')?.files[0];

                if (!png && !ico && !gif) {
                    return showToast('Selecione pelo menos um arquivo', 'error');
                }

                if (png) formData.append('logo_png', png);
                if (ico) formData.append('logo_ico', ico);
                if (gif) formData.append('logo_gif', gif);

                uploadBtn.disabled = true;

                try {
                    await API.upload('/api/build/upload', formData);
                    showToast('Arquivos enviados com sucesso!', 'success');
                } catch (error) {
                    showToast('Erro no upload', 'error');
                } finally {
                    uploadBtn.disabled = false;
                }
            });
        }
    },

    setupBuild() {
        const buildBtn = document.getElementById('startBuild');
        const buildStatus = document.getElementById('buildStatus');
        const statusText = document.getElementById('statusText');
        const progressFill = document.getElementById('progressFill');
        const downloadArea = document.getElementById('downloadArea');
        if (!buildBtn) return;

        buildBtn.addEventListener('click', async () => {
            buildBtn.disabled = true;
            if (buildStatus) buildStatus.classList.remove('hidden');
            if (downloadArea) downloadArea.classList.add('hidden');
            if (progressFill) progressFill.style.width = '10%';
            if (statusText) statusText.textContent = 'Iniciando build...';

            try {
                const timer = setInterval(() => {
                    if (progressFill) {
                        const currentWidth = parseInt(progressFill.style.width);
                        if (currentWidth < 95) {
                            const increment = Math.max(1, Math.floor((100 - currentWidth) / 10));
                            progressFill.style.width = (currentWidth + increment) + '%';
                        }
                    }
                }, 500);

                const data = await API.post('/api/build/build', {});

                clearInterval(timer);
                if (progressFill) progressFill.style.width = '100%';
                if (statusText) statusText.textContent = 'Build concluído!';

                if (downloadArea) downloadArea.classList.remove('hidden');
                const downloadUrl = `${data.downloadUrl}?token=${API.token}`;
                const dlBtn = document.getElementById('downloadBtn');
                if (dlBtn) dlBtn.href = downloadUrl;

                showToast('Build concluído com sucesso!', 'success');
                this.loadBuildLimit();
                Dashboard.loadUserDashboard();
            } catch (error) {
                if (statusText) statusText.textContent = 'Erro: ' + error.message;
                if (progressFill) progressFill.style.background = 'var(--danger)';
                showToast(error.message, 'error');
            } finally {
                buildBtn.disabled = false;
            }
        });
    }
};
