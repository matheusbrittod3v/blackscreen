document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('saveSettings');
    const uploadBtn = document.getElementById('uploadAssets');
    const buildBtn = document.getElementById('startBuild');
    const passwordInput = document.getElementById('correctPassword');
    const messageInput = document.getElementById('customMessage');
    const buildStatus = document.getElementById('buildStatus');
    const statusText = document.getElementById('statusText');
    const progressFill = document.getElementById('progressFill');
    const downloadArea = document.getElementById('downloadArea');
    const toast = document.getElementById('toast');

    // Load initial settings
    fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
            passwordInput.value = data.CorrectPassword || '';
            messageInput.value = data.CustomMessage || '';
        })
        .catch(err => showToast('Erro ao carregar configurações'));

    // Save Settings
    saveBtn.addEventListener('click', async () => {
        saveBtn.disabled = true;
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    CorrectPassword: passwordInput.value,
                    CustomMessage: messageInput.value
                })
            });
            const data = await res.json();
            showToast(data.message || 'Salvo com sucesso!');
        } catch (err) {
            showToast('Erro ao salvar');
        } finally {
            saveBtn.disabled = false;
        }
    });

    // Upload Files
    uploadBtn.addEventListener('click', async () => {
        const formData = new FormData();
        const png = document.getElementById('file-png').files[0];
        const ico = document.getElementById('file-ico').files[0];
        const gif = document.getElementById('file-gif').files[0];

        if (!png && !ico && !gif) {
            return showToast('Selecione pelo menos um arquivo');
        }

        if (png) formData.append('logo_png', png);
        if (ico) formData.append('logo_ico', ico);
        if (gif) formData.append('logo_gif', gif);

        uploadBtn.disabled = true;
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            showToast(data.message);
        } catch (err) {
            showToast('Erro no upload');
        } finally {
            uploadBtn.disabled = false;
        }
    });

    // Start Build
    buildBtn.addEventListener('click', async () => {
        buildBtn.disabled = true;
        buildStatus.classList.remove('hidden');
        downloadArea.classList.add('hidden');
        progressFill.style.width = '10%';
        statusText.innerText = 'Iniciando build...';

        try {
            // Fake progress for UI feedback
            const timer = setInterval(() => {
                const currentWidth = parseInt(progressFill.style.width);
                if (currentWidth < 90) {
                    progressFill.style.width = (currentWidth + 10) + '%';
                }
            }, 3000);

            const res = await fetch('/api/build', { method: 'POST' });
            const data = await res.json();

            clearInterval(timer);
            progressFill.style.width = '100%';

            if (res.ok) {
                statusText.innerText = 'Build concluído!';
                downloadArea.classList.remove('hidden');
                document.getElementById('downloadBtn').href = data.downloadUrl;
            } else {
                statusText.innerText = 'Erro: ' + (data.error || 'Falha no build');
                progressFill.style.backgroundColor = '#f43f5e';
            }
        } catch (err) {
            statusText.innerText = 'Erro de conexão com o servidor';
        } finally {
            buildBtn.disabled = false;
        }
    });

    // File Input Visual Feedback
    ['file-png', 'file-ico', 'file-gif'].forEach(id => {
        const input = document.getElementById(id);
        const zone = input.parentElement;
        input.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                zone.style.borderColor = 'var(--success)';
                zone.querySelector('p').innerText = e.target.files[0].name;
            }
        });
    });

    function showToast(msg) {
        toast.innerText = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
});
