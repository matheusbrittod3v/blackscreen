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
            } catch (error) {
                Utils.showToast(error.message, 'error');
            } finally {
                if (saveBtn) saveBtn.disabled = false;
            }
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
                } catch (error) {
                    Utils.showToast(error.message, 'error');
                } finally {
                    uploadBtn.disabled = false;
                }
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
            } catch (error) {
                Utils.showToast(error.message, 'error');
            } finally {
                buildBtn.disabled = false;
            }
        });
    }
}

// Global instance
const Build = new BuildService();
