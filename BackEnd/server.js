const app = require("./app");
const { sql, testConnection } = require("./dbConnection");
require('dotenv').config();

const port = process.env.PORT || 5000;

(async () => {
    try {
        await testConnection();

        app.listen(port, () => {
            console.log(`Serveris paleistas: http://localhost:${port}`);
        });
    } catch (error) {
        console.error("Nepavyko paleisti serverio:", error);
        process.exit(1); 
    }
})();

process.on('SIGINT', async () => {
    console.log("Uždaromas ryšys su duomenų baze...");
    await sql.end();
    process.exit(0); 
});