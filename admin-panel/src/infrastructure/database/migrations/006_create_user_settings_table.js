module.exports = {
    name: '006_create_user_settings_table',

    async up(connection) {
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS user_settings (
                user_id INT PRIMARY KEY,
                correct_password VARCHAR(255) DEFAULT '',
                custom_message TEXT,
                logo_png VARCHAR(255) DEFAULT NULL,
                logo_ico VARCHAR(255) DEFAULT NULL,
                logo_gif VARCHAR(255) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Table user_settings created');
    },

    async down(connection) {
        await connection.execute('DROP TABLE IF EXISTS user_settings');
        console.log('❌ Table user_settings dropped');
    }
};
