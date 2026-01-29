const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || '62.146.173.88',
    port: parseInt(process.env.DB_PORT) || 3349,
    user: process.env.DB_USER || 'mysql',
    password: process.env.DB_PASSWORD || '36q27ozGTYelFUPjzEcA',
    database: process.env.DB_NAME || 'black',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool = null;

async function getConnection() {
    if (!pool) {
        pool = mysql.createPool(dbConfig);
    }
    return pool;
}

async function query(sql, params = []) {
    const connection = await getConnection();
    const [results] = await connection.query(sql, params);
    return results;
}

async function transaction(callback) {
    const connection = await getConnection();
    const conn = await connection.getConnection();
    try {
        await conn.beginTransaction();
        const result = await callback(conn);
        await conn.commit();
        return result;
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

module.exports = {
    getConnection,
    query,
    transaction,
    dbConfig
};
