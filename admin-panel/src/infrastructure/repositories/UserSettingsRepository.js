const { query } = require('../../config/database');

class UserSettingsRepository {
    async findByUserId(userId) {
        const rows = await query('SELECT * FROM user_settings WHERE user_id = ?', [userId]);
        if (rows.length === 0) {
            return {
                userId,
                correctPassword: '',
                customMessage: '',
                logoPng: null,
                logoIco: null,
                logoGif: null
            };
        }
        const row = rows[0];
        return {
            userId: row.user_id,
            correctPassword: row.correct_password || '',
            customMessage: row.custom_message || '',
            logoPng: row.logo_png,
            logoIco: row.logo_ico,
            logoGif: row.logo_gif,
            updatedAt: row.updated_at
        };
    }

    async upsert(userId, data) {
        const existing = await query('SELECT user_id FROM user_settings WHERE user_id = ?', [userId]);
        if (existing.length === 0) {
            await query(
                `INSERT INTO user_settings (user_id, correct_password, custom_message, logo_png, logo_ico, logo_gif)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    data.correctPassword || '',
                    data.customMessage || '',
                    data.logoPng || null,
                    data.logoIco || null,
                    data.logoGif || null
                ]
            );
        } else {
            const updates = [];
            const params = [];

            if (data.correctPassword !== undefined) {
                updates.push('correct_password = ?');
                params.push(data.correctPassword);
            }
            if (data.customMessage !== undefined) {
                updates.push('custom_message = ?');
                params.push(data.customMessage);
            }
            if (data.logoPng !== undefined) {
                updates.push('logo_png = ?');
                params.push(data.logoPng);
            }
            if (data.logoIco !== undefined) {
                updates.push('logo_ico = ?');
                params.push(data.logoIco);
            }
            if (data.logoGif !== undefined) {
                updates.push('logo_gif = ?');
                params.push(data.logoGif);
            }

            if (updates.length > 0) {
                params.push(userId);
                await query(`UPDATE user_settings SET ${updates.join(', ')} WHERE user_id = ?`, params);
            }
        }

        return this.findByUserId(userId);
    }
}

module.exports = new UserSettingsRepository();
