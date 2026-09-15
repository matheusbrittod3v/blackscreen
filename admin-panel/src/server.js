const express = require('express');
const cors = require('cors');
const path = require('path');
const { runMigrations } = require('./infrastructure/database/migrations/runner');

const app = express();
const host = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.PORT, 10) || 80;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const buildRoutes = require('./routes/build');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/build', buildRoutes);

// SPA fallback - serve index.html for all non-API routes
app.get('{*splat}', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// Initialize database and start server
async function start() {
    try {
        // Run migrations on startup
        const { getConnection } = require('./config/database');
        const pool = await getConnection();
        const connection = await pool.getConnection();

        // Ensure migrations table exists
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Run pending migrations
        const migrations = [
            require('./infrastructure/database/migrations/001_create_users_table'),
            require('./infrastructure/database/migrations/002_create_builds_table'),
            require('./infrastructure/database/migrations/003_create_sessions_table'),
            require('./infrastructure/database/migrations/004_create_activity_logs_table'),
        ];

        const [executed] = await connection.execute('SELECT name FROM migrations');
        const executedNames = executed.map(row => row.name);

        for (const migration of migrations) {
            if (!executedNames.includes(migration.name)) {
                console.log(`⏳ Running migration: ${migration.name}`);
                await migration.up(connection);
                await connection.execute('INSERT INTO migrations (name) VALUES (?)', [migration.name]);
                console.log(`✅ Migration ${migration.name} completed`);
            }
        }

        connection.release();
        console.log('✅ Database connected and migrated');

        app.listen(port, host, () => {
            console.log(`\n🚀 Black Tool Admin Panel running at http://${host}:${port} (http://localhost:${port})`);
            console.log(`\n📝 Default credentials:`);
            console.log(`   Admin: admin@blacktool.com / admin123`);
            console.log(`   User:  user@blacktool.com / user123\n`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

start();
