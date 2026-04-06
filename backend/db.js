const oracledb = require('oracledb');
require('dotenv').config();

async function initializePool() {
    try {
        await oracledb.createPool({
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            connectString: `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_SID}`,
            poolMin: 2,
            poolMax: 10,
            poolIncrement: 2
        });
        console.log('Oracle connection pool created.');
    } catch (err) {
        console.error('Failed to create Oracle connection pool', err);
        process.exit(1);
    }
}

async function getConnection() {
    return await oracledb.getConnection();
}

module.exports = {
    initializePool,
    getConnection
};
