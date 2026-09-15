const bcrypt = require('bcryptjs');

module.exports = {
    name: '008_seed_default_admin',

    async up(connection) {
        const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@blacktool.com';
        const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
        const adminName = process.env.DEFAULT_ADMIN_NAME || 'Administrador Master';

        // Check if admin already exists
        const [rows] = await connection.execute(
            'SELECT id FROM users WHERE email = ? OR role = ? LIMIT 1',
            [adminEmail, 'admin']
        );

        if (rows.length === 0) {
            const hashedPassword = await bcrypt.hash(adminPassword, 12);
            await connection.execute(
                `INSERT INTO users (name, email, password, role, monthly_build_limit, is_active, email_verified)
                 VALUES (?, ?, ?, 'admin', 9999, TRUE, TRUE)`,
                [adminName, adminEmail, hashedPassword]
            );
            console.log(`✅ Default admin account created: ${adminEmail}`);
        } else {
            console.log('ℹ️ Admin account already exists. Skipping seed.');
        }
    },

    async down(connection) {
        const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@blacktool.com';
        await connection.execute('DELETE FROM users WHERE email = ? AND role = ?', [adminEmail, 'admin']);
        console.log('❌ Default admin seed reverted');
    }
};
