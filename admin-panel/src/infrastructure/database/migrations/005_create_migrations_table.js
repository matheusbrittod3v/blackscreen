module.exports = {
    name: '005_create_migrations_table',

    async up(connection) {
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Table migrations created');
    },

    async down(connection) {
        await connection.execute('DROP TABLE IF EXISTS migrations');
        console.log('❌ Table migrations dropped');
    }
};
