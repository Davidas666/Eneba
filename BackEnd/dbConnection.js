const postgres = require('postgres');
require('dotenv').config();

const sql = postgres({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? 'require' : false
});

// Test connection
const testConnection = async () => {
    try {
        await sql`SELECT 1 AS result`;
        console.log("Successful connection to database");
    } catch (error) {
        console.error("Connection to database failed:", error);
        throw error;
    }
};

module.exports = {sql, testConnection};