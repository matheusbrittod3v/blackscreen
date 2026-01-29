const jwt = require('jsonwebtoken');
const userRepository = require('../infrastructure/repositories/UserRepository');

const JWT_SECRET = process.env.JWT_SECRET || 'black-tool-secret-key-2024-super-secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        let token = null;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        } else if (req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({ error: 'Token de autenticação não fornecido' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await userRepository.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        if (!user.isActive) {
            return res.status(403).json({ error: 'Conta desativada' });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado' });
        }
        return res.status(401).json({ error: 'Token inválido' });
    }
}

function adminMiddleware(req, res, next) {
    if (!req.user || !req.user.isAdmin()) {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }
    next();
}

function generateToken(user) {
    return jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

module.exports = {
    authMiddleware,
    adminMiddleware,
    generateToken,
    JWT_SECRET
};
