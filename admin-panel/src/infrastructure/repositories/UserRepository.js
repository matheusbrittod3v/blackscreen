const { query } = require('../../config/database');
const User = require('../../domain/entities/User');
const bcrypt = require('bcryptjs');

class UserRepository {
    async findById(id) {
        const rows = await query('SELECT * FROM users WHERE id = ?', [id]);
        if (rows.length === 0) return null;
        return User.fromDatabase(rows[0]);
    }

    async findByEmail(email) {
        const rows = await query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) return null;
        return User.fromDatabase(rows[0]);
    }

    async findAll(options = {}) {
        let sql = 'SELECT * FROM users';
        const params = [];
        const conditions = [];

        if (options.role) {
            conditions.push('role = ?');
            params.push(options.role);
        }

        if (options.isActive !== undefined) {
            conditions.push('is_active = ?');
            params.push(options.isActive ? 1 : 0);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY created_at DESC';

        if (options.limit) {
            sql += ' LIMIT ?';
            params.push(Number(options.limit));
        }

        const rows = await query(sql, params);
        return rows.map(row => User.fromDatabase(row));
    }

    async create(userData) {
        const hashedPassword = await bcrypt.hash(userData.password, 12);

        const result = await query(
            `INSERT INTO users (name, email, password, role, monthly_build_limit, is_active) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                userData.name,
                userData.email,
                hashedPassword,
                userData.role || 'user',
                userData.monthlyBuildLimit || 5,
                userData.isActive !== false ? 1 : 0
            ]
        );

        return this.findById(result.insertId);
    }

    async update(id, userData) {
        const updates = [];
        const params = [];

        if (userData.name !== undefined) {
            updates.push('name = ?');
            params.push(userData.name);
        }

        if (userData.email !== undefined) {
            updates.push('email = ?');
            params.push(userData.email);
        }

        if (userData.password !== undefined) {
            const hashedPassword = await bcrypt.hash(userData.password, 12);
            updates.push('password = ?');
            params.push(hashedPassword);
        }

        if (userData.role !== undefined) {
            updates.push('role = ?');
            params.push(userData.role);
        }

        if (userData.monthlyBuildLimit !== undefined) {
            updates.push('monthly_build_limit = ?');
            params.push(userData.monthlyBuildLimit);
        }

        if (userData.isActive !== undefined) {
            updates.push('is_active = ?');
            params.push(userData.isActive ? 1 : 0);
        }

        if (updates.length === 0) return this.findById(id);

        params.push(id);
        await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

        return this.findById(id);
    }

    async delete(id) {
        await query('DELETE FROM users WHERE id = ?', [id]);
        return true;
    }

    async validatePassword(user, password) {
        return bcrypt.compare(password, user.password);
    }

    async countAll() {
        const result = await query('SELECT COUNT(*) as total FROM users');
        return result[0].total;
    }

    async countByRole(role) {
        const result = await query('SELECT COUNT(*) as total FROM users WHERE role = ?', [role]);
        return result[0].total;
    }

    async getRecentUsers(limit = 5) {
        const rows = await query('SELECT * FROM users ORDER BY created_at DESC LIMIT ?', [Number(limit)]);
        return rows.map(row => User.fromDatabase(row));
    }
}

module.exports = new UserRepository();
