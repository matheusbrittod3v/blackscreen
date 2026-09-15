const express = require('express');
const multer = require('multer');
const archiver = require('archiver');
const fs = require('fs-extra');
const path = require('path');
const pngToIco = require('png-to-ico');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const buildRepository = require('../infrastructure/repositories/BuildRepository');
const userSettingsRepository = require('../infrastructure/repositories/UserSettingsRepository');
const activityLogRepository = require('../infrastructure/repositories/ActivityLogRepository');
const buildQueue = require('../infrastructure/jobs/BuildQueue');

const projectRoot = path.join(__dirname, '..', '..', '..');
const globalUtilPath = path.join(projectRoot, 'util');
const storageBase = path.join(projectRoot, 'storage', 'users');

// Apply auth middleware to all build routes
router.use(authMiddleware);

// Helper to get and initialize user storage directories
async function ensureUserStorage(userId) {
    const userDir = path.join(storageBase, String(userId));
    const userUtil = path.join(userDir, 'util');
    const userBuilds = path.join(userDir, 'builds');

    await fs.ensureDir(userUtil);
    await fs.ensureDir(userBuilds);

    // If user has no default logos yet, copy from global util
    const defaults = ['logo.png', 'logo.ico', 'logo.gif'];
    for (const file of defaults) {
        const userFilePath = path.join(userUtil, file);
        const globalFilePath = path.join(globalUtilPath, file);
        if (!(await fs.pathExists(userFilePath)) && (await fs.pathExists(globalFilePath))) {
            await fs.copy(globalFilePath, userFilePath);
        }
    }

    // Auto-generate logo.ico from logo.png if missing
    const userIcoPath = path.join(userUtil, 'logo.ico');
    const userPngPath = path.join(userUtil, 'logo.png');
    if (!(await fs.pathExists(userIcoPath)) && (await fs.pathExists(userPngPath))) {
        try {
            const buf = await pngToIco(userPngPath);
            await fs.writeFile(userIcoPath, buf);
            console.log(`[ensureUserStorage] Auto-generated logo.ico from logo.png for user #${userId}`);
        } catch (e) {
            console.error(`[ensureUserStorage] Failed to auto-generate ICO for user #${userId}:`, e.message);
        }
    }

    return { userDir, userUtil, userBuilds };
}

// Multer storage isolated per user
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        try {
            const { userUtil } = await ensureUserStorage(req.user.id);
            cb(null, userUtil);
        } catch (err) {
            cb(err);
        }
    },
    filename: function (req, file, cb) {
        if (file.fieldname === 'logo_png') cb(null, 'logo.png');
        else if (file.fieldname === 'logo_ico') cb(null, 'logo.ico');
        else if (file.fieldname === 'logo_gif') cb(null, 'logo.gif');
        else cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get current user's isolated settings
router.get('/settings', async (req, res) => {
    try {
        const settings = await userSettingsRepository.findByUserId(req.user.id);
        const { userUtil } = await ensureUserStorage(req.user.id);
        const userSettingsFile = path.join(userUtil, 'settings.json');

        // Fallback or read from file if exists
        let fileSettings = {};
        if (await fs.pathExists(userSettingsFile)) {
            try {
                fileSettings = await fs.readJson(userSettingsFile);
            } catch (e) { }
        }

        res.json({
            CorrectPassword: settings.correctPassword || fileSettings.CorrectPassword || '',
            CustomMessage: settings.customMessage || fileSettings.CustomMessage || '',
            logoPng: settings.logoPng,
            logoIco: settings.logoIco,
            logoGif: settings.logoGif,
            userId: req.user.id
        });
    } catch (err) {
        console.error('Error loading user settings:', err);
        res.status(500).json({ error: 'Falha ao ler configurações do usuário' });
    }
});

// Save current user's isolated settings
router.post('/settings', async (req, res) => {
    try {
        const { CorrectPassword, CustomMessage } = req.body;
        const { userUtil } = await ensureUserStorage(req.user.id);

        // 1. Save in database
        await userSettingsRepository.upsert(req.user.id, {
            correctPassword: CorrectPassword || '',
            customMessage: CustomMessage || ''
        });

        // 2. Save in user's isolated storage
        const userSettingsFile = path.join(userUtil, 'settings.json');
        await fs.writeJson(userSettingsFile, { CorrectPassword, CustomMessage }, { spaces: 2 });

        res.json({ message: 'Configurações salvas com sucesso para sua conta!' });
    } catch (err) {
        console.error('Error saving user settings:', err);
        res.status(500).json({ error: 'Falha ao salvar configurações.' });
    }
});

// Upload images isolated for current user
router.post('/upload', upload.fields([
    { name: 'logo_png', maxCount: 1 },
    { name: 'logo_ico', maxCount: 1 },
    { name: 'logo_gif', maxCount: 1 }
]), async (req, res) => {
    try {
        const updates = {};
        if (req.files['logo_png']) updates.logoPng = 'logo.png';
        if (req.files['logo_ico']) updates.logoIco = 'logo.ico';
        if (req.files['logo_gif']) updates.logoGif = 'logo.gif';

        const { userUtil } = await ensureUserStorage(req.user.id);

        // If user uploaded a new PNG but did not upload an ICO, automatically generate logo.ico from the PNG!
        if (req.files['logo_png'] && !req.files['logo_ico']) {
            try {
                const userPngPath = path.join(userUtil, 'logo.png');
                const userIcoPath = path.join(userUtil, 'logo.ico');
                const buf = await pngToIco(userPngPath);
                await fs.writeFile(userIcoPath, buf);
                updates.logoIco = 'logo.ico';
            } catch (convErr) {
                console.error('Upload auto png-to-ico conversion failed:', convErr);
            }
        }

        await userSettingsRepository.upsert(req.user.id, updates);

        res.json({ message: 'Arquivos personalizados enviados com sucesso para sua conta!' });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Erro ao processar arquivos' });
    }
});

// Explicit PNG to ICO Conversion Route
router.post('/convert-png-to-ico', async (req, res) => {
    try {
        const { userUtil } = await ensureUserStorage(req.user.id);
        const userPngPath = path.join(userUtil, 'logo.png');
        const userIcoPath = path.join(userUtil, 'logo.ico');

        if (!(await fs.pathExists(userPngPath))) {
            return res.status(404).json({ error: 'Nenhum arquivo logo.png encontrado em sua conta.' });
        }

        const buf = await pngToIco(userPngPath);
        await fs.writeFile(userIcoPath, buf);
        await userSettingsRepository.upsert(req.user.id, { logoIco: 'logo.ico' });

        res.json({ message: '✨ Ícone (.ico) gerado do seu PNG com sucesso!' });
    } catch (err) {
        console.error('PNG to ICO conversion route error:', err);
        res.status(500).json({ error: 'Erro ao converter PNG para ICO: ' + err.message });
    }
});

// Check build limit for current user
router.get('/build-limit', async (req, res) => {
    try {
        const buildsThisMonth = await buildRepository.countByUserThisMonth(req.user.id);
        const limit = req.user.monthlyBuildLimit;
        const remaining = Math.max(0, limit - buildsThisMonth);

        res.json({
            limit,
            used: buildsThisMonth,
            remaining,
            canBuild: req.user.isAdmin() || remaining > 0
        });
    } catch (error) {
        console.error('Build limit error:', error);
        res.status(500).json({ error: 'Erro ao verificar limite' });
    }
});

// Event-driven async build queue trigger handler
async function handleBuildEnqueue(req, res) {
    try {
        // Check build limit
        const buildsThisMonth = await buildRepository.countByUserThisMonth(req.user.id);

        if (!req.user.isAdmin() && buildsThisMonth >= req.user.monthlyBuildLimit) {
            return res.status(403).json({
                error: 'Limite de builds mensal atingido',
                limit: req.user.monthlyBuildLimit,
                used: buildsThisMonth
            });
        }

        const buildName = (req.body.buildName || '').trim() || `Build-${req.user.id}-${Date.now()}`;

        // Load user settings or request body overrides
        const userSettings = await userSettingsRepository.findByUserId(req.user.id);
        const { userUtil, userBuilds } = await ensureUserStorage(req.user.id);

        const passwordToUse = req.body.CorrectPassword !== undefined ? req.body.CorrectPassword : (userSettings.correctPassword || '');
        const messageToUse = req.body.CustomMessage !== undefined ? req.body.CustomMessage : (userSettings.customMessage || '');

        // 1. Create initial build record with status 'queued'
        const build = await buildRepository.create({
            userId: req.user.id,
            buildName,
            passwordUsed: passwordToUse,
            customMessage: messageToUse,
            status: 'queued'
        });

        // 2. Enqueue job into Event-driven BuildQueue
        const job = buildQueue.enqueue({
            buildId: build.id,
            userId: req.user.id,
            userEmail: req.user.email,
            buildName,
            passwordToUse,
            messageToUse,
            userUtil,
            userBuilds,
            ip: req.ip
        });

        // 3. Log activity
        await activityLogRepository.create({
            userId: req.user.id,
            action: 'BUILD_QUEUED',
            description: `Build #${build.id} (${buildName}) adicionado à fila de compilação`,
            ipAddress: req.ip,
            metadata: { buildId: build.id }
        });

        const queuePosition = buildQueue.getPosition(build.id);

        // 4. Return instant non-blocking response with job info
        res.status(202).json({
            message: 'Build adicionado à fila de compilação com sucesso!',
            buildId: build.id,
            status: 'queued',
            queuePosition
        });
    } catch (err) {
        console.error('Build queue trigger error:', err);
        res.status(500).json({ error: 'Falha ao adicionar build à fila.' });
    }
}

// POST endpoints for initiating a build job
router.post('/generate', handleBuildEnqueue);
router.post('/build', handleBuildEnqueue);

// Real-time job status query endpoint
router.get('/status/:buildId', async (req, res) => {
    try {
        const build = await buildRepository.findById(req.params.buildId);
        if (!build) {
            return res.status(404).json({ error: 'Build não encontrado.' });
        }

        // Strict isolation check
        if (!req.user.isAdmin() && build.userId !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado: este build pertence a outro usuário.' });
        }

        const queuePosition = buildQueue.getPosition(build.id);

        res.json({
            buildId: build.id,
            buildName: build.buildName,
            status: build.status,
            queuePosition,
            fileSize: build.fileSize,
            downloadCount: build.downloadCount,
            createdAt: build.createdAt,
            completedAt: build.completedAt,
            downloadUrl: build.status === 'completed' ? `/api/build/download/${build.id}?token=${encodeURIComponent(req.token || '')}` : null
        });
    } catch (error) {
        console.error('Error fetching build status:', error);
        res.status(500).json({ error: 'Erro ao consultar status do build' });
    }
});

// Download handler with strict user isolation
async function handleDownload(req, res, targetBuildId) {
    try {
        let build = null;

        if (targetBuildId) {
            build = await buildRepository.findById(targetBuildId);
        } else {
            // Find latest completed build for current user
            const userBuilds = await buildRepository.findByUserId(req.user.id, { status: 'completed', limit: 1 });
            build = userBuilds.length > 0 ? userBuilds[0] : null;
        }

        if (!build) {
            return res.status(404).json({ error: 'Nenhum build disponível para download.' });
        }

        // Strict isolation check: user can only download their own build unless admin
        if (!req.user.isAdmin() && build.userId !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado: este build pertence a outro usuário.' });
        }

        const userBuildZip = path.join(storageBase, String(build.userId), 'builds', `${build.id}.zip`);
        const fallbackGlobalZip = path.join(projectRoot, 'dist_output.zip');

        let fileToSend = null;
        if (await fs.pathExists(userBuildZip)) {
            fileToSend = userBuildZip;
        } else if (await fs.pathExists(fallbackGlobalZip)) {
            fileToSend = fallbackGlobalZip;
        }

        if (!fileToSend) {
            return res.status(404).json({ error: 'Arquivo do build não encontrado no servidor.' });
        }

        await buildRepository.incrementDownload(build.id);

        const downloadFileName = `${build.buildName || 'BlackTool'}.zip`;
        res.download(fileToSend, downloadFileName);
    } catch (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Erro ao baixar arquivo do build' });
    }
}

// Download by build ID (isolated)
router.get('/download/:buildId', async (req, res) => {
    await handleDownload(req, res, req.params.buildId);
});

// Download legacy or query based (?buildId=...)
router.get('/download', async (req, res) => {
    await handleDownload(req, res, req.query.buildId);
});

// User's isolated build history
router.get('/history', async (req, res) => {
    try {
        const builds = await buildRepository.findByUserId(req.user.id);
        res.json(builds);
    } catch (error) {
        console.error('Build history error:', error);
        res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
});

module.exports = router;
