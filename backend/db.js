// ============================================================
// TypeRush — Database Configuration & Pool
// ============================================================

require('dotenv').config();

const mysql = require('mysql2/promise');

const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Root@1234',
    database: process.env.DB_NAME || 'typerush',
    port: process.env.DB_PORT || 3306
};

// Create a pool (handles multiple connections efficiently)
const pool = mysql.createPool({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
    port: config.port,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,   // queue requests when all connections are busy
    connectionLimit: 10,        // max simultaneous connections
    queueLimit: 0               // unlimited queue length
});

// Attach config to pool so setup-db can access it if needed
pool.dbConfig = config;

module.exports = pool;
