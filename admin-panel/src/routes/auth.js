const express = require('express');
const router = express.Router();
const userRepository = require('../infrastructure/repositories/UserRepository');
const activityLogRepository = require('../infrastructure/repositories/ActivityLogRepository');
const { generateToken } = require('../middleware/auth');

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

// Register
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

        const user = await userRepository.create({
            name,
            email,
            password,
            role: 'user',
            monthlyBuildLimit: 5
        });

        const token = generateToken(user);

        await activityLogRepository.create({
            userId: user.id,
            action: 'REGISTER',
            description: 'Novo usuário registrado',
            ipAddress: req.ip
        });

        res.status(201).json({
            message: 'Registro realizado com sucesso',
            token,
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
});

// Validate Token
router.get('/me', require('../middleware/auth').authMiddleware, async (req, res) => {
    res.json({ user: req.user.toJSON() });
});

module.exports = router;
