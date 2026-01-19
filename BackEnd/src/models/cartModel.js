const { sql } = require("../../dbConnection");

// Get or create user's cart
exports.getOrCreateCart = async (userId) => {
    const [cart] = await sql`
        INSERT INTO cart (user_id)
        VALUES (${userId})
        ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
        RETURNING *
    `;
    return cart;
};

// Get user's cart with items
exports.getCartWithItems = async (userId) => {
    const items = await sql`
        SELECT 
            ci.id as cart_item_id,
            ci.quantity,
            ci.created_at as added_at,
            gl.id as listing_id,
            gl.price,
            gl.discount_percentage,
            ROUND(gl.price * (1 - COALESCE(gl.discount_percentage, 0) / 100), 2) as discounted_price,
            ROUND(gl.price * (1 - COALESCE(gl.discount_percentage, 0) / 100) * 0.09, 2) as cashback,
            gl.stock,
            g.id as game_id,
            g.title as game_title,
            g.image_url,
            p.name as platform_name,
            r.name as region_name,
            r.code as region_code,
            u.first_name as seller_first_name,
            u.last_name as seller_last_name,
            (ci.quantity * ROUND(gl.price * (1 - COALESCE(gl.discount_percentage, 0) / 100), 2)) as subtotal,
            (ci.quantity * ROUND(gl.price * (1 - COALESCE(gl.discount_percentage, 0) / 100) * 0.09, 2)) as total_cashback
        FROM cart c
        JOIN cart_items ci ON c.id = ci.cart_id
        JOIN game_listings gl ON ci.listing_id = gl.id
        JOIN games g ON gl.game_id = g.id
        JOIN platforms p ON gl.platform_id = p.id
        JOIN regions r ON gl.region_id = r.id
        JOIN users u ON gl.seller_id = u.id
        WHERE c.user_id = ${userId}
        ORDER BY ci.created_at DESC
    `;
    
    // Calculate total
    const total = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
    const totalCashback = items.reduce((sum, item) => sum + parseFloat(item.total_cashback), 0);
    
    return {
        items,
        total,
        totalCashback: parseFloat(totalCashback.toFixed(2)),
        itemCount: items.length,
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0)
    };
};

// Add item to cart (or increment quantity)
exports.addItemToCart = async (userId, listingId, quantity = 1) => {
    // Get or create cart
    const cart = await this.getOrCreateCart(userId);
    
    // Check if item already exists in cart
    const [existing] = await sql`
        SELECT * FROM cart_items
        WHERE cart_id = ${cart.id} AND listing_id = ${listingId}
    `;
    
    if (existing) {
        // Update quantity
        const [item] = await sql`
            UPDATE cart_items
            SET quantity = quantity + ${quantity}
            WHERE cart_id = ${cart.id} AND listing_id = ${listingId}
            RETURNING *
        `;
        return item;
    } else {
        // Insert new item
        const [item] = await sql`
            INSERT INTO cart_items (cart_id, listing_id, quantity)
            VALUES (${cart.id}, ${listingId}, ${quantity})
            RETURNING *
        `;
        return item;
    }
};

// Update item quantity
exports.updateItemQuantity = async (userId, listingId, quantity) => {
    const cart = await this.getOrCreateCart(userId);
    
    if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        return await this.removeItemFromCart(userId, listingId);
    }
    
    const [item] = await sql`
        UPDATE cart_items
        SET quantity = ${quantity}
        WHERE cart_id = ${cart.id} AND listing_id = ${listingId}
        RETURNING *
    `;
    return item;
};

// Remove item from cart
exports.removeItemFromCart = async (userId, listingId) => {
    const cart = await this.getOrCreateCart(userId);
    
    const [item] = await sql`
        DELETE FROM cart_items
        WHERE cart_id = ${cart.id} AND listing_id = ${listingId}
        RETURNING *
    `;
    return item;
};

// Clear entire cart
exports.clearCart = async (userId) => {
    const cart = await this.getOrCreateCart(userId);
    
    await sql`
        DELETE FROM cart_items
        WHERE cart_id = ${cart.id}
    `;
    
    return { message: 'Cart cleared' };
};

// Get cart item count
exports.getCartCount = async (userId) => {
    const [result] = await sql`
        SELECT 
            COUNT(ci.id) as item_count,
            COALESCE(SUM(ci.quantity), 0) as total_quantity
        FROM cart c
        LEFT JOIN cart_items ci ON c.id = ci.cart_id
        WHERE c.user_id = ${userId}
        GROUP BY c.id
    `;
    
    return result || { item_count: 0, total_quantity: 0 };
};
