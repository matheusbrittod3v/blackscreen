module.exports = {
    name: '003_create_sessions_table',

    async up(connection) {
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                token VARCHAR(512) NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Table sessions created');
    },

    async down(connection) {
        await connection.execute('DROP TABLE IF EXISTS sessions');
        console.log('❌ Table sessions dropped');
    }
};
