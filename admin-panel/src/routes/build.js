const express = require('express');
const multer = require('multer');
const archiver = require('archiver');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const buildRepository = require('../infrastructure/repositories/BuildRepository');
const userSettingsRepository = require('../infrastructure/repositories/UserSettingsRepository');
const activityLogRepository = require('../infrastructure/repositories/ActivityLogRepository');

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

// Simple mutex to prevent concurrent builds from conflicting on C# template modification
let isBuildInProgress = false;

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

        await userSettingsRepository.upsert(req.user.id, updates);

        res.json({ message: 'Arquivos personalizados enviados com sucesso para sua conta!' });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Erro ao processar arquivos' });
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

// Build process (Isolated workspace & file output)
router.post('/build', async (req, res) => {
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

        if (isBuildInProgress) {
            return res.status(429).json({
                error: 'Existe outro processo de compilação em andamento. Aguarde alguns instantes.'
            });
        }

        isBuildInProgress = true;
        console.log(`Starting isolated build for user #${req.user.id} (${req.user.email})...`);

        // Load user settings
        const userSettings = await userSettingsRepository.findByUserId(req.user.id);
        const { userUtil, userBuilds } = await ensureUserStorage(req.user.id);

        const passwordToUse = userSettings.correctPassword || '';
        const messageToUse = userSettings.customMessage || '';

        // Create build record
        const build = await buildRepository.create({
            userId: req.user.id,
            buildName: `Build-${req.user.id}-${Date.now()}`,
            passwordUsed: passwordToUse,
            customMessage: messageToUse,
            status: 'building'
        });

        // 1. Prepare user's util folder and sync into build environment
        await fs.copy(userUtil, globalUtilPath);

        // 2. Prepare util.zip for compilation embedding
        const utilZipPath = path.join(projectRoot, 'util.zip');
        await zipFolder(userUtil, utilZipPath);

        // 3. Inject user's specific settings into MainWindow.xaml.cs
        const mainWinPath = path.join(projectRoot, 'MainWindow.xaml.cs');
        if (await fs.pathExists(mainWinPath)) {
            let content = await fs.readFile(mainWinPath, 'utf8');

            const escapeCSharp = (str) => {
                return (str || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
            };

            const escapedPassword = escapeCSharp(passwordToUse);
            const escapedMessage = escapeCSharp(messageToUse);

            content = content.replace(
                /public string CorrectPassword \{ get; set; } = ".*?";/,
                `public string CorrectPassword { get; set; } = "${escapedPassword}";`
            );
            content = content.replace(
                /public string CustomMessage \{ get; set; } = ".*?";/,
                `public string CustomMessage { get; set; } = "${escapedMessage}";`
            );
            content = content.replace(
                /private string _correctPassword = ".*?";/,
                `private string _correctPassword = "${escapedPassword}";`
            );

            await fs.writeFile(mainWinPath, content, 'utf8');
        }

        const publishCmd = 'dotnet publish -c Release -r win-x64 --self-contained false -p:EnableWindowsTargeting=true';

        exec(publishCmd, { cwd: projectRoot }, async (error, stdout, stderr) => {
            isBuildInProgress = false;

            if (error) {
                console.error(`dotnet publish error: ${error}`);
                await buildRepository.update(build.id, {
                    status: 'failed',
                    completedAt: new Date()
                });
                return res.status(500).json({ error: 'Falha na compilação do executável.', details: stderr });
            }

            console.log(`Compilation success for build #${build.id}`);

            const publishDir = path.join(projectRoot, 'bin', 'Release', 'net9.0-windows', 'win-x64', 'publish');
            const userBuildZip = path.join(userBuilds, `${build.id}.zip`);
            const fallbackGlobalZip = path.join(projectRoot, 'dist_output.zip');

            if (await fs.pathExists(publishDir)) {
                // Generate isolated zip for this specific user and build
                await zipFolder(publishDir, userBuildZip);
                await fs.copy(userBuildZip, fallbackGlobalZip).catch(() => {});

                const stats = await fs.stat(userBuildZip);

                await buildRepository.update(build.id, {
                    status: 'completed',
                    fileSize: stats.size,
                    completedAt: new Date()
                });

                await activityLogRepository.create({
                    userId: req.user.id,
                    action: 'BUILD_COMPLETED',
                    description: `Build #${build.id} concluído com sucesso`,
                    ipAddress: req.ip,
                    metadata: { buildId: build.id, fileSize: stats.size }
                });

                res.json({
                    message: 'Build concluído com sucesso! Baixe seu pacote isolado.',
                    downloadUrl: `/api/build/download/${build.id}`,
                    buildId: build.id
                });
            } else {
                await buildRepository.update(build.id, {
                    status: 'failed',
                    completedAt: new Date()
                });
                res.status(500).json({ error: 'Diretório de saída não encontrado: ' + publishDir });
            }
        });

    } catch (err) {
        isBuildInProgress = false;
        console.error('Build trigger error:', err);
        res.status(500).json({ error: 'Processo de build falhou' });
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

function zipFolder(sourceDir, outPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', resolve);
        archive.on('error', reject);

        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

module.exports = router;
