const { getConnection } = require('../../../config/database');
const path = require('path');
const fs = require('fs');

const migrations = [
    require('./005_create_migrations_table'),
    require('./001_create_users_table'),
    require('./002_create_builds_table'),
    require('./003_create_sessions_table'),
    require('./004_create_activity_logs_table'),
    require('./006_create_user_settings_table'),
    require('./007_add_email_verification_to_users'),
];

async function ensureMigrationsTable(connection) {
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
}

async function getExecutedMigrations(connection) {
    try {
        const [rows] = await connection.execute('SELECT name FROM migrations');
        return rows.map(row => row.name);
    } catch (error) {
        return [];
    }
}

async function runMigrations() {
    console.log('🚀 Starting migrations...\n');

    const pool = await getConnection();
    const connection = await pool.getConnection();

    try {
        await ensureMigrationsTable(connection);
        const executed = await getExecutedMigrations(connection);

        for (const migration of migrations) {
            if (!executed.includes(migration.name)) {
                console.log(`⏳ Running migration: ${migration.name}`);
                await migration.up(connection);
                await connection.execute(
                    'INSERT INTO migrations (name) VALUES (?)',
                    [migration.name]
                );
                console.log(`✅ Migration ${migration.name} completed\n`);
            } else {
                console.log(`⏭️  Skipping migration: ${migration.name} (already executed)`);
            }
        }

        console.log('\n🎉 All migrations completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        connection.release();
        process.exit(0);
    }
}

// Run if called directly
if (require.main === module) {
    runMigrations();
}

module.exports = { runMigrations };
