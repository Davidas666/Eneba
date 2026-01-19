const { sql } = require("../../dbConnection");

// Create a new game (base product)
exports.createGame = async (gameData) => {
    const { title, description, publisher, developer, releaseDate, imageUrl, platformIds } = gameData;
    
    try {
        // Start transaction
        const result = await sql.begin(async sql => {
            // Insert game
            const [game] = await sql`
                INSERT INTO games (title, description, publisher, developer, release_date, image_url)
                VALUES (${title}, ${description}, ${publisher}, ${developer}, ${releaseDate}, ${imageUrl})
                RETURNING *
            `;

            // Insert game-platform relationships
            if (platformIds && platformIds.length > 0) {
                await sql`
                    INSERT INTO game_platforms (game_id, platform_id)
                    SELECT ${game.id}, platform_id
                    FROM UNNEST(${platformIds}::uuid[]) AS platform_id
                `;
            }

            return game;
        });

        return result;
    } catch (error) {
        throw error;
    }
};

// Create a game listing (seller offering)
exports.createListing = async (listingData) => {
    const { gameId, sellerId, platformId, regionId, price, stock, discountPercentage = 0, isActive = true } = listingData;
    
    const [listing] = await sql`
        INSERT INTO game_listings (game_id, seller_id, platform_id, region_id, price, discount_percentage, stock, is_active)
        VALUES (${gameId}, ${sellerId}, ${platformId}, ${regionId}, ${price}, ${discountPercentage}, ${stock}, ${isActive})
        RETURNING *
    `;
    return listing;
};

// Get all games with pagination
exports.getAllGames = async (limit = 20, offset = 0) => {
    const games = await sql`
        SELECT 
            g.*,
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object('id', p.id, 'name', p.name)
                ) FILTER (WHERE p.id IS NOT NULL),
                '[]'
            ) as platforms
        FROM games g
        LEFT JOIN game_platforms gp ON g.id = gp.game_id
        LEFT JOIN platforms p ON gp.platform_id = p.id
        GROUP BY g.id
        ORDER BY g.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
    `;
    return games;
};

// Get game by ID with all listings
exports.getGameById = async (gameId) => {
    const [game] = await sql`
        SELECT 
            g.*,
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object('id', p.id, 'name', p.name)
                ) FILTER (WHERE p.id IS NOT NULL),
                '[]'
            ) as platforms
        FROM games g
        LEFT JOIN game_platforms gp ON g.id = gp.game_id
        LEFT JOIN platforms p ON gp.platform_id = p.id
        WHERE g.id = ${gameId}
        GROUP BY g.id
    `;
    return game;
};

// Get all active listings from all sellers (for marketplace)
exports.getAllListings = async (searchQuery = null, limit = 50, offset = 0) => {
    let listings;
    
    if (searchQuery && searchQuery.trim().length > 0) {
        // With fuzzy search
        listings = await sql`
            SELECT 
                gl.id as listing_id,
                gl.price,
                gl.discount_percentage,
                ROUND(gl.price * (1 - COALESCE(gl.discount_percentage, 0) / 100), 2) as discounted_price,
                ROUND(gl.price * (1 - COALESCE(gl.discount_percentage, 0) / 100) * 0.09, 2) as cashback,
                gl.stock,
                gl.created_at as listed_at,
                g.id as game_id,
                g.title as game_title,
                g.description as game_description,
                g.publisher,
                g.developer,
                g.release_date,
                g.image_url,
                p.name as platform_name,
                r.name as region_name,
                r.code as region_code,
                u.id as seller_id,
                u.first_name as seller_first_name,
                u.last_name as seller_last_name,
                COALESCE(AVG(sr.rating), 0) as seller_rating,
                COALESCE(COUNT(DISTINCT sr.id), 0) as seller_reviews,
                COALESCE(COUNT(DISTINCT fg.user_id), 0) as wishlist_count,
                similarity(g.title, ${searchQuery}) as similarity_score
            FROM game_listings gl
            JOIN games g ON gl.game_id = g.id
            JOIN platforms p ON gl.platform_id = p.id
            JOIN regions r ON gl.region_id = r.id
            JOIN users u ON gl.seller_id = u.id
            LEFT JOIN seller_ratings sr ON gl.seller_id = sr.seller_id
            LEFT JOIN favorite_games fg ON gl.id = fg.listing_id
            WHERE gl.is_active = true 
              AND gl.stock > 0
              AND (g.title ILIKE ${`%${searchQuery}%`} OR g.title % ${searchQuery})
            GROUP BY gl.id, g.id, p.name, r.name, r.code, u.id, u.first_name, u.last_name
            ORDER BY similarity_score DESC, gl.price ASC
            LIMIT ${limit} OFFSET ${offset}
        `;
    } else {
        // Without search - all listings
        listings = await sql`
            SELECT 
                gl.id as listing_id,
                gl.price,
                gl.discount_percentage,
                ROUND(gl.price * (1 - COALESCE(gl.discount_percentage, 0) / 100), 2) as discounted_price,
                ROUND(gl.price * (1 - COALESCE(gl.discount_percentage, 0) / 100) * 0.09, 2) as cashback,
                gl.stock,
                gl.created_at as listed_at,
                g.id as game_id,
                g.title as game_title,
                g.description as game_description,
                g.publisher,
                g.developer,
                g.release_date,
                g.image_url,
                p.name as platform_name,
                r.name as region_name,
                r.code as region_code,
                u.id as seller_id,
                u.first_name as seller_first_name,
                u.last_name as seller_last_name,
                COALESCE(AVG(sr.rating), 0) as seller_rating,
                COALESCE(COUNT(DISTINCT sr.id), 0) as seller_reviews,
                COALESCE(COUNT(DISTINCT fg.user_id), 0) as wishlist_count
            FROM game_listings gl
            JOIN games g ON gl.game_id = g.id
            JOIN platforms p ON gl.platform_id = p.id
            JOIN regions r ON gl.region_id = r.id
            JOIN users u ON gl.seller_id = u.id
            LEFT JOIN seller_ratings sr ON gl.seller_id = sr.seller_id
            LEFT JOIN favorite_games fg ON gl.id = fg.listing_id
            WHERE gl.is_active = true AND gl.stock > 0
            GROUP BY gl.id, g.id, p.name, r.name, r.code, u.id, u.first_name, u.last_name
            ORDER BY gl.created_at DESC, gl.price ASC
            LIMIT ${limit} OFFSET ${offset}
        `;
    }
    
    return listings;
};

// Get listings for a game
exports.getGameListings = async (gameId) => {
    const listings = await sql`
        SELECT 
            gl.*,
            ROUND(gl.price * (1 - COALESCE(gl.discount_percentage, 0) / 100), 2) as discounted_price,
            ROUND(gl.price * (1 - COALESCE(gl.discount_percentage, 0) / 100) * 0.09, 2) as cashback,
            p.name as platform_name,
            r.name as region_name,
            u.email as seller_email,
            u.first_name as seller_first_name,
            u.last_name as seller_last_name,
            COALESCE(AVG(sr.rating), 0) as seller_rating,
            COALESCE(COUNT(sr.id), 0) as seller_reviews
        FROM game_listings gl
        JOIN platforms p ON gl.platform_id = p.id
        JOIN regions r ON gl.region_id = r.id
        JOIN users u ON gl.seller_id = u.id
        LEFT JOIN seller_ratings sr ON gl.seller_id = sr.seller_id
        WHERE gl.game_id = ${gameId} AND gl.is_active = true AND gl.stock > 0
        GROUP BY gl.id, p.name, r.name, u.email, u.first_name, u.last_name
        ORDER BY gl.price ASC
    `;
    return listings;
};

// Search games with fuzzy matching
exports.searchGames = async (query, limit = 20) => {
    const games = await sql`
        SELECT 
            g.*,
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object('id', p.id, 'name', p.name)
                ) FILTER (WHERE p.id IS NOT NULL),
                '[]'
            ) as platforms,
            similarity(g.title, ${query}) as similarity_score
        FROM games g
        LEFT JOIN game_platforms gp ON g.id = gp.game_id
        LEFT JOIN platforms p ON gp.platform_id = p.id
        WHERE g.title ILIKE ${`%${query}%`}
           OR g.title % ${query}
        GROUP BY g.id
        ORDER BY similarity_score DESC, g.created_at DESC
        LIMIT ${limit}
    `;
    return games;
};

// Get seller's listings
exports.getSellerListings = async (sellerId) => {
    const listings = await sql`
        SELECT 
            gl.*,
            ROUND(gl.price * (1 - COALESCE(gl.discount_percentage, 0) / 100), 2) as discounted_price,
            ROUND(gl.price * (1 - COALESCE(gl.discount_percentage, 0) / 100) * 0.09, 2) as cashback,
            g.title as game_title,
            g.image_url as game_image,
            p.name as platform_name,
            r.name as region_name
        FROM game_listings gl
        JOIN games g ON gl.game_id = g.id
        JOIN platforms p ON gl.platform_id = p.id
        JOIN regions r ON gl.region_id = r.id
        WHERE gl.seller_id = ${sellerId}
        ORDER BY gl.created_at DESC
    `;
    return listings;
};

// Update listing
exports.updateListing = async (listingId, sellerId, updateData) => {
    const { price, stock, discountPercentage, isActive } = updateData;
    
    const [listing] = await sql`
        UPDATE game_listings
        SET 
            price = COALESCE(${price}, price),
            stock = COALESCE(${stock}, stock),
            discount_percentage = COALESCE(${discountPercentage}, discount_percentage),
            is_active = COALESCE(${isActive}, is_active),
            updated_at = NOW()
        WHERE id = ${listingId} AND seller_id = ${sellerId}
        RETURNING *
    `;
    return listing;
};

// Delete listing
exports.deleteListing = async (listingId, sellerId) => {
    const [listing] = await sql`
        DELETE FROM game_listings
        WHERE id = ${listingId} AND seller_id = ${sellerId}
        RETURNING *
    `;
    return listing;
};

// Get all platforms
exports.getAllPlatforms = async () => {
    const platforms = await sql`
        SELECT * FROM platforms ORDER BY name ASC
    `;
    return platforms;
};

// Get all regions
exports.getAllRegions = async () => {
    const regions = await sql`
        SELECT * FROM regions ORDER BY name ASC
    `;
    return regions;
};

// Find platform by ID, name, or code
exports.findPlatform = async (identifier) => {
    const [platform] = await sql`
        SELECT * FROM platforms 
        WHERE id::text = ${identifier} 
           OR LOWER(name) = LOWER(${identifier})
        LIMIT 1
    `;
    return platform;
};

// Find region by ID, name, or code
exports.findRegion = async (identifier) => {
    const [region] = await sql`
        SELECT * FROM regions 
        WHERE id::text = ${identifier} 
           OR LOWER(code) = LOWER(${identifier})
           OR LOWER(name) = LOWER(${identifier})
        LIMIT 1
    `;
    return region;
};
