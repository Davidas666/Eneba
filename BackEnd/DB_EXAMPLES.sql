-- ENEBA MARKETPLACE - Duomenų bazės architektūros pavyzdžiai

-- ============================================
-- KAIP VEIKIA SISTEMA
-- ============================================

-- 1. ŽAIDIMO PRIDĖJIMAS (admin/moderatorius prideda bendrą produktą)
INSERT INTO games (title, description, publisher, developer, release_date, image_url)
VALUES (
    'Red Dead Redemption 2',
    'Epic western action-adventure game',
    'Rockstar Games',
    'Rockstar Studios',
    '2018-10-26',
    'https://example.com/rdr2.jpg'
);

-- 2. PARDAVĖJAS PRIDEDA SAVO SKELBIMĄ (listing)
-- Pardavėjas turi turėti seller role
INSERT INTO game_listings (game_id, seller_id, platform_id, region_id, price, stock)
VALUES (
    'game-uuid-here',          -- RDR2 game ID
    'seller-uuid-here',        -- Pardavėjo ID
    7,                         -- Steam platform
    2,                         -- Europe region
    29.99,                     -- Kaina
    50                         -- Atsargos
);

-- ============================================
-- PAIEŠKA: Vartotojas įrašo "rdr2"
-- ============================================

-- Fuzzy search randa žaidimą pagal pavadinimą
-- Tada ištraukia VISUS to žaidimo listings

SELECT 
    g.id as game_id,
    g.title,
    g.description,
    g.image_url,
    gl.id as listing_id,
    gl.price,
    gl.currency,
    gl.stock,
    p.name as platform,
    r.name as region,
    r.code as region_code,
    u.first_name || ' ' || u.last_name as seller_name,
    u.email as seller_email,
    (SELECT AVG(rating) FROM seller_ratings WHERE seller_id = u.id) as seller_rating,
    CASE 
        WHEN d.discount_percentage IS NOT NULL 
        THEN gl.price * (1 - d.discount_percentage / 100)
        ELSE gl.price 
    END as final_price,
    d.discount_percentage
FROM games g
INNER JOIN game_listings gl ON g.id = gl.game_id
INNER JOIN platforms p ON gl.platform_id = p.id
INNER JOIN regions r ON gl.region_id = r.id
INNER JOIN users u ON gl.seller_id = u.id
LEFT JOIN discounts d ON gl.id = d.listing_id 
    AND d.is_active = true 
    AND CURRENT_TIMESTAMP BETWEEN d.start_date AND d.end_date
WHERE 
    g.title ILIKE '%rdr2%'  -- Arba naudojant fuzzy search: similarity(g.title, 'rdr2') > 0.3
    AND gl.is_active = true
    AND gl.stock > 0
ORDER BY final_price ASC;  -- Rodyti pigiausius pirma


-- ============================================
-- REZULTATAS: Vartotojas mato sąrašą tokį kaip:
-- ============================================
/*
Red Dead Redemption 2 - Steam (EU) - €29.99 - Seller: John Doe (4.8★) - Stock: 50
Red Dead Redemption 2 - Steam (US) - €34.99 - Seller: Jane Smith (4.5★) - Stock: 20
Red Dead Redemption 2 - Rockstar (Global) - €39.99 - Seller: GameShop (4.9★) - Stock: 100
Red Dead Redemption 2 - Epic Games (RU) - €15.99 - Seller: CheapKeys (3.8★) - Stock: 5
*/


-- ============================================
-- FILTRAVIMAS
-- ============================================

-- Filtruoti pagal platformą
WHERE g.title ILIKE '%rdr2%' AND gl.platform_id = 7  -- Tik Steam

-- Filtruoti pagal regioną  
WHERE g.title ILIKE '%rdr2%' AND gl.region_id = 2    -- Tik Europe

-- Filtruoti pagal kainą
WHERE g.title ILIKE '%rdr2%' AND gl.price BETWEEN 20 AND 35

-- Kombinuoti filtrus
WHERE g.title ILIKE '%rdr2%' 
    AND gl.platform_id IN (7, 8)  -- Steam arba Epic
    AND gl.region_id = 1          -- Global
    AND gl.price < 40
ORDER BY gl.price ASC;


-- ============================================
-- VIENO ŽAIDIMO PUSLAPIS
-- ============================================

-- Rodyti visus pardavėjų pasiūlymus vienam žaidimui
SELECT 
    gl.id as listing_id,
    gl.price,
    gl.currency,
    gl.stock,
    p.name as platform,
    r.name as region,
    u.first_name || ' ' || u.last_name as seller_name,
    (SELECT AVG(rating) FROM seller_ratings WHERE seller_id = u.id) as avg_rating,
    (SELECT COUNT(*) FROM seller_ratings WHERE seller_id = u.id) as rating_count
FROM game_listings gl
INNER JOIN platforms p ON gl.platform_id = p.id
INNER JOIN regions r ON gl.region_id = r.id
INNER JOIN users u ON gl.seller_id = u.id
WHERE gl.game_id = 'specific-game-uuid'
    AND gl.is_active = true
    AND gl.stock > 0
ORDER BY gl.price ASC;


-- ============================================
-- KREPŠELIS (CART)
-- ============================================

-- Pridėti į krepšelį
-- 1. Sukurti/gauti vartotojo cart
INSERT INTO cart (user_id) 
VALUES ('user-uuid-here')
ON CONFLICT (user_id) DO NOTHING
RETURNING id;

-- 2. Pridėti listing į krepšelį
INSERT INTO cart_items (cart_id, listing_id, quantity)
VALUES ('cart-uuid', 'listing-uuid', 1)
ON CONFLICT (cart_id, listing_id) 
DO UPDATE SET quantity = cart_items.quantity + 1;

-- 3. Peržiūrėti krepšelį
SELECT 
    ci.id,
    ci.quantity,
    g.title as game_title,
    g.image_url,
    p.name as platform,
    r.name as region,
    gl.price,
    gl.currency,
    (gl.price * ci.quantity) as total_price
FROM cart_items ci
INNER JOIN game_listings gl ON ci.listing_id = gl.id
INNER JOIN games g ON gl.game_id = g.id
INNER JOIN platforms p ON gl.platform_id = p.id
INNER JOIN regions r ON gl.region_id = r.id
WHERE ci.cart_id = (SELECT id FROM cart WHERE user_id = 'user-uuid');


-- ============================================
-- PARDAVĖJO DASHBOARD
-- ============================================

-- Pardavėjo visi skelbimai
SELECT 
    g.title,
    gl.id,
    gl.price,
    gl.stock,
    p.name as platform,
    r.name as region,
    gl.is_active,
    gl.created_at
FROM game_listings gl
INNER JOIN games g ON gl.game_id = g.id
INNER JOIN platforms p ON gl.platform_id = p.id
INNER JOIN regions r ON gl.region_id = r.id
WHERE gl.seller_id = 'seller-uuid'
ORDER BY gl.created_at DESC;


-- ============================================
-- VARTOTOJO BALANSAS
-- ============================================

-- Sukurti balansą naujam vartotojui (automatiškai po registracijos)
INSERT INTO user_balance (user_id, balance)
VALUES ('user-uuid-here', 0.00)
ON CONFLICT (user_id) DO NOTHING;

-- Papildyti balansą
-- 1. Atnaujinti balansą
UPDATE user_balance 
SET balance = balance + 50.00,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = 'user-uuid-here'
RETURNING balance;

-- 2. Įrašyti į istoriją
INSERT INTO balance_history (user_id, amount, type, description, balance_before, balance_after)
VALUES (
    'user-uuid-here',
    50.00,
    'deposit',
    'Balanso papildymas per PayPal',
    (SELECT balance - 50.00 FROM user_balance WHERE user_id = 'user-uuid-here'),
    (SELECT balance FROM user_balance WHERE user_id = 'user-uuid-here')
);

-- Peržiūrėti balansą
SELECT balance, currency, updated_at
FROM user_balance
WHERE user_id = 'user-uuid-here';


-- ============================================
-- BALANSO ISTORIJA
-- ============================================

-- Viso vartotojo balanso pakeitimų istorija
SELECT 
    bh.id,
    bh.amount,
    bh.type,
    bh.description,
    bh.balance_before,
    bh.balance_after,
    bh.created_at,
    CASE 
        WHEN bh.type IN ('deposit', 'refund', 'cashback') THEN '+'
        ELSE '-'
    END as operation
FROM balance_history bh
WHERE bh.user_id = 'user-uuid-here'
ORDER BY bh.created_at DESC
LIMIT 50;

-- Filtruoti pagal tipą
SELECT * FROM balance_history
WHERE user_id = 'user-uuid-here' 
    AND type = 'deposit'
ORDER BY created_at DESC;


-- ============================================
-- PIRKIMO PROCESAS
-- ============================================

-- 1. Patikrinti ar užtenka balanso
SELECT 
    ub.balance,
    (SELECT SUM(gl.price * ci.quantity) 
     FROM cart_items ci
     INNER JOIN game_listings gl ON ci.listing_id = gl.id
     WHERE ci.cart_id = (SELECT id FROM cart WHERE user_id = 'user-uuid')) as cart_total
FROM user_balance ub
WHERE ub.user_id = 'user-uuid';

-- 2. Sukurti užsakymą
INSERT INTO orders (user_id, total_amount, payment_method, status)
VALUES ('user-uuid', 149.99, 'balance', 'completed')
RETURNING id;

-- 3. Pridėti užsakymo produktus
INSERT INTO order_items (order_id, listing_id, game_title, platform_name, region_name, quantity, price_at_purchase, activation_key)
SELECT 
    'order-uuid-here',
    gl.id,
    g.title,
    p.name,
    r.name,
    ci.quantity,
    gl.price,
    'XXXXX-XXXXX-XXXXX'  -- Generuojamas raktas
FROM cart_items ci
INNER JOIN game_listings gl ON ci.listing_id = gl.id
INNER JOIN games g ON gl.game_id = g.id
INNER JOIN platforms p ON gl.platform_id = p.id
INNER JOIN regions r ON gl.region_id = r.id
WHERE ci.cart_id = (SELECT id FROM cart WHERE user_id = 'user-uuid');

-- 4. Nuskaičiuoti balansą
UPDATE user_balance 
SET balance = balance - 149.99,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = 'user-uuid';

-- 5. Įrašyti į balanso istoriją
INSERT INTO balance_history (user_id, amount, type, description, balance_before, balance_after)
VALUES (
    'user-uuid',
    149.99,
    'purchase',
    'Užsakymas #order-uuid',
    (SELECT balance + 149.99 FROM user_balance WHERE user_id = 'user-uuid'),
    (SELECT balance FROM user_balance WHERE user_id = 'user-uuid')
);

-- 6. Sumažinti atsargas
UPDATE game_listings 
SET stock = stock - 1
WHERE id IN (SELECT listing_id FROM order_items WHERE order_id = 'order-uuid-here');

-- 7. Išvalyti krepšelį
DELETE FROM cart_items
WHERE cart_id = (SELECT id FROM cart WHERE user_id = 'user-uuid');


-- ============================================
-- APSIPIRKIMŲ ISTORIJA
-- ============================================

-- Vartotojo visi užsakymai
SELECT 
    o.id,
    o.total_amount,
    o.payment_method,
    o.status,
    o.created_at,
    COUNT(oi.id) as items_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.user_id = 'user-uuid'
GROUP BY o.id
ORDER BY o.created_at DESC;

-- Detali vieno užsakymo informacija
SELECT 
    o.id as order_id,
    o.total_amount,
    o.status,
    o.created_at,
    oi.game_title,
    oi.platform_name,
    oi.region_name,
    oi.quantity,
    oi.price_at_purchase,
    oi.activation_key
FROM orders o
INNER JOIN order_items oi ON o.id = oi.order_id
WHERE o.id = 'order-uuid-here';

-- Vieno užsakymo žaidimai
SELECT 
    oi.game_title,
    oi.platform_name,
    oi.region_name,
    oi.price_at_purchase,
    oi.activation_key,
    oi.created_at
FROM order_items oi
WHERE oi.order_id = 'order-uuid-here';

-- Statistika - kiek išleido vartotojas per paskutinius 30 dienų
SELECT 
    COUNT(*) as total_orders,
    SUM(total_amount) as total_spent,
    AVG(total_amount) as avg_order_value
FROM orders
WHERE user_id = 'user-uuid'
    AND status = 'completed'
    AND created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days';


-- ============================================
-- GRĄŽINIMAS (REFUND)
-- ============================================

-- 1. Pakeisti užsakymo statusą
UPDATE orders
SET status = 'refunded',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'order-uuid-here';

-- 2. Grąžinti balansą
UPDATE user_balance
SET balance = balance + 149.99,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = 'user-uuid';

-- 3. Įrašyti į balanso istoriją
INSERT INTO balance_history (user_id, amount, type, description, balance_before, balance_after)
VALUES (
    'user-uuid',
    149.99,
    'refund',
    'Grąžinimas už užsakymą #order-uuid',
    (SELECT balance - 149.99 FROM user_balance WHERE user_id = 'user-uuid'),
    (SELECT balance FROM user_balance WHERE user_id = 'user-uuid')
);


-- ============================================
-- CASHBACK SISTEMA
-- ============================================

-- Pridėti cashback po pirkimo (pvz 2%)
INSERT INTO cashback (user_id, listing_id, amount, percentage, status)
VALUES (
    'user-uuid',
    'listing-uuid',
    2.99,  -- 2% iš 149.99
    2.00,
    'pending'
);

-- Išmokėti cashback į balansą
-- 1. Atnaujinti balansą
UPDATE user_balance
SET balance = balance + 2.99
WHERE user_id = 'user-uuid';

-- 2. Pažymėti cashback kaip išmokėtą
UPDATE cashback
SET status = 'paid'
WHERE user_id = 'user-uuid' AND status = 'pending';

-- 3. Įrašyti į balanso istoriją
INSERT INTO balance_history (user_id, amount, type, description, balance_before, balance_after)
VALUES (
    'user-uuid',
    2.99,
    'cashback',
    'Cashback 2% už pirkimą',
    (SELECT balance - 2.99 FROM user_balance WHERE user_id = 'user-uuid'),
    (SELECT balance FROM user_balance WHERE user_id = 'user-uuid')
);

-- Viso vartotojo cashback
SELECT 
    SUM(amount) as total_cashback,
    COUNT(*) as cashback_count
FROM cashback
WHERE user_id = 'user-uuid'
    AND status = 'paid';
