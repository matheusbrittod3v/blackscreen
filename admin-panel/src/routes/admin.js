const express = require('express');
const router = express.Router();
const userRepository = require('../infrastructure/repositories/UserRepository');
const buildRepository = require('../infrastructure/repositories/BuildRepository');
const activityLogRepository = require('../infrastructure/repositories/ActivityLogRepository');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard Stats
router.get('/dashboard', async (req, res) => {
    try {
        const [
            totalUsers,
            totalBuilds,
            buildsThisMonth,
            recentBuilds,
            recentUsers,
            recentActivity,
            monthlyStats,
            userBuildStats
        ] = await Promise.all([
            userRepository.countAll(),
            buildRepository.countAll(),
            buildRepository.countThisMonth(),
            buildRepository.getRecentBuilds(5),
            userRepository.getRecentUsers(5),
            activityLogRepository.findRecent(10),
            buildRepository.getMonthlyStats(),
            buildRepository.getUserBuildStats()
        ]);

        const adminCount = await userRepository.countByRole('admin');

        res.json({
            stats: {
                totalUsers,
                adminCount,
                userCount: totalUsers - adminCount,
                totalBuilds,
                buildsThisMonth
            },
            recentBuilds,
            recentUsers: recentUsers.map(u => u.toJSON()),
            recentActivity,
            monthlyStats,
            userBuildStats
        });
    } catch (error) {
        console.error('Dashboard full error details:', {
            message: error.message,
            stack: error.stack,
            sql: error.sql,
            code: error.code
        });
        res.status(500).json({ error: 'Erro ao carregar dashboard', details: error.message });
    }
});

// Users Management
router.get('/users', async (req, res) => {
    try {
        const users = await userRepository.findAll();

        const usersWithStats = await Promise.all(
            users.map(async (user) => {
                const buildsThisMonth = await buildRepository.countByUserThisMonth(user.id);
                return {
                    ...user.toJSON(),
                    buildsThisMonth,
                    buildsRemaining: user.monthlyBuildLimit - buildsThisMonth
                };
            })
        );

        res.json(usersWithStats);
    } catch (error) {
        console.error('Get users full error details:', {
            message: error.message,
            stack: error.stack,
            sql: error.sql,
            code: error.code
        });
        res.status(500).json({ error: 'Erro ao listar usuários', details: error.message });
    }
});

router.get('/users/:id', async (req, res) => {
    try {
        const user = await userRepository.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const builds = await buildRepository.findByUserId(user.id);
        const buildsThisMonth = await buildRepository.countByUserThisMonth(user.id);

        res.json({
            ...user.toJSON(),
            buildsThisMonth,
            buildsRemaining: user.monthlyBuildLimit - buildsThisMonth,
            builds
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});

router.post('/users', async (req, res) => {
    try {
        const { name, email, password, role, monthlyBuildLimit, isActive } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
        }

        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        const user = await userRepository.create({
            name,
            email,
            password,
            role: role || 'user',
            monthlyBuildLimit: monthlyBuildLimit || 5,
            isActive: isActive !== false
        });

        await activityLogRepository.create({
            userId: req.user.id,
            action: 'USER_CREATED',
            description: `Admin criou usuário ${email}`,
            ipAddress: req.ip,
            metadata: { createdUserId: user.id }
        });

        res.status(201).json(user.toJSON());
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});

router.put('/users/:id', async (req, res) => {
    try {
        const { name, email, password, role, monthlyBuildLimit, isActive } = req.body;

        const existingUser = await userRepository.findById(req.params.id);
        if (!existingUser) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Check email uniqueness if changing email
        if (email && email !== existingUser.email) {
            const emailExists = await userRepository.findByEmail(email);
            if (emailExists) {
                return res.status(400).json({ error: 'Email já cadastrado por outro usuário' });
            }
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (password) updateData.password = password;
        if (role !== undefined) updateData.role = role;
        if (monthlyBuildLimit !== undefined) updateData.monthlyBuildLimit = monthlyBuildLimit;
        if (isActive !== undefined) updateData.isActive = isActive;

        const user = await userRepository.update(req.params.id, updateData);

        await activityLogRepository.create({
            userId: req.user.id,
            action: 'USER_UPDATED',
            description: `Admin atualizou usuário ${user.email}`,
            ipAddress: req.ip,
            metadata: { updatedUserId: user.id, changes: Object.keys(updateData) }
        });

        res.json(user.toJSON());
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        const user = await userRepository.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        if (user.id === req.user.id) {
            return res.status(400).json({ error: 'Você não pode deletar sua própria conta' });
        }

        await userRepository.delete(req.params.id);

        await activityLogRepository.create({
            userId: req.user.id,
            action: 'USER_DELETED',
            description: `Admin deletou usuário ${user.email}`,
            ipAddress: req.ip
        });

        res.json({ message: 'Usuário deletado com sucesso' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Erro ao deletar usuário' });
    }
});

// Builds Management
router.get('/builds', async (req, res) => {
    try {
        const builds = await buildRepository.findAll();
        res.json(builds);
    } catch (error) {
        console.error('Get builds error:', error);
        res.status(500).json({ error: 'Erro ao listar builds' });
    }
});

router.get('/builds/:id', async (req, res) => {
    try {
        const build = await buildRepository.findById(req.params.id);

        if (!build) {
            return res.status(404).json({ error: 'Build não encontrado' });
        }

        res.json(build);
    } catch (error) {
        console.error('Get build error:', error);
        res.status(500).json({ error: 'Erro ao buscar build' });
    }
});

// Activity Logs
router.get('/activity', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const activity = await activityLogRepository.findRecent(limit);
        res.json(activity);
    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({ error: 'Erro ao listar atividades' });
    }
});

module.exports = router;
