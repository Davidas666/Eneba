const { sql } = require('../dbConnection');

async function addGoogleOAuthColumns() {
    try {
        console.log('🔄 Pridedami Google OAuth stulpeliai į users lentelę...');

        // Add google_id column
        await sql`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE
        `;

        // Add oauth_provider column
        await sql`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50)
        `;

        // Make password optional for OAuth users
        await sql`
            ALTER TABLE users 
            ALTER COLUMN password DROP NOT NULL
        `;

        console.log('✅ Google OAuth stulpeliai sėkmingai pridėti!');
        console.log('   - google_id (unique)');
        console.log('   - oauth_provider');
        console.log('   - password (dabar optional)');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Klaida pridedant Google OAuth stulpelius:', error);
        process.exit(1);
    }
}

addGoogleOAuthColumns();
