const { sql } = require("../../dbConnection");

// Add listing to favorites
exports.addToFavorites = async (userId, listingId) => {
    const [listing] = await sql`
        SELECT id, game_id
        FROM game_listings
        WHERE id = ${listingId}
    `;
    
    if (!listing) {
        throw new Error('Listing not found');
    }
    
    const [favorite] = await sql`
        INSERT INTO favorite_games (user_id, listing_id, game_id)
        VALUES (${userId}, ${listing.id}, ${listing.game_id})
        ON CONFLICT (user_id, listing_id) DO NOTHING
        RETURNING *
    `;

    return favorite;
};

// Remove listing from favorites
exports.removeFromFavorites = async (userId, listingId) => {
    const [favorite] = await sql`
        DELETE FROM favorite_games
        WHERE user_id = ${userId} AND listing_id = ${listingId}
        RETURNING *
    `;

    return favorite;
};

// Get user's favorite games
exports.getUserFavorites = async (userId) => {
    const favorites = await sql`
        SELECT 
            fg.listing_id,
            fg.created_at as added_at,
            gl.game_id,
            g.title,
            g.description,
            g.publisher,
            g.developer,
            g.release_date,
            g.image_url,
            gl.price,
            gl.discount_percentage,
            ROUND(gl.price * (1 - COALESCE(gl.discount_percentage, 0) / 100), 2) as discounted_price,
            ROUND(gl.price * (1 - COALESCE(gl.discount_percentage, 0) / 100) * 0.09, 2) as cashback,
            gl.stock,
            gl.platform_id,
            gl.region_id,
            p.name as platform_name,
            r.name as region_name,
            COALESCE(fgc.count, 0) as wishlist_count
        FROM favorite_games fg
        JOIN game_listings gl ON fg.listing_id = gl.id
        JOIN games g ON gl.game_id = g.id
        JOIN platforms p ON gl.platform_id = p.id
        JOIN regions r ON gl.region_id = r.id
        LEFT JOIN (
            SELECT listing_id, COUNT(*) as count
            FROM favorite_games
            GROUP BY listing_id
        ) fgc ON fg.listing_id = fgc.listing_id
        WHERE fg.user_id = ${userId}
        ORDER BY fg.created_at DESC
    `;
    return favorites;
};

// Check if listing is in user's favorites
exports.isFavorite = async (userId, listingId) => {
    const [result] = await sql`
        SELECT EXISTS(
            SELECT 1 FROM favorite_games
            WHERE user_id = ${userId} AND listing_id = ${listingId}
        ) as is_favorite
    `;
    return result?.is_favorite || false;
};
