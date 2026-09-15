module.exports = {
    name: '009_update_builds_status_column',

    async up(connection) {
        await connection.execute(`
            ALTER TABLE builds MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending'
        `);
        console.log('✅ Table builds status column updated to VARCHAR(50)');
    },

    async down(connection) {
        await connection.execute(`
            ALTER TABLE builds MODIFY COLUMN status ENUM('pending', 'building', 'completed', 'failed') DEFAULT 'pending'
        `);
        console.log('❌ Table builds status column reverted');
    }
};
