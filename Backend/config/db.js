const mysql = require('mysql2/promise');
const logger = require('../common/utils/logger');

const requiredDatabaseEnv = ['DB_HOST', 'DB_USER', 'DB_DATABASE'];
const missingDatabaseEnv = requiredDatabaseEnv.filter((key) => !process.env[key]);

if (missingDatabaseEnv.length > 0) {
    logger.warn('Database configuration is incomplete', {
        missingKeys: missingDatabaseEnv
    });
}

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    typeCast: function (field, next) {
        if (field.type === 'DATE') {
            return field.string();
        }
        return next();
    }
});

(async () => {
    try {
        const connection = await db.getConnection();
        connection.release();
        // logger.info('Database pool initialized successfully');
    } catch (error) {
        logger.error('Database connection initialization failed', {
            error: error.message
        });
    }
})();

module.exports = db;