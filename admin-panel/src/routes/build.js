const express = require('express');
const multer = require('multer');
const archiver = require('archiver');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const buildRepository = require('../infrastructure/repositories/BuildRepository');
const activityLogRepository = require('../infrastructure/repositories/ActivityLogRepository');

const projectRoot = path.join(__dirname, '..', '..', '..');
const utilPath = path.join(projectRoot, 'util');
const settingsPath = path.join(utilPath, 'settings.json');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, utilPath);
    },
    filename: function (req, file, cb) {
        if (file.fieldname === 'logo_png') cb(null, 'logo.png');
        else if (file.fieldname === 'logo_ico') cb(null, 'logo.ico');
        else if (file.fieldname === 'logo_gif') cb(null, 'logo.gif');
        else cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Apply auth middleware
router.use(authMiddleware);

// Get current settings
router.get('/settings', async (req, res) => {
    try {
        const settings = await fs.readJson(settingsPath);
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: 'Falha ao ler configurações' });
    }
});

// Save settings
router.post('/settings', async (req, res) => {
    try {
        const { CorrectPassword, CustomMessage } = req.body;

        await fs.writeJson(settingsPath, { CorrectPassword, CustomMessage }, { spaces: 2 });

        const mainWinPath = path.join(projectRoot, 'MainWindow.xaml.cs');
        if (await fs.pathExists(mainWinPath)) {
            let content = await fs.readFile(mainWinPath, 'utf8');

            const escapeCSharp = (str) => {
                return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
            };

            const escapedPassword = escapeCSharp(CorrectPassword);
            const escapedMessage = escapeCSharp(CustomMessage);

            content = content.replace(
                /public string CorrectPassword \{ get; set; \} = ".*?";/,
                `public string CorrectPassword { get; set; } = "${escapedPassword}";`
            );
            content = content.replace(
                /public string CustomMessage \{ get; set; \} = ".*?";/,
                `public string CustomMessage { get; set; } = "${escapedMessage}";`
            );
            content = content.replace(
                /private string _correctPassword = ".*?";/,
                `private string _correctPassword = "${escapedPassword}";`
            );

            await fs.writeFile(mainWinPath, content, 'utf8');
        }

        res.json({ message: 'Configurações salvas com sucesso!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Falha ao salvar configurações.' });
    }
});

// Upload images
router.post('/upload', upload.fields([
    { name: 'logo_png', maxCount: 1 },
    { name: 'logo_ico', maxCount: 1 },
    { name: 'logo_gif', maxCount: 1 }
]), (req, res) => {
    res.json({ message: 'Arquivos enviados com sucesso' });
});

// Check build limit
router.get('/build-limit', async (req, res) => {
    try {
        const buildsThisMonth = await buildRepository.countByUserThisMonth(req.user.id);
        const limit = req.user.monthlyBuildLimit;
        const remaining = limit - buildsThisMonth;

        res.json({
            limit,
            used: buildsThisMonth,
            remaining,
            canBuild: remaining > 0
        });
    } catch (error) {
        console.error('Build limit error:', error);
        res.status(500).json({ error: 'Erro ao verificar limite' });
    }
});

// Build process
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

        console.log(`Starting build for user ${req.user.email}...`);

        // Get current settings for build record
        let settings = {};
        try {
            settings = await fs.readJson(settingsPath);
        } catch (e) { }

        // Create build record
        const build = await buildRepository.create({
            userId: req.user.id,
            buildName: `Build-${Date.now()}`,
            passwordUsed: settings.CorrectPassword || '',
            customMessage: settings.CustomMessage || '',
            status: 'building'
        });

        if (process.platform !== 'win32') {
            console.warn('Attempting to build on non-Windows platform.');
        }

        // Zip util folder
        await zipFolder(utilPath, path.join(projectRoot, 'util.zip'));
        console.log('util.zip created.');

        const publishCmd = 'dotnet publish -c Release -r win-x64 --self-contained false -p:EnableWindowsTargeting=true';

        exec(publishCmd, { cwd: projectRoot }, async (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                await buildRepository.update(build.id, {
                    status: 'failed',
                    completedAt: new Date()
                });
                return res.status(500).json({ error: 'Falha na compilação.', details: stderr });
            }

            console.log('Compilação concluída com sucesso.');

            const publishDir = path.join(projectRoot, 'bin', 'Release', 'net9.0-windows', 'win-x64', 'publish');
            const outputZip = path.join(projectRoot, 'dist_output.zip');

            if (await fs.pathExists(publishDir)) {
                await zipFolder(publishDir, outputZip);

                const stats = await fs.stat(outputZip);

                await buildRepository.update(build.id, {
                    status: 'completed',
                    fileSize: stats.size,
                    completedAt: new Date()
                });

                await activityLogRepository.create({
                    userId: req.user.id,
                    action: 'BUILD_COMPLETED',
                    description: `Build concluído: ${build.buildName}`,
                    ipAddress: req.ip,
                    metadata: { buildId: build.id, fileSize: stats.size }
                });

                console.log('ZIP final gerado.');
                res.json({
                    message: 'Build concluído! Baixe o seu ZIP abaixo.',
                    downloadUrl: '/api/build/download',
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
        console.error(err);
        res.status(500).json({ error: 'Processo de build falhou' });
    }
});

// Download
router.get('/download', async (req, res) => {
    const file = path.join(projectRoot, 'dist_output.zip');

    if (req.query.buildId) {
        await buildRepository.incrementDownload(req.query.buildId);
    }

    res.download(file);
});

// User's build history
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
