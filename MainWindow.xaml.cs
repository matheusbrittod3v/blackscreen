using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Threading;
using WpfAnimatedGif;

// ATENÇÃO: Se System.Windows.Forms também estiver incluído, remova-o dos using ou qualifique tudo.
// O código abaixo assume que System.Windows.Forms não está sendo importado, mas usa a qualificação
// explícita em casos-chave para garantir.

namespace Black
{
    public class Settings
    {
        public string CorrectPassword { get; set; } = "123456";
        public string CustomMessage { get; set; } = "test";
    }

    public partial class PasswordWindow : Window
    {
        private string _correctPassword = "123456";
        private readonly PasswordBox _passwordInput;
        public PasswordWindow(string correctPassword)
        {
            _correctPassword = correctPassword;
            Title = "Autenticação Necessária";
            Width = 300;
            Height = 150;
            WindowStartupLocation = System.Windows.WindowStartupLocation.CenterScreen;
            ResizeMode = System.Windows.ResizeMode.NoResize;

            var stackPanel = new StackPanel { Margin = new Thickness(10) };

            stackPanel.Children.Add(new TextBlock { Text = "Digite a senha para continuar:", Margin = new Thickness(0, 0, 0, 10) });

            _passwordInput = new PasswordBox { Margin = new Thickness(0, 0, 0, 10) };
            stackPanel.Children.Add(_passwordInput);

            var okButton = new System.Windows.Controls.Button
            {
                Content = "OK",
                Width = 80,
                HorizontalAlignment = System.Windows.HorizontalAlignment.Center
            };
            okButton.Click += (s, e) => CheckPassword(_passwordInput.Password);
            stackPanel.Children.Add(okButton);

            Content = stackPanel;
            this.Loaded += (s, e) => _passwordInput.Focus();
        }

        private void CheckPassword(string enteredPassword)
        {
            if (enteredPassword == _correctPassword)
            {
                DialogResult = true;
                Close();
            }
            else
            {
                System.Windows.MessageBox.Show("Senha incorreta. Tente novamente.", "Erro de Autenticação", System.Windows.MessageBoxButton.OK, System.Windows.MessageBoxImage.Error);
                _passwordInput.Clear();
                _passwordInput.Focus();
            }
        }
    }


    public partial class MainWindow : Window
    {
        private readonly List<ScreenItem> _detectedScreens = new();
        private readonly List<BlackWindow> _openBlackWindows = new();
        private HwndSource? _hwndSource;
        private DispatcherTimer? _monitorWatcher;
        private string _lastScreenSignature = "";
        private string _utilTempFolder = "";

        public MainWindow()
        {
            InitializeComponent();

            // Extrair util.zip embutido para pasta temporária
            _utilTempFolder = ExtractEmbeddedUtilZip();

            // Carregar configurações do JSON na pasta extraída
            var settings = LoadSettings();

            // 1. Pedir Senha ANTES de iniciar o resto
            var authWindow = new PasswordWindow(settings.CorrectPassword);
            bool? authenticated = authWindow.ShowDialog();

            if (authenticated != true)
            {
                System.Windows.Application.Current.Shutdown();
                return;
            }

            Loaded += MainWindow_Loaded;
            Closed += MainWindow_Closed;
        }

        private Settings LoadSettings()
        {
            try
            {
                string settingsPath = Path.Combine(_utilTempFolder, "settings.json");
                if (File.Exists(settingsPath))
                {
                    string json = File.ReadAllText(settingsPath);
                    return System.Text.Json.JsonSerializer.Deserialize<Settings>(json) ?? new Settings();
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[ERRO] Falha ao carregar settings.json: {ex.Message}");
            }
            return new Settings();
        }

        private void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            var interopHelper = new WindowInteropHelper(this);
            _hwndSource = HwndSource.FromHwnd(interopHelper.Handle);
            _hwndSource?.AddHook(WndProc);

            LoadScreens();

            _monitorWatcher = new DispatcherTimer
            {
                Interval = TimeSpan.FromSeconds(2)
            };
            _monitorWatcher.Tick += MonitorWatcher_Tick;
            _monitorWatcher.Start();
        }

        private void MainWindow_Closed(object? sender, EventArgs e)
        {
            _hwndSource?.RemoveHook(WndProc);
            _hwndSource = null;
            _monitorWatcher?.Stop();

            try
            {
                if (Directory.Exists(_utilTempFolder))
                    Directory.Delete(_utilTempFolder, true);
            }
            catch { /* ignorar erros de lock */ }
        }

        private const int WM_DISPLAYCHANGE = 0x007E;

        private IntPtr WndProc(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
        {
            if (msg == WM_DISPLAYCHANGE)
            {
                RefreshScreens("⚡ Evento WM_DISPLAYCHANGE detectado");
                handled = true;
            }
            return IntPtr.Zero;
        }

        private void MonitorWatcher_Tick(object? sender, EventArgs e)
        {
            try
            {
                string currentSignature = GetScreenSignature();
                if (_lastScreenSignature != currentSignature)
                {
                    _lastScreenSignature = currentSignature;
                    RefreshScreens("🔄 Mudança detectada");
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[ERRO] MonitorWatcher: {ex.Message}");
            }
        }

        private string GetScreenSignature()
        {
            var list = new List<string>();
            EnumDisplayMonitors(IntPtr.Zero, IntPtr.Zero,
                delegate (IntPtr hMonitor, IntPtr hdcMonitor, ref RECT rect, IntPtr data)
                {
                    list.Add($"{rect.Left},{rect.Top},{rect.Right - rect.Left},{rect.Bottom - rect.Top}");
                    return true;
                }, IntPtr.Zero);

            return string.Join("|", list);
        }

        private void RefreshScreens(string origem)
        {
            Dispatcher.Invoke(() =>
            {
                LoadScreens();
                Debug.WriteLine($"{origem}: {_detectedScreens.Count} monitor(es) detectado(s).");
            });
        }

        private void LoadScreens()
        {
            // Assuming ScreensList is a ListBox or similar ItemsControl in your XAML
            // Se estiver faltando ScreensList no seu XAML, o código aqui pode dar erro.
            // Para o propósito deste código, assumo que existe.
            ScreensList.Items.Clear();
            _detectedScreens.Clear();

            EnumDisplayMonitors(IntPtr.Zero, IntPtr.Zero,
                delegate (IntPtr hMonitor, IntPtr hdcMonitor, ref RECT lprcMonitor, IntPtr dwData)
                {
                    var bounds = new Rect(
                        lprcMonitor.Left, lprcMonitor.Top,
                        lprcMonitor.Right - lprcMonitor.Left,
                        lprcMonitor.Bottom - lprcMonitor.Top
                    );

                    var item = new ScreenItem
                    {
                        Index = _detectedScreens.Count,
                        DeviceName = $"Monitor {_detectedScreens.Count + 1}",
                        Bounds = bounds,
                        IsPrimary = lprcMonitor.Left == 0 && lprcMonitor.Top == 0
                    };
                    _detectedScreens.Add(item);

                    var panel = new StackPanel
                    {
                        Orientation = System.Windows.Controls.Orientation.Horizontal,
                        Margin = new Thickness(6)
                    };

                    var cb = new System.Windows.Controls.CheckBox
                    {
                        Width = 20,
                        Tag = item
                    };

                    var txt = new TextBlock
                    {
                        Text = $"{item.DeviceName} - {(item.IsPrimary ? "Primário" : "Secundário")} ({bounds.Width}x{bounds.Height}) @ {bounds.X},{bounds.Y}",
                        VerticalAlignment = System.Windows.VerticalAlignment.Center,
                        Margin = new Thickness(6, 0, 0, 0),
                        TextWrapping = System.Windows.TextWrapping.Wrap
                    };

                    panel.Children.Add(cb);
                    panel.Children.Add(txt);
                    ScreensList.Items.Add(panel);

                    return true;
                }, IntPtr.Zero);

            _lastScreenSignature = GetScreenSignature();
            Debug.WriteLine($"🖥️ {_detectedScreens.Count} monitor(es) detectado(s).");
        }


        // ----------------------------------------------------------------------------------
        // ======================== BOTÕES (USANDO DEVCON no MODO SILENCIOSO) ===========================

        /// <summary>
        /// Instala o driver virtual MttVDD usando DEVCON.EXE em modo silencioso (sem janela de console).
        /// NOTA: Este código SÓ FUNCIONARÁ se o aplicativo principal JÁ estiver elevado (rodando como Admin).
        /// </summary>
        private async void BtnInstall_Click(object sender, RoutedEventArgs e)
        {
            string exePath = Path.Combine(_utilTempFolder, "devcon.exe");
            string infPath = Path.Combine(_utilTempFolder, "MttVDD.inf");
            string hardwareID = "ROOT\\MttVDD";

            // 🔹 1. Verificação básica de dependências
            if (!File.Exists(exePath) || !File.Exists(infPath))
            {
                System.Windows.MessageBox.Show("devcon.exe ou MttVDD.inf não encontrados na pasta temporária.",
                    "Erro", MessageBoxButton.OK, MessageBoxImage.Error);
                return;
            }

            try
            {
                // 🔹 2. Instala o driver MttVDD virtual (modo silencioso)
                var psi = new ProcessStartInfo(exePath, $"install \"{infPath}\" \"{hardwareID}\"")
                {
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true,
                    WorkingDirectory = _utilTempFolder
                };

                using (var process = Process.Start(psi))
                {
                    if (process != null)
                    {
                        string output = await process.StandardOutput.ReadToEndAsync();
                        string error = await process.StandardError.ReadToEndAsync();
                        process.WaitForExit();

                        if (process.ExitCode == 0)
                        {
                            // 🔹 3. Após instalar, estende e aplica resolução idêntica em todos os monitores
                            ApplyExtendedModeAndResolution();

                            System.Windows.MessageBox.Show("Monitor virtual criado e configurado com sucesso!",
                                "Sucesso", MessageBoxButton.OK, MessageBoxImage.Information);
                        }
                        else
                        {
                            System.Windows.MessageBox.Show($"Falha ao instalar o driver virtual:\n\n{error}",
                                "Erro", MessageBoxButton.OK, MessageBoxImage.Error);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show($"Erro ao instalar e configurar o monitor virtual:\n{ex.Message}",
                    "Erro", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        // ----------------------------------------------------------------------------------

        /// <summary>
        /// Ativa o modo estendido e aplica a mesma resolução e taxa de atualização para todos os monitores.
        /// Utiliza apenas ferramentas nativas (DisplaySwitch + API ChangeDisplaySettingsEx via PowerShell).
        /// </summary>
        private void ApplyExtendedModeAndResolution()
        {
            try
            {
                // 🔹 1. Ativar modo estendido (sem janelas)
                var extendProcess = new ProcessStartInfo("displayswitch.exe", "/extend")
                {
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                Process.Start(extendProcess)?.WaitForExit();

                // 🔹 2. Aguardar o Windows registrar o novo monitor virtual
                Thread.Sleep(4000);

                // 🔹 3. PowerShell: ajustar resolução/refresh em todos monitores
                string psCommand = @"
Add-Type -AssemblyName System.Windows.Forms
$width = 1920
$height = 1080
$refresh = 60

# Código C# inline para manipular resoluções
$code = @'
using System;
using System.Runtime.InteropServices;
public class DisplayUtil {
    [StructLayout(LayoutKind.Sequential)]
    public struct DEVMODE {
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string dmDeviceName;
        public short dmSpecVersion;
        public short dmDriverVersion;
        public short dmSize;
        public short dmDriverExtra;
        public int dmFields;
        public int dmPositionX;
        public int dmPositionY;
        public int dmPelsWidth;
        public int dmPelsHeight;
        public int dmDisplayFlags;
        public int dmDisplayFrequency;
        public int dmBitsPerPel;
        public int dmPanningWidth;
        public int dmPanningHeight;
    }

    [DllImport(""user32.dll"")]
    public static extern int EnumDisplaySettings(string deviceName, int modeNum, ref DEVMODE devMode);

    [DllImport(""user32.dll"")]
    public static extern int ChangeDisplaySettingsEx(string deviceName, ref DEVMODE devMode, int hwnd, int flags, int lParam);
}
'@
Add-Type -TypeDefinition $code -Language CSharp

# Itera por todas as telas disponíveis e aplica configuração uniforme
[System.Windows.Forms.Screen]::AllScreens | ForEach-Object {
    $name = $_.DeviceName
    $devmode = New-Object DisplayUtil+DEVMODE
    [DisplayUtil]::EnumDisplaySettings($name, -1, [ref]$devmode) | Out-Null
    $devmode.dmPelsWidth = $width
    $devmode.dmPelsHeight = $height
    $devmode.dmDisplayFrequency = $refresh
    $devmode.dmFields = 0x180000
    [DisplayUtil]::ChangeDisplaySettingsEx($name, [ref]$devmode, 0, 0, 0) | Out-Null
}
";

                // 🔹 4. Executar PowerShell silenciosamente
                var psi = new ProcessStartInfo("powershell.exe",
                    $"-NoProfile -ExecutionPolicy Bypass -Command \"{psCommand}\"")
                {
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                Process.Start(psi)?.WaitForExit();
            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show($"Falha ao aplicar extensão e resolução: {ex.Message}",
                    "Aviso", MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }
    


// ----------------------------------------------------------------------------------
// ... BtnRemove_Click com as mesmas alterações de ProcessStartInfo ...
// ----------------------------------------------------------------------------------

/// <summary>
/// Remove o driver virtual MttVDD usando DEVCON.EXE em modo silencioso.
/// </summary>
private void BtnRemove_Click(object sender, RoutedEventArgs e)
        {
            var exePath = Path.Combine(_utilTempFolder, "devcon.exe");
            var infPath = Path.Combine(_utilTempFolder, "MttVDD.inf");
            const string hardwareID = "ROOT\\MttVDD";

            if (!File.Exists(exePath))
            {
                System.Windows.MessageBox.Show(
                    "devcon.exe não encontrado na pasta temporária.",
                    "Erro", System.Windows.MessageBoxButton.OK, System.Windows.MessageBoxImage.Error);
                return;
            }

            try
            {
                // 1. Comando REMOVE: Remove o dispositivo virtual (MttVDD)
                var argumentsRemove = $"remove \"{hardwareID}\"";

                // MUDANÇA PRINCIPAL AQUI
                var psiRemove = new ProcessStartInfo(exePath, argumentsRemove)
                {
                    UseShellExecute = false,        // Essencial para CreateNoWindow
                    CreateNoWindow = true,          // Suprime a janela do console
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    WorkingDirectory = _utilTempFolder
                };

                using (var process = Process.Start(psiRemove))
                {
                    process?.WaitForExit();
                }

                // 2. Comando DP_DELETE: Remove o pacote INF do Driver Store
                var argumentsDpDelete = $"dp_delete \"{infPath}\"";

                // MUDANÇA PRINCIPAL AQUI
                var psiDelete = new ProcessStartInfo(exePath, argumentsDpDelete)
                {
                    UseShellExecute = false,        // Essencial para CreateNoWindow
                    CreateNoWindow = true,          // Suprime a janela do console
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    WorkingDirectory = _utilTempFolder
                };

                using (var process = Process.Start(psiDelete))
                {
                    process?.WaitForExit();
                }

                System.Windows.MessageBox.Show("area de trabalho  removido com sucesso!",
                    "Sucesso", System.Windows.MessageBoxButton.OK, System.Windows.MessageBoxImage.Information);

            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show($"Erro ao remover : {ex.Message}",
                    "Erro", System.Windows.MessageBoxButton.OK, System.Windows.MessageBoxImage.Error);
            }
        }
        // ----------------------------------------------------------------------------------
        private void BtnDisplay_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                Process.Start(new ProcessStartInfo("control.exe", "/name Microsoft.Display") { UseShellExecute = true });
            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show($"Erro abrindo Configurações de Exibição: {ex.Message}",
                    "Erro", System.Windows.MessageBoxButton.OK, System.Windows.MessageBoxImage.Error);
            }
        }

        private void BtnActivate_Click(object sender, RoutedEventArgs e)
        {
            var selected = GetSelectedScreens().ToList();
            if (!selected.Any())
            {
                System.Windows.MessageBox.Show("Nenhum monitor selecionado.", "Info", System.Windows.MessageBoxButton.OK, System.Windows.MessageBoxImage.Information);
                return;
            }

            var settings = LoadSettings();
            foreach (var s in selected)
            {
                var bw = new BlackWindow(s.Bounds, _utilTempFolder, settings.CustomMessage);
                bw.Closed += (sdr, ev) => _openBlackWindows.Remove(bw);
                bw.Show();
                _openBlackWindows.Add(bw);
            }

           
        }

        private IEnumerable<ScreenItem> GetSelectedScreens()
        {
            var list = new List<ScreenItem>();
            foreach (var child in ScreensList.Items)
            {
                if (child is StackPanel panel &&
                    panel.Children.Count > 0 &&
                    panel.Children[0] is System.Windows.Controls.CheckBox cb &&
                    cb.Tag is ScreenItem item &&
                    cb.IsChecked == true)
                {
                    list.Add(item);
                }
            }
            return list;
        }

        private void BtnCloseAll_Click(object sender, RoutedEventArgs e)
        {
            foreach (var w in _openBlackWindows.ToArray())
                w.Close();

            _openBlackWindows.Clear();
        }

        #region Extrair util.zip embutido
        private string ExtractEmbeddedUtilZip()
        {
            string tempFolder = Path.Combine(Path.GetTempPath(), "Black_" + System.Guid.NewGuid().ToString("N"));
            System.IO.Directory.CreateDirectory(tempFolder);

            var assembly = System.Reflection.Assembly.GetExecutingAssembly();
            string resourceName = assembly.GetManifestResourceNames()
                .FirstOrDefault(n => n.EndsWith("util.zip", System.StringComparison.OrdinalIgnoreCase))
                ?? throw new System.Exception("util.zip não encontrado como recurso embutido!");

            string zipPath = System.IO.Path.Combine(tempFolder, "util.zip");

            using (var stream = assembly.GetManifestResourceStream(resourceName)!)
            using (var fileStream = System.IO.File.Create(zipPath))
                stream.CopyTo(fileStream);

            // Extrair todos os arquivos **direto na raiz da pasta temporária**
            using (var zip = System.IO.Compression.ZipFile.OpenRead(zipPath))
            {
                foreach (var entry in zip.Entries)
                {
                    if (string.IsNullOrEmpty(entry.Name)) continue; // pastas
                    string fullPath = System.IO.Path.Combine(tempFolder, entry.Name); // sem subpastas
                    entry.ExtractToFile(fullPath, overwrite: true);
                }
            }

            System.IO.File.Delete(zipPath); // opcional: remove o zip após extração
            return tempFolder;
        }


        #endregion

        #region Win32 API
        private delegate bool MonitorEnumProc(IntPtr hMonitor, IntPtr hdcMonitor, ref RECT lprcMonitor, IntPtr dwData);

        [System.Runtime.InteropServices.DllImport("user32.dll")]
        private static extern bool EnumDisplayMonitors(IntPtr hdc, IntPtr hprcClip, MonitorEnumProc lpfnEnum, IntPtr dwData);

        [System.Runtime.InteropServices.StructLayout(System.Runtime.InteropServices.LayoutKind.Sequential)]
        private struct RECT
        {
            public int Left, Top, Right, Bottom;
        }
        #endregion
    }

    internal class ScreenItem
    {
        public int Index { get; set; }
        public string DeviceName { get; set; } = string.Empty;
        public Rect Bounds { get; set; }
        public bool IsPrimary { get; set; }
    }

    public class BlackWindow : Window
    {
        private string _customMessage = "";
        private readonly string _utilTempFolder;

        public BlackWindow(Rect bounds, string utilTempFolder, string customMessage)
        {
            _utilTempFolder = utilTempFolder;
            _customMessage = customMessage;

            WindowStyle = System.Windows.WindowStyle.None;
            ResizeMode = System.Windows.ResizeMode.NoResize;
            Topmost = true;
            ShowInTaskbar = false;
            Background = System.Windows.Media.Brushes.Black;
            Left = bounds.X;
            Top = bounds.Y;
            Width = bounds.Width;
            Height = bounds.Height;

            Content = CreateContentPanel(true);

            Loaded += BlackWindow_Loaded;
            KeyDown += BlackWindow_KeyDown;
        }
        private StackPanel CreateContentPanel(bool IsGif)
        {
            var panel = new StackPanel
            {
                VerticalAlignment = System.Windows.VerticalAlignment.Center,
                HorizontalAlignment = System.Windows.HorizontalAlignment.Center
            };

            try
            {
                // Define o arquivo inicial (gif ou png)
                string primaryFile = IsGif ? "logo.gif" : "logo.png";
                string fallbackFile = "logo.png";

                string primaryPath = System.IO.Path.Combine(_utilTempFolder, primaryFile);
                string fallbackPath = System.IO.Path.Combine(_utilTempFolder, fallbackFile);

                string fileToUse = primaryPath;

                // Caso o GIF não exista, usa automaticamente o PNG
                if (!System.IO.File.Exists(primaryPath))
                {
                    System.Diagnostics.Debug.WriteLine($"[INFO] {primaryFile} não encontrado, tentando {fallbackFile}...");
                    fileToUse = fallbackPath;
                    IsGif = false; // força modo estático
                }

                // Verifica se o arquivo final existe
                if (System.IO.File.Exists(fileToUse))
                {
                    var img = new System.Windows.Controls.Image
                    {
                        Width = 450,
                        Height = 450,
                        Stretch = System.Windows.Media.Stretch.Uniform
                    };

                    var uri = new Uri(fileToUse, UriKind.Absolute);

                    try
                    {
                        if (IsGif && fileToUse.EndsWith(".gif", StringComparison.OrdinalIgnoreCase))
                        {
                            // Tenta carregar GIF animado
                            var imageSource = new BitmapImage(uri);
                            ImageBehavior.SetAnimatedSource(img, imageSource);
                            ImageBehavior.SetRepeatBehavior(img, System.Windows.Media.Animation.RepeatBehavior.Forever);
                        }
                        else
                        {
                            // PNG estático
                            img.Source = new BitmapImage(uri);
                        }
                    }
                    catch (Exception ex)
                    {
                        // Se falhar ao carregar GIF, faz fallback imediato para PNG
                        System.Diagnostics.Debug.WriteLine($"[ERRO] Falha ao carregar {fileToUse}: {ex.Message}");
                        if (fileToUse.EndsWith(".gif", StringComparison.OrdinalIgnoreCase) && System.IO.File.Exists(fallbackPath))
                        {
                            System.Diagnostics.Debug.WriteLine($"[INFO] Tentando carregar fallback {fallbackFile}...");
                            img.Source = new BitmapImage(new Uri(fallbackPath, UriKind.Absolute));
                        }
                    }

                    panel.Children.Add(img);
                }
                else
                {
                    System.Diagnostics.Debug.WriteLine($"[AVISO] Nenhum arquivo de logo encontrado em: {fileToUse}");
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[ERRO] Falha geral ao carregar logo: {ex.Message}");
            }

            // Texto personalizado abaixo da imagem
            panel.Children.Add(new TextBlock
            {
                Text = _customMessage,
                Foreground = System.Windows.Media.Brushes.White,
                FontSize = 24,
                FontWeight = System.Windows.FontWeights.Bold,
                TextAlignment = System.Windows.TextAlignment.Center,
                TextWrapping = TextWrapping.Wrap,
                Margin = new Thickness(0, 20, 0, 0)
            });

            return panel;
        }


        private void BlackWindow_Loaded(object sender, RoutedEventArgs e)
        {
            try
            {
                var interop = new WindowInteropHelper(this);
                NativeMethods.SetWindowPos(interop.Handle, NativeMethods.HWND_TOPMOST,
                    (int)Left, (int)Top, (int)Width, (int)Height, NativeMethods.SWP_NOACTIVATE);
                NativeMethods.SetForegroundWindow(interop.Handle);
            }
            catch { }
        }

        private void BlackWindow_KeyDown(object sender, System.Windows.Input.KeyEventArgs e)
        {
            // Fecha a janela apenas se Ctrl + W for pressionado
            if (e.Key == Key.W &&
                (Keyboard.IsKeyDown(Key.LeftCtrl) || Keyboard.IsKeyDown(Key.RightCtrl)))
            {
                Close();
            }
        }

    }

    internal static class NativeMethods
    {
        public const int SWP_NOACTIVATE = 0x0010;
        public static readonly IntPtr HWND_TOPMOST = new(-1);

        [System.Runtime.InteropServices.DllImport("user32.dll", SetLastError = true)]
        public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter,
            int X, int Y, int cx, int cy, int uFlags);

        [System.Runtime.InteropServices.DllImport("user32.dll")]
        public static extern bool SetForegroundWindow(IntPtr hWnd);
    }
}