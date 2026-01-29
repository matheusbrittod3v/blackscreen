const { query } = require('../../../config/database');
const bcrypt = require('bcryptjs');

async function seed() {
    console.log('🌱 Starting database seeding...\n');

    try {
        // Check if admin exists
        const existingAdmin = await query('SELECT id FROM users WHERE email = ?', ['admin@blacktool.com']);

        if (existingAdmin.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 12);

            await query(
                `INSERT INTO users (name, email, password, role, monthly_build_limit, is_active) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                ['Administrador', 'admin@blacktool.com', hashedPassword, 'admin', 999, true]
            );

            console.log('✅ Admin user created:');
            console.log('   📧 Email: admin@blacktool.com');
            console.log('   🔐 Password: admin123\n');
        } else {
            console.log('⏭️  Admin user already exists, skipping...\n');
        }

        // Create demo user
        const existingUser = await query('SELECT id FROM users WHERE email = ?', ['user@blacktool.com']);

        if (existingUser.length === 0) {
            const hashedPassword = await bcrypt.hash('user123', 12);

            await query(
                `INSERT INTO users (name, email, password, role, monthly_build_limit, is_active) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                ['Usuário Demo', 'user@blacktool.com', hashedPassword, 'user', 5, true]
            );

            console.log('✅ Demo user created:');
            console.log('   📧 Email: user@blacktool.com');
            console.log('   🔐 Password: user123\n');
        } else {
            console.log('⏭️  Demo user already exists, skipping...\n');
        }

        console.log('🎉 Database seeding completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
