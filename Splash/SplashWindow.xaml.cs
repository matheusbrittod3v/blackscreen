using System;
using System.IO;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Media.Imaging;
using WpfAnimatedGif;

namespace Black
{
    public partial class SplashWindow : Window
    {
        private readonly string _utilPath;
        private int _duration = 5;
        private bool _fadeOut = true;
        private bool _isGif;          // true = GIF animado, false = PNG
        private string _logoFile;     // nome do arquivo de logo principal

        public SplashWindow(string utilFolder, bool isGif = true)
        {
            InitializeComponent();
            _utilPath = utilFolder ?? throw new ArgumentNullException(nameof(utilFolder));

            _isGif = isGif;
            _logoFile = _isGif ? "logo.gif" : "logo.png";

            this.Loaded += (s, e) => LoadLogo();
        }

        /// <summary>
        /// Carrega o logo da splash screen, com fallback automático:
        /// tenta logo.gif e, se não existir ou falhar, usa logo.png.
        /// </summary>
        private void LoadLogo()
        {
            try
            {
                string gifPath = Path.Combine(_utilPath, "logo.gif");
                string pngPath = Path.Combine(_utilPath, "logo.png");

                string logoPath = _isGif ? gifPath : pngPath;

                // --- FALLBACK automático ---
                if (!File.Exists(logoPath))
                {
                    if (_isGif && File.Exists(pngPath))
                    {
                        Console.WriteLine($"[INFO] logo.gif não encontrado, usando logo.png como fallback.");
                        _isGif = false;
                        logoPath = pngPath;
                    }
                    else
                    {
                        Console.WriteLine($"[AVISO] Nenhum arquivo de logo encontrado (nem GIF nem PNG).");
                        return;
                    }
                }

                if (_isGif && logoPath.EndsWith(".gif", StringComparison.OrdinalIgnoreCase))
                {
                    // GIF animado usando WpfAnimatedGif
                    var gifBitmap = new BitmapImage();
                    gifBitmap.BeginInit();
                    gifBitmap.UriSource = new Uri(logoPath, UriKind.Absolute);
                    gifBitmap.CacheOption = BitmapCacheOption.OnLoad;
                    gifBitmap.EndInit();

                    try
                    {
                        ImageBehavior.SetAnimatedSource(LogoImage, gifBitmap);
                        ImageBehavior.SetRepeatBehavior(LogoImage,
                            System.Windows.Media.Animation.RepeatBehavior.Forever);
                        Console.WriteLine($"[OK] GIF animado carregado: {logoPath}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[ERRO] Falha ao animar GIF ({ex.Message}), tentando fallback PNG...");
                        TryLoadFallbackPng(pngPath);
                    }
                }
                else
                {
                    // PNG estático
                    TryLoadFallbackPng(logoPath);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERRO] Falha geral ao carregar logo: {ex.Message}");
            }
        }

        /// <summary>
        /// Tenta carregar um PNG estático (usado tanto como principal quanto fallback).
        /// </summary>
        private void TryLoadFallbackPng(string path)
        {
            try
            {
                if (File.Exists(path))
                {
                    var bmp = new BitmapImage();
                    bmp.BeginInit();
                    bmp.UriSource = new Uri(path, UriKind.Absolute);
                    bmp.CacheOption = BitmapCacheOption.OnLoad;
                    bmp.EndInit();
                    LogoImage.Source = bmp;
                    Console.WriteLine($"[OK] PNG carregado: {path}");
                }
                else
                {
                    Console.WriteLine($"[AVISO] PNG de fallback não encontrado: {path}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERRO] Falha ao carregar PNG ({path}): {ex.Message}");
            }
        }

        /// <summary>
        /// Exibe a splash temporariamente e faz fade out.
        /// </summary>
        public async Task ShowSplashAsync()
        {
            Show();
            await Task.Delay(_duration * 1000);

            if (_fadeOut)
                await FadeOutAsync();

            Close();
        }

        /// <summary>
        /// Efeito de fade out suave.
        /// </summary>
        private async Task FadeOutAsync()
        {
            const double step = 0.05;
            for (double opacity = 1.0; opacity >= 0; opacity -= step)
            {
                this.Opacity = opacity;
                await Task.Delay(30);
            }
        }
    }
}
