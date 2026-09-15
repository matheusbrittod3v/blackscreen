const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');
const archiver = require('archiver');
const buildQueue = require('./BuildQueue');
const buildRepository = require('../repositories/BuildRepository');
const activityLogRepository = require('../repositories/ActivityLogRepository');

function resolveProjectRoot() {
    let candidate = path.resolve(__dirname, '../../../../');
    if (fs.existsSync(path.join(candidate, 'blackScreenTool.csproj'))) {
        return candidate;
    }
    candidate = path.resolve(__dirname, '../../../');
    if (fs.existsSync(path.join(candidate, 'blackScreenTool.csproj'))) {
        return candidate;
    }
    return path.resolve(process.cwd(), '..');
}

const projectRoot = resolveProjectRoot();
const csprojPath = path.join(projectRoot, 'blackScreenTool.csproj');
const globalUtilPath = path.join(projectRoot, 'util');
const masterImgPath = path.join(projectRoot, 'img');

class BuildWorker {
    constructor() {
        this.isWorking = false;
    }

    init() {
        console.log('[BuildWorker] Worker initialized and listening for jobs...');
        console.log(`[BuildWorker] Project root resolved to: ${projectRoot}`);
        console.log(`[BuildWorker] Project file: ${csprojPath} (exists: ${fs.existsSync(csprojPath)})`);
        
        // Listen to queue events
        buildQueue.on('job:added', () => {
            this.processNext();
        });

        // Safety interval check to pick up queued jobs if worker was idle
        setInterval(() => {
            if (!this.isWorking && buildQueue.queue.length > 0) {
                this.processNext();
            }
        }, 3000);
    }

    async processNext() {
        if (this.isWorking) return;

        const job = buildQueue.getNext();
        if (!job) return;

        this.isWorking = true;
        buildQueue.activeJob = job;
        let mainWinBackup = null;

        console.log(`[BuildWorker] 🚀 Processing Build Job #${job.id} (User #${job.userId})...`);
        buildQueue.emit('job:start', job);

        try {
            // 1. Update database record status to 'building'
            await buildRepository.update(job.id, {
                status: 'building'
            });

            // 2. Prepare user's util folder and sync into build environment
            const defaults = ['logo.png', 'logo.ico'];
            for (const defaultFile of defaults) {
                const userFile = path.join(job.userUtil, defaultFile);
                const masterFile = path.join(masterImgPath, defaultFile);
                if (!(await fs.pathExists(userFile)) && (await fs.pathExists(masterFile))) {
                    await fs.copy(masterFile, userFile);
                }
            }
            await fs.copy(job.userUtil, globalUtilPath);

            // 3. Prepare util.zip for compilation embedding
            const utilZipPath = path.join(projectRoot, 'util.zip');
            await this.zipFolder(job.userUtil, utilZipPath);

            // 4. Inject user's specific settings into MainWindow.xaml.cs with backup
            const mainWinPath = path.join(projectRoot, 'MainWindow.xaml.cs');
            if (await fs.pathExists(mainWinPath)) {
                mainWinBackup = await fs.readFile(mainWinPath, 'utf8');
                let content = mainWinBackup;

                const escapeCSharp = (str) => {
                    return (str || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
                };

                const escapedPassword = escapeCSharp(job.passwordToUse);
                const escapedMessage = escapeCSharp(job.messageToUse);

                content = content.replace(
                    /public string CorrectPassword \{ get; set; } = ".*?";/,
                    () => `public string CorrectPassword { get; set; } = "${escapedPassword}";`
                );
                content = content.replace(
                    /public string CustomMessage \{ get; set; } = ".*?";/,
                    () => `public string CustomMessage { get; set; } = "${escapedMessage}";`
                );
                content = content.replace(
                    /private string _correctPassword = ".*?";/,
                    () => `private string _correctPassword = "${escapedPassword}";`
                );

                await fs.writeFile(mainWinPath, content, 'utf8');
            }

            // 5. Run dotnet publish (Self-Contained Single-File build: zero .NET installation required on client PC)
            const publishCmd = `dotnet publish "${csprojPath}" -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -p:EnableWindowsTargeting=true`;

            await new Promise((resolve, reject) => {
                exec(publishCmd, { cwd: projectRoot }, async (error, stdout, stderr) => {
                    if (error) {
                        const fullError = stderr || stdout || error.message;
                        console.error(`[BuildWorker] ❌ dotnet publish error for Job #${job.id}:`, fullError);
                        return reject(new Error(fullError || 'Falha na compilação do executável.'));
                    }
                    resolve(stdout);
                });
            });

            console.log(`[BuildWorker] ✅ dotnet publish success for Job #${job.id}`);

            // 6. Output zip creation
            const publishDir = path.join(projectRoot, 'bin', 'Release', 'net9.0-windows', 'win-x64', 'publish');
            const userBuildZip = path.join(job.userBuilds, `${job.id}.zip`);
            const fallbackGlobalZip = path.join(projectRoot, 'dist_output.zip');

            if (await fs.pathExists(publishDir)) {
                await this.zipFolder(publishDir, userBuildZip);
                await fs.copy(userBuildZip, fallbackGlobalZip).catch(() => {});

                const stats = await fs.stat(userBuildZip);

                // 7. Update database record status to 'completed'
                await buildRepository.update(job.id, {
                    status: 'completed',
                    fileSize: stats.size,
                    completedAt: new Date()
                });

                // 8. Log activity
                await activityLogRepository.create({
                    userId: job.userId,
                    action: 'BUILD_COMPLETED',
                    description: `Build #${job.id} (${job.buildName}) concluído via worker com sucesso`,
                    ipAddress: job.ip,
                    metadata: { buildId: job.id, fileSize: stats.size }
                });

                console.log(`[BuildWorker] 🎉 Job #${job.id} completed successfully! Size: ${stats.size} bytes`);
                buildQueue.emit('job:completed', { job, fileSize: stats.size });
            } else {
                throw new Error('Diretório de saída da compilação não encontrado.');
            }

        } catch (err) {
            console.error(`[BuildWorker] 💥 Job #${job.id} failed:`, err.message);
            
            await buildRepository.update(job.id, {
                status: 'failed',
                completedAt: new Date()
            }).catch(() => {});

            await activityLogRepository.create({
                userId: job.userId,
                action: 'BUILD_FAILED',
                description: `Build #${job.id} falhou: ${err.message}`,
                ipAddress: job.ip,
                metadata: { buildId: job.id, error: err.message }
            }).catch(() => {});

            buildQueue.emit('job:failed', { job, error: err.message });
        } finally {
            this.isWorking = false;
            buildQueue.activeJob = null;
            
            // Restore MainWindow.xaml.cs back to original state if modified
            try {
                const mainWinPath = path.join(projectRoot, 'MainWindow.xaml.cs');
                if (mainWinBackup && (await fs.pathExists(mainWinPath))) {
                    await fs.writeFile(mainWinPath, mainWinBackup, 'utf8');
                }
            } catch (mwErr) {
                console.error('[BuildWorker] Erro ao restaurar MainWindow.xaml.cs:', mwErr);
            }

            // Restore default logo.png and logo.ico from img/ folder back into global util/
            try {
                const defaultPng = path.join(masterImgPath, 'logo.png');
                const defaultIco = path.join(masterImgPath, 'logo.ico');
                if (await fs.pathExists(defaultPng)) {
                    await fs.copy(defaultPng, path.join(globalUtilPath, 'logo.png'));
                }
                if (await fs.pathExists(defaultIco)) {
                    await fs.copy(defaultIco, path.join(globalUtilPath, 'logo.ico'));
                }
                console.log('[BuildWorker] 🔄 Logos padrão restaurados para a pasta util/');
            } catch (restoreErr) {
                console.error('[BuildWorker] Erro ao restaurar logos padrão:', restoreErr);
            }

            // Immediately process next job in queue if any
            setImmediate(() => this.processNext());
        }
    }

    zipFolder(sourceDir, outPath) {
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
}

const buildWorker = new BuildWorker();
module.exports = buildWorker;
