const { sql } = require('../dbConnection');

async function addDiscountColumn() {
    try {
        console.log('🔄 Pridedamas discount_percentage stulpelis į game_listings lentelę...');

        // Add discount_percentage column if it doesn't exist
        await sql`
            ALTER TABLE game_listings 
            ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5, 2) DEFAULT 0 
            CHECK (discount_percentage >= 0 AND discount_percentage <= 100)
        `;

        console.log('✅ discount_percentage stulpelis sėkmingai pridėtas!');
        console.log('📊 Dabar visi listingai turi discount_percentage = 0 pagal nutylėjimą');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Klaida pridedant discount_percentage stulpelį:', error);
        process.exit(1);
    }
}

addDiscountColumn();
