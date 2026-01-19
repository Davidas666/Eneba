const { sql } = require('../dbConnection');

(async () => {
    try {
        console.log('🔍 Checking favorite_games table...');
        const columns = await sql`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'favorite_games'
        `;

        const hasListingColumn = columns.some((col) => col.column_name === 'listing_id');

        if (!hasListingColumn) {
            console.log('➕ Adding listing_id column...');
            await sql`ALTER TABLE favorite_games ADD COLUMN listing_id UUID`;
        } else {
            console.log('✅ listing_id column already exists. Skipping add.');
        }

        console.log('🧹 Removing duplicate rows (user_id + game_id)...');
        await sql`
            DELETE FROM favorite_games fg
            USING favorite_games dup
            WHERE fg.ctid < dup.ctid
              AND fg.user_id = dup.user_id
              AND fg.game_id = dup.game_id
        `;

        console.log('🗺️ Backfilling listing_id values...');
        await sql`
            WITH preferred_listings AS (
                SELECT DISTINCT ON (gl.game_id)
                    gl.game_id,
                    gl.id as listing_id
                FROM game_listings gl
                WHERE gl.is_active = true
                ORDER BY gl.game_id, gl.created_at ASC
            )
            UPDATE favorite_games fg
            SET listing_id = pl.listing_id
            FROM preferred_listings pl
            WHERE fg.game_id = pl.game_id
              AND fg.listing_id IS NULL
        `;

        console.log('🧽 Cleaning rows without a listing match...');
        await sql`DELETE FROM favorite_games WHERE listing_id IS NULL`;

        console.log('🔧 Updating constraints...');
        await sql`ALTER TABLE favorite_games DROP CONSTRAINT IF EXISTS favorite_games_pkey`;
        await sql`
            ALTER TABLE favorite_games
            ADD CONSTRAINT favorite_games_pkey PRIMARY KEY (user_id, listing_id)
        `;

        console.log('🔗 Ensuring foreign keys...');
        await sql`
            ALTER TABLE favorite_games
            DROP CONSTRAINT IF EXISTS favorite_games_listing_id_fkey
        `;
        await sql`
            ALTER TABLE favorite_games
            ADD CONSTRAINT favorite_games_listing_id_fkey
            FOREIGN KEY (listing_id) REFERENCES game_listings(id) ON DELETE CASCADE
        `;

        console.log('📈 Creating helpful indexes...');
        await sql`CREATE INDEX IF NOT EXISTS favorite_games_listing_idx ON favorite_games(listing_id)`;
        await sql`CREATE INDEX IF NOT EXISTS favorite_games_game_idx ON favorite_games(game_id)`;

        console.log('✅ Migration complete!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await sql.end();
    }
})();
