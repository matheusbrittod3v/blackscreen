const { query } = require('../../config/database');

class ActivityLogRepository {
    async create(logData) {
        const result = await query(
            `INSERT INTO activity_logs (user_id, action, description, ip_address, metadata) 
             VALUES (?, ?, ?, ?, ?)`,
            [
                logData.userId || null,
                logData.action,
                logData.description || null,
                logData.ipAddress || null,
                logData.metadata ? JSON.stringify(logData.metadata) : null
            ]
        );
        return result.insertId;
    }

    async findRecent(limit = 20) {
        const rows = await query(`
            SELECT activity_logs.*, users.name as user_name, users.email as user_email
            FROM activity_logs
            LEFT JOIN users ON activity_logs.user_id = users.id
            ORDER BY activity_logs.created_at DESC
            LIMIT ?
        `, [Number(limit)]);

        return rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            userName: row.user_name,
            userEmail: row.user_email,
            action: row.action,
            description: row.description,
            ipAddress: row.ip_address,
            metadata: row.metadata ? JSON.parse(row.metadata) : null,
            createdAt: row.created_at
        }));
    }

    async findByUserId(userId, limit = 10) {
        const rows = await query(`
            SELECT * FROM activity_logs
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        `, [userId, Number(limit)]);

        return rows.map(row => ({
            id: row.id,
            action: row.action,
            description: row.description,
            ipAddress: row.ip_address,
            metadata: row.metadata ? JSON.parse(row.metadata) : null,
            createdAt: row.created_at
        }));
    }

    async countByAction(days = 7) {
        const result = await query(`
            SELECT action, COUNT(*) as count
            FROM activity_logs
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY action
            ORDER BY count DESC
        `, [Number(days)]);
        return result;
    }

    async getDailyStats(days = 7) {
        const result = await query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total,
                COUNT(DISTINCT user_id) as unique_users
            FROM activity_logs
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `, [Number(days)]);
        return result;
    }
}

module.exports = new ActivityLogRepository();
