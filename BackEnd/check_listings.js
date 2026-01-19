const { sql } = require('./dbConnection');

async function checkListings() {
    try {
        const listings = await sql`
            SELECT id, game_id, price 
            FROM game_listings 
            WHERE id = ${'c5e856e7-a29d-4bc2-8035-9bfb487722d9'}
        `;
        
        console.log('Found listings:', listings);
        
        if (listings.length === 0) {
            console.log('\n❌ No listing found with this ID!');
            console.log('Checking first 5 listings:');
            const allListings = await sql`
                SELECT id, game_id, price 
                FROM game_listings 
                LIMIT 5
            `;
            console.log(allListings);
        }
        
        await sql.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkListings();
