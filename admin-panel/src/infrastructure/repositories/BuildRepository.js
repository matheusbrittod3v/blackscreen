const { query } = require('../../config/database');
const Build = require('../../domain/entities/Build');

class BuildRepository {
    async findById(id) {
        const rows = await query('SELECT * FROM builds WHERE id = ?', [id]);
        if (rows.length === 0) return null;
        return Build.fromDatabase(rows[0]);
    }

    async findByUserId(userId, options = {}) {
        let sql = 'SELECT * FROM builds WHERE user_id = ?';
        const params = [userId];

        if (options.status) {
            sql += ' AND status = ?';
            params.push(options.status);
        }

        sql += ' ORDER BY created_at DESC';

        if (options.limit) {
            sql += ' LIMIT ?';
            params.push(Number(options.limit));
        }

        const rows = await query(sql, params);
        return rows.map(row => Build.fromDatabase(row));
    }

    async findAll(options = {}) {
        let sql = `
            SELECT builds.*, users.name as user_name, users.email as user_email 
            FROM builds 
            LEFT JOIN users ON builds.user_id = users.id
        `;
        const params = [];
        const conditions = [];

        if (options.userId) {
            conditions.push('builds.user_id = ?');
            params.push(options.userId);
        }

        if (options.status) {
            conditions.push('builds.status = ?');
            params.push(options.status);
        }

        if (options.month && options.year) {
            conditions.push('MONTH(builds.created_at) = ? AND YEAR(builds.created_at) = ?');
            params.push(options.month, options.year);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY builds.created_at DESC';

        if (options.limit) {
            sql += ' LIMIT ?';
            params.push(Number(options.limit));
        }

        const rows = await query(sql, params);
        return rows.map(row => ({
            ...Build.fromDatabase(row),
            userName: row.user_name,
            userEmail: row.user_email
        }));
    }

    async create(buildData) {
        const result = await query(
            `INSERT INTO builds (user_id, build_name, password_used, custom_message, logo_type, status) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                buildData.userId,
                buildData.buildName || null,
                buildData.passwordUsed || null,
                buildData.customMessage || null,
                buildData.logoType || 'png',
                buildData.status || 'pending'
            ]
        );

        return this.findById(result.insertId);
    }

    async update(id, buildData) {
        const updates = [];
        const params = [];

        if (buildData.status !== undefined) {
            updates.push('status = ?');
            params.push(buildData.status);
        }

        if (buildData.fileSize !== undefined) {
            updates.push('file_size = ?');
            params.push(buildData.fileSize);
        }

        if (buildData.downloadCount !== undefined) {
            updates.push('download_count = ?');
            params.push(buildData.downloadCount);
        }

        if (buildData.completedAt !== undefined) {
            updates.push('completed_at = ?');
            params.push(buildData.completedAt);
        }

        if (updates.length === 0) return this.findById(id);

        params.push(id);
        await query(`UPDATE builds SET ${updates.join(', ')} WHERE id = ?`, params);

        return this.findById(id);
    }

    async incrementDownload(id) {
        await query('UPDATE builds SET download_count = download_count + 1 WHERE id = ?', [id]);
        return this.findById(id);
    }

    async countByUserThisMonth(userId) {
        const result = await query(`
            SELECT COUNT(*) as total FROM builds 
            WHERE user_id = ? 
            AND MONTH(created_at) = MONTH(CURRENT_DATE()) 
            AND YEAR(created_at) = YEAR(CURRENT_DATE())
        `, [userId]);
        return result[0].total;
    }

    async countAll() {
        const result = await query('SELECT COUNT(*) as total FROM builds');
        return result[0].total;
    }

    async countThisMonth() {
        const result = await query(`
            SELECT COUNT(*) as total FROM builds 
            WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) 
            AND YEAR(created_at) = YEAR(CURRENT_DATE())
        `);
        return result[0].total;
    }

    async getRecentBuilds(limit = 5) {
        return this.findAll({ limit });
    }

    async getMonthlyStats() {
        const result = await query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
            FROM builds 
            WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month DESC
        `);
        return result;
    }

    async getUserBuildStats() {
        const result = await query(`
            SELECT 
                users.id,
                users.name,
                users.email,
                users.monthly_build_limit,
                COUNT(builds.id) as total_builds,
                SUM(CASE WHEN MONTH(builds.created_at) = MONTH(CURRENT_DATE()) 
                    AND YEAR(builds.created_at) = YEAR(CURRENT_DATE()) THEN 1 ELSE 0 END) as builds_this_month
            FROM users 
            LEFT JOIN builds ON users.id = builds.user_id
            WHERE users.role = 'user'
            GROUP BY users.id
            ORDER BY builds_this_month DESC
        `);
        return result;
    }
}

module.exports = new BuildRepository();
