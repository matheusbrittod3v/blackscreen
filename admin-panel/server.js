const express = require('express');
const multer = require('multer');
const archiver = require('archiver');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const projectRoot = path.join(__dirname, '..');
const utilPath = path.join(projectRoot, 'util');
const settingsPath = path.join(utilPath, 'settings.json');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, utilPath);
    },
    filename: function (req, file, cb) {
        // Force specific filenames based on user selection or field name
        if (file.fieldname === 'logo_png') cb(null, 'logo.png');
        else if (file.fieldname === 'logo_ico') cb(null, 'logo.ico');
        else if (file.fieldname === 'logo_gif') cb(null, 'logo.gif');
        else cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Get current settings
app.get('/api/settings', async (req, res) => {
    try {
        const settings = await fs.readJson(settingsPath);
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read settings' });
    }
});

// Save settings
app.post('/api/settings', async (req, res) => {
    try {
        const { CorrectPassword, CustomMessage } = req.body;

        // 1. Save to settings.json
        await fs.writeJson(settingsPath, { CorrectPassword, CustomMessage }, { spaces: 2 });

        // 2. Update MainWindow.xaml.cs directly
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

        res.json({ message: 'Configurações salvas e código fonte atualizado com sucesso!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Falha ao salvar configurações ou atualizar o código.' });
    }
});

// Upload images
app.post('/api/upload', upload.fields([
    { name: 'logo_png', maxCount: 1 },
    { name: 'logo_ico', maxCount: 1 },
    { name: 'logo_gif', maxCount: 1 }
]), (req, res) => {
    res.json({ message: 'Files uploaded successfully' });
});

// Build process: Zip util -> Compile -> Zip Output
app.post('/api/build', async (req, res) => {
    try {
        console.log('Starting build process...');

        // 1. Zip util folder to util.zip in project root
        await zipFolder(utilPath, path.join(projectRoot, 'util.zip'));
        console.log('util.zip created.');

        // 2. Run dotnet publish
        // We use -c Release -r win-x64 --self-contained false for smaller binary
        // or just dotnet publish
        const publishCmd = 'dotnet publish -c Release';

        exec(publishCmd, { cwd: projectRoot }, async (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return res.status(500).json({ error: 'Compilation failed', details: stderr });
            }

            console.log('Compilation successful.');

            // 3. Find publish directory (usually bin/Release/net9.0-windows/publish)
            // We might need to adjust this path based on target framework
            const publishDir = path.join(projectRoot, 'bin', 'Release', 'net9.0-windows', 'publish');
            const outputZip = path.join(projectRoot, 'dist_output.zip');

            if (await fs.pathExists(publishDir)) {
                await zipFolder(publishDir, outputZip);
                console.log('Final ZIP created.');
                res.json({ message: 'Build completed successfully!', downloadUrl: '/api/download' });
            } else {
                res.status(500).json({ error: 'Publish directory not found' });
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Build process failed' });
    }
});

// Download terminal zip
app.get('/api/download', (req, res) => {
    const file = path.join(projectRoot, 'dist_output.zip');
    res.download(file);
});

function zipFolder(sourceDir, outPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', resolve);
        archive.on('error', reject);

        archive.pipe(output);
        // Add files directly to the root of the zip if it's util.zip
        if (sourceDir.endsWith('util')) {
            archive.directory(sourceDir, false);
        } else {
            archive.directory(sourceDir, false);
        }
        archive.finalize();
    });
}

app.listen(port, () => {
    console.log(`Admin panel running at http://localhost:${port}`);
});
