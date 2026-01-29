module.exports = {
    name: '004_create_activity_logs_table',

    async up(connection) {
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                action VARCHAR(100) NOT NULL,
                description TEXT,
                ip_address VARCHAR(45),
                metadata JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Table activity_logs created');
    },

    async down(connection) {
        await connection.execute('DROP TABLE IF EXISTS activity_logs');
        console.log('❌ Table activity_logs dropped');
    }
};
