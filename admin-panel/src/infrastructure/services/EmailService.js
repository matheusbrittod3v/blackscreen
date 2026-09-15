const { Resend } = require('resend');

class EmailService {
    constructor() {
        const apiKey = process.env.RESEND_API_KEY;
        this.resend = apiKey ? new Resend(apiKey) : null;
        this.fromEmail = process.env.RESEND_FROM_EMAIL || 'BlackScreen Tool <nao-responda@blackscreentool.com.br>';
        this.siteUrl = process.env.SITE_URL || 'https://blackscreentool.com.br';
    }

    /**
     * Envia e-mail com template HTML de confirmação de conta
     */
    async sendVerificationEmail({ to, name, verificationToken }) {
        if (!this.resend) {
            console.warn('⚠️ RESEND_API_KEY não configurada no ambiente (.env). E-mail de confirmação não disparado.');
            return { error: 'RESEND_API_KEY_NOT_CONFIGURED' };
        }

        const verifyUrl = `${this.siteUrl}/api/auth/verify-email?token=${verificationToken}`;
        const subject = 'Confirme seu e-mail - BlackScreen Tool';
        const html = this.getVerificationTemplate({ name, verifyUrl });

        try {
            console.log(`📧 Enviando e-mail de confirmação para ${to} via Resend...`);

            const result = await this.resend.emails.send({
                from: this.fromEmail,
                to: [to],
                subject: subject,
                html: html
            });

            if (result.error) {
                console.warn('⚠️ Erro com remetente customizado, tentando fallback:', result.error);
                // Fallback para onboarding@resend.dev se o domínio ainda estiver em verificação de DNS
                if (result.error.message?.includes('domain') || result.error.name === 'validation_error') {
                    const fallbackResult = await this.resend.emails.send({
                        from: 'BlackScreen Tool <onboarding@resend.dev>',
                        to: [to],
                        subject: subject,
                        html: html
                    });
                    console.log('✅ E-mail enviado via fallback Resend:', fallbackResult.data?.id);
                    return fallbackResult;
                }
                throw new Error(result.error.message || 'Falha ao enviar e-mail');
            }

            console.log(`✅ E-mail enviado com sucesso para ${to}! ID:`, result.data?.id);
            return result;
        } catch (error) {
            console.error('❌ Erro no envio de e-mail via Resend:', error.message);
            throw error;
        }
    }

    /**
     * Template HTML profissional responsivo no padrão de design do BlackScreen Tool
     */
    getVerificationTemplate({ name, verifyUrl }) {
        return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirme seu e-mail - BlackScreen Tool</title>
</head>
<body style="margin:0;padding:0;background-color:#07070a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f8fafc;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#07070a;padding:40px 15px;">
        <tr>
            <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:linear-gradient(145deg, #121320, #0a0a0f);border:1px solid rgba(225,29,72,0.25);border-radius:16px;box-shadow:0 20px 50px rgba(0,0,0,0.8);overflow:hidden;">
                    
                    <!-- Header com Logo -->
                    <tr>
                        <td align="center" style="padding:32px 30px 20px;border-bottom:1px solid rgba(225,29,72,0.15);">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="vertical-align:middle;padding-right:14px;">
                                        <img src="https://blackscreentool.com.br/img/logo.png" alt="BlackScreen Tool Logo" width="56" height="56" style="display:block;border:0;outline:none;text-decoration:none;">
                                    </td>
                                    <td style="vertical-align:middle;">
                                        <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                                            BlackScreen<span style="color:#e11d48;">Tool</span>
                                        </h1>
                                        <span style="font-size:11px;color:#f87171;letter-spacing:1px;text-transform:uppercase;font-weight:600;">Ferramenta para Unlockers</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding:36px 36px 20px;text-align:left;">
                            <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#ffffff;">
                                Confirme seu endereço de e-mail 🚀
                            </h2>
                            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#cbd5e1;">
                                Olá, <strong style="color:#ffffff;">${name || 'Usuário'}</strong>!
                            </p>
                            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#94a3b8;">
                                Seja bem-vindo à plataforma <strong style="color:#ffffff;">blackscreentool.com.br</strong>. Para ativar seu espaço privativo 100% isolado de compilações, por favor valide sua conta clicando no botão abaixo:
                            </p>

                            <!-- CTA Button -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:28px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${verifyUrl}" target="_blank" style="display:inline-block;padding:15px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;background:linear-gradient(135deg,#e11d48,#be123c);border-radius:10px;box-shadow:0 6px 25px rgba(225,29,72,0.5);letter-spacing:0.3px;">
                                            &#10004; CONFIRMAR MEU E-MAIL
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:24px 0 12px;font-size:13px;line-height:1.5;color:#64748b;">
                                Ou copie e cole este link direto no seu navegador:
                            </p>
                            <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:10px 14px;word-break:break-all;font-size:12px;color:#a5b4fc;font-family:monospace;">
                                ${verifyUrl}
                            </div>

                            <p style="margin:24px 0 0;font-size:12px;color:#64748b;line-height:1.5;">
                                ⏱️ Este link de ativação é válido por <strong>24 horas</strong>.<br>
                                Se você não criou esta conta no BlackScreen Tool, nenhuma ação é necessária.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding:24px 30px;background:rgba(0,0,0,0.25);border-top:1px solid rgba(255,255,255,0.04);font-size:12px;color:#64748b;">
                            <p style="margin:0 0 6px;">
                                BlackScreen Tool &bull; Compilação & Automação Segura
                            </p>
                            <p style="margin:0;font-size:11px;color:#475569;">
                                &copy; 2026 blackscreentool.com.br &bull; Todos os direitos reservados.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }
}

module.exports = new EmailService();
