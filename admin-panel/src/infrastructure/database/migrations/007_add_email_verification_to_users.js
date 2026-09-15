module.exports = {
    name: '007_add_email_verification_to_users',

    async up(connection) {
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
        `);
        const colNames = columns.map(c => c.COLUMN_NAME);

        if (!colNames.includes('email_verified')) {
            await connection.execute(`
                ALTER TABLE users 
                ADD COLUMN email_verified BOOLEAN DEFAULT FALSE
            `);
        }

        if (!colNames.includes('verification_token')) {
            await connection.execute(`
                ALTER TABLE users 
                ADD COLUMN verification_token VARCHAR(255) NULL
            `);
        }

        if (!colNames.includes('verification_token_expires')) {
            await connection.execute(`
                ALTER TABLE users 
                ADD COLUMN verification_token_expires TIMESTAMP NULL
            `);
        }

        // Ensure all existing accounts remain verified
        await connection.execute(`
            UPDATE users SET email_verified = TRUE WHERE email_verified IS FALSE OR email_verified IS NULL
        `);

        console.log('✅ Email verification columns added to users table');
    },

    async down(connection) {
        // No-op or drop columns
    }
};
