module.exports = {
    name: '002_create_builds_table',

    async up(connection) {
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS builds (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                build_name VARCHAR(255),
                password_used VARCHAR(255),
                custom_message TEXT,
                logo_type ENUM('png', 'gif', 'ico') DEFAULT 'png',
                status ENUM('pending', 'building', 'completed', 'failed') DEFAULT 'pending',
                file_size BIGINT DEFAULT 0,
                download_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Table builds created');
    },

    async down(connection) {
        await connection.execute('DROP TABLE IF EXISTS builds');
        console.log('❌ Table builds dropped');
    }
};
