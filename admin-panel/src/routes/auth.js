const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const userRepository = require('../infrastructure/repositories/UserRepository');
const activityLogRepository = require('../infrastructure/repositories/ActivityLogRepository');
const emailService = require('../infrastructure/services/EmailService');
const { generateToken, authMiddleware } = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        const user = await userRepository.findByEmail(email);

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        if (!user.isActive) {
            return res.status(403).json({ error: 'Conta desativada. Contate o administrador.' });
        }

        const validPassword = await userRepository.validatePassword(user, password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Email verification check (bypass for admin accounts)
        if (!user.emailVerified && !user.isAdmin()) {
            return res.status(403).json({
                error: 'Por favor, confirme seu e-mail antes de acessar. Verifique sua caixa de entrada ou solicite um novo link.',
                emailNotVerified: true,
                email: user.email
            });
        }

        const token = generateToken(user);

        await activityLogRepository.create({
            userId: user.id,
            action: 'LOGIN',
            description: 'Usuário fez login',
            ipAddress: req.ip
        });

        res.json({
            message: 'Login realizado com sucesso',
            token,
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

// Register with Email Verification via Resend
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Senhas não conferem' });
        }

        const existingUser = await userRepository.findByEmail(email);

        if (existingUser) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        // Generate 32-byte secure verification token valid for 24h
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const user = await userRepository.create({
            name,
            email,
            password,
            role: 'user',
            monthlyBuildLimit: 5,
            emailVerified: false,
            verificationToken,
            verificationTokenExpires: tokenExpires
        });

        // Send confirmation email via Resend
        let emailSent = false;
        try {
            await emailService.sendVerificationEmail({
                to: email,
                name: name,
                verificationToken: verificationToken
            });
            emailSent = true;
        } catch (emailErr) {
            console.error('Falha ao enviar e-mail de confirmação no cadastro:', emailErr.message);
        }

        await activityLogRepository.create({
            userId: user.id,
            action: 'REGISTER',
            description: 'Novo usuário registrado (aguardando confirmação de e-mail)',
            ipAddress: req.ip
        });

        res.status(201).json({
            message: emailSent
                ? `Conta criada com sucesso! Enviamos um link de confirmação para ${email}. Por favor, verifique sua caixa de entrada e spam.`
                : `Conta criada com sucesso! Houve uma oscilação temporária no envio do e-mail para ${email}. Você pode solicitar o reenvio a qualquer momento.`,
            requireVerification: true,
            email: user.email
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
});

// Verify Email Endpoint (link clicked from email)
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.redirect('/?verify_error=token_missing');
        }

        const user = await userRepository.findByVerificationToken(token);

        if (!user) {
            return res.redirect('/?verify_error=invalid_or_expired');
        }

        await userRepository.verifyEmail(user.id);

        await activityLogRepository.create({
            userId: user.id,
            action: 'EMAIL_VERIFIED',
            description: 'E-mail verificado com sucesso',
            ipAddress: req.ip
        });

        return res.redirect('/?verified=1');
    } catch (error) {
        console.error('Verify email error:', error);
        return res.redirect('/?verify_error=server_error');
    }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'E-mail é obrigatório' });
        }

        const user = await userRepository.findByEmail(email);

        if (!user) {
            return res.json({ message: 'Se o e-mail estiver cadastrado, um novo link de confirmação foi enviado.' });
        }

        if (user.emailVerified) {
            return res.status(400).json({ error: 'Este e-mail já está confirmado. Você já pode fazer login.' });
        }

        const newToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await userRepository.setVerificationToken(user.id, newToken, tokenExpires);

        await emailService.sendVerificationEmail({
            to: user.email,
            name: user.name,
            verificationToken: newToken
        });

        res.json({ message: `Novo link de confirmação enviado para ${user.email}. Verifique sua caixa de entrada e spam.` });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Erro ao reenviar confirmação de e-mail.' });
    }
});

// Validate Token
router.get('/me', authMiddleware, async (req, res) => {
    res.json({ user: req.user.toJSON() });
});

module.exports = router;
