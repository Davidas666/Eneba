const { sql } = require('./dbConnection');
require('dotenv').config();

async function dropAndRecreate() {
    try {
        console.log('🔄 Pašalinamos senos lentelės...');

        // Drop tables in correct order (respecting foreign keys)
        await sql`DROP TABLE IF EXISTS order_items CASCADE`;
        await sql`DROP TABLE IF EXISTS orders CASCADE`;
        await sql`DROP TABLE IF EXISTS balance_history CASCADE`;
        await sql`DROP TABLE IF EXISTS user_balance CASCADE`;
        await sql`DROP TABLE IF EXISTS favorite_games CASCADE`;
        await sql`DROP TABLE IF EXISTS seller_ratings CASCADE`;
        await sql`DROP TABLE IF EXISTS cart_items CASCADE`;
        await sql`DROP TABLE IF EXISTS cart CASCADE`;
        await sql`DROP TABLE IF EXISTS cashback CASCADE`;
        await sql`DROP TABLE IF EXISTS discounts CASCADE`;
        await sql`DROP TABLE IF EXISTS game_listings CASCADE`;
        await sql`DROP TABLE IF EXISTS stock CASCADE`;
        await sql`DROP TABLE IF EXISTS prices CASCADE`;
        await sql`DROP TABLE IF EXISTS game_platforms CASCADE`;
        await sql`DROP TABLE IF EXISTS games CASCADE`;
        await sql`DROP TABLE IF EXISTS regions CASCADE`;
        await sql`DROP TABLE IF EXISTS platforms CASCADE`;
        await sql`DROP TABLE IF EXISTS users CASCADE`;
        await sql`DROP TABLE IF EXISTS roles CASCADE`;

        console.log('✅ Senos lentelės pašalintos');
        console.log('🚀 Kuriamos naujos lentelės...');

        // Enable extensions
        await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
        await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
        console.log('✅ Plėtiniai įjungti');

        // Create roles table
        await sql`
            CREATE TABLE roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Create users table
        await sql`
            CREATE TABLE users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255),
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                google_id VARCHAR(255) UNIQUE,
                oauth_provider VARCHAR(50),
                role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Create platforms table
        await sql`
            CREATE TABLE platforms (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Create regions table  
        await sql`
            CREATE TABLE regions (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                code VARCHAR(10) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Create games table (bendras produktas)
        await sql`
            CREATE TABLE games (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                title VARCHAR(255) NOT NULL,
                description TEXT,
                publisher VARCHAR(255),
                developer VARCHAR(255),
                release_date DATE,
                image_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Create indexes for fuzzy search
        await sql`CREATE INDEX games_title_trgm_idx ON games USING gin (title gin_trgm_ops)`;
        await sql`CREATE INDEX games_description_trgm_idx ON games USING gin (description gin_trgm_ops)`;

        // Create game_platforms (kokioms platformoms žaidimas prieinamas)
        await sql`
            CREATE TABLE game_platforms (
                game_id UUID REFERENCES games(id) ON DELETE CASCADE,
                platform_id INTEGER REFERENCES platforms(id) ON DELETE CASCADE,
                PRIMARY KEY (game_id, platform_id)
            )
        `;

        // Create game_listings (pardavėjų skelbimai - čia yra kaina, regionas, atsargos)
        await sql`
            CREATE TABLE game_listings (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                game_id UUID REFERENCES games(id) ON DELETE CASCADE,
                seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
                platform_id INTEGER REFERENCES platforms(id) ON DELETE CASCADE,
                region_id INTEGER REFERENCES regions(id) ON DELETE CASCADE,
                price DECIMAL(10, 2) NOT NULL,
                discount_percentage DECIMAL(5, 2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
                currency VARCHAR(3) DEFAULT 'EUR',
                stock INTEGER NOT NULL DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await sql`CREATE INDEX game_listings_game_idx ON game_listings(game_id)`;
        await sql`CREATE INDEX game_listings_seller_idx ON game_listings(seller_id)`;

        // Create discounts table (nuolaidos susietos su listing)
        await sql`
            CREATE TABLE discounts (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                listing_id UUID REFERENCES game_listings(id) ON DELETE CASCADE,
                discount_percentage DECIMAL(5, 2) NOT NULL,
                start_date TIMESTAMP NOT NULL,
                end_date TIMESTAMP NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Create cart table (pirkinių krepšelis)
        await sql`
            CREATE TABLE cart (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Create cart_items table
        await sql`
            CREATE TABLE cart_items (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                cart_id UUID REFERENCES cart(id) ON DELETE CASCADE,
                listing_id UUID REFERENCES game_listings(id) ON DELETE CASCADE,
                quantity INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(cart_id, listing_id)
            )
        `;

        // Create cashback table
        await sql`
            CREATE TABLE cashback (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                listing_id UUID REFERENCES game_listings(id) ON DELETE CASCADE,
                amount DECIMAL(10, 2) NOT NULL,
                percentage DECIMAL(5, 2),
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Create seller_ratings table
        await sql`
            CREATE TABLE seller_ratings (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                rating DECIMAL(3, 2) CHECK (rating >= 1.00 AND rating <= 10.00),
                review TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(seller_id, user_id)
            )
        `;

        // Create favorite_games table (tracks favorites per listing)
        await sql`
            CREATE TABLE favorite_games (
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                listing_id UUID REFERENCES game_listings(id) ON DELETE CASCADE,
                game_id UUID REFERENCES games(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, listing_id)
            )
        `;
        await sql`CREATE INDEX favorite_games_listing_idx ON favorite_games(listing_id)`;
        await sql`CREATE INDEX favorite_games_game_idx ON favorite_games(game_id)`;

        // Create user_balance table
        await sql`
            CREATE TABLE user_balance (
                user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                balance DECIMAL(10, 2) DEFAULT 0.00,
                currency VARCHAR(3) DEFAULT 'EUR',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Create balance_history table
        await sql`
            CREATE TABLE balance_history (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                amount DECIMAL(10, 2) NOT NULL,
                type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'purchase', 'refund', 'cashback')),
                description TEXT,
                balance_before DECIMAL(10, 2),
                balance_after DECIMAL(10, 2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await sql`CREATE INDEX balance_history_user_idx ON balance_history(user_id)`;
        await sql`CREATE INDEX balance_history_created_idx ON balance_history(created_at DESC)`;

        // Create orders table (apsipirkimų istorija)
        await sql`
            CREATE TABLE orders (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                total_amount DECIMAL(10, 2) NOT NULL,
                payment_method VARCHAR(50) DEFAULT 'balance',
                status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await sql`CREATE INDEX orders_user_idx ON orders(user_id)`;
        await sql`CREATE INDEX orders_status_idx ON orders(status)`;
        await sql`CREATE INDEX orders_created_idx ON orders(created_at DESC)`;

        // Create order_items table
        await sql`
            CREATE TABLE order_items (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
                listing_id UUID REFERENCES game_listings(id) ON DELETE SET NULL,
                game_title VARCHAR(255) NOT NULL,
                platform_name VARCHAR(100),
                region_name VARCHAR(100),
                quantity INTEGER DEFAULT 1,
                price_at_purchase DECIMAL(10, 2) NOT NULL,
                activation_key TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await sql`CREATE INDEX order_items_order_idx ON order_items(order_id)`;

        console.log('✅ Visos lentelės sukurtos');

        // Insert default data
        await sql`
            INSERT INTO roles (name) 
            VALUES ('buyer'), ('seller'), ('admin')
        `;

        await sql`
            INSERT INTO platforms (name) 
            VALUES 
                ('PC'), 
                ('PlayStation 5'), 
                ('PlayStation 4'), 
                ('Xbox Series X/S'), 
                ('Xbox One'), 
                ('Nintendo Switch'), 
                ('Steam'), 
                ('Epic Games'),
                ('GOG'),
                ('Rockstar Games')
        `;

        await sql`
            INSERT INTO regions (name, code) 
            VALUES 
                ('Global', 'GLOBAL'),
                ('Europe', 'EU'),
                ('United States', 'US'),
                ('United Kingdom', 'UK'),
                ('Asia', 'ASIA'),
                ('Russia', 'RU'),
                ('Argentina', 'AR'),
                ('Turkey', 'TR')
        `;

        // Insert sample games
        const games = await sql`
            INSERT INTO games (title, description, publisher, developer, release_date, image_url) 
            VALUES 
                ('Red Dead Redemption 2', 'Epic tale of life in America at the dawn of the modern age.', 'Rockstar Games', 'Rockstar Studios', '2018-10-26', 'https://image.api.playstation.com/vulcan/ap/rnd/202010/2618/Y0bU6vBN1kjTGr4n4MeFVH4H.png'),
                ('Cyberpunk 2077', 'Open-world, action-adventure story set in Night City.', 'CD Projekt', 'CD Projekt RED', '2020-12-10', 'https://image.api.playstation.com/vulcan/ap/rnd/202111/3013/cKZ4tKNFj9C00coP3D5lQL3s.png'),
                ('The Witcher 3: Wild Hunt', 'Story-driven open world RPG set in a visually stunning fantasy universe.', 'CD Projekt', 'CD Projekt RED', '2015-05-19', 'https://image.api.playstation.com/cdn/UP4497/CUSA00527_00/Hpl5MtwQgOVF9vJqlfui6SDB5Jl4oBSq.png'),
                ('Grand Theft Auto V', 'Action-adventure game played from either a third-person or first-person perspective.', 'Rockstar Games', 'Rockstar North', '2013-09-17', 'https://image.api.playstation.com/vulcan/ap/rnd/202202/2816/t5bC5vZQR8PKGgCkPdkdZBjY.png'),
                ('Elden Ring', 'Action role-playing game developed by FromSoftware.', 'Bandai Namco', 'FromSoftware', '2022-02-25', 'https://image.api.playstation.com/vulcan/ap/rnd/202110/2000/aGhopp3MHppi7kooGE2Dtt8C.png'),
                ('Hogwarts Legacy', 'Open-world action RPG set in the Harry Potter universe.', 'Warner Bros', 'Avalanche Software', '2023-02-10', 'https://image.api.playstation.com/vulcan/ap/rnd/202208/1210/qwVcJLbVtKLK6I1qdFoVBXjc.png'),
                ('God of War', 'Action-adventure game based on Norse mythology.', 'Sony Interactive', 'Santa Monica Studio', '2018-04-20', 'https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xJ8XB3bi888QTLZYdl7Oi0s.png'),
                ('Minecraft', 'Sandbox video game with creative and survival modes.', 'Mojang Studios', 'Mojang Studios', '2011-11-18', 'https://image.api.playstation.com/vulcan/ap/rnd/202105/2517/rK0FvqFXzk3LQXqBYIFDcZA7.png'),
                ('FIFA 24', 'Football simulation video game.', 'EA Sports', 'EA Vancouver', '2023-09-29', 'https://image.api.playstation.com/vulcan/ap/rnd/202305/1210/HoKKJdK9KVSK3OTfb1AKfIPK.png'),
                ('Call of Duty: Modern Warfare III', 'First-person shooter video game.', 'Activision', 'Sledgehammer Games', '2023-11-10', 'https://image.api.playstation.com/vulcan/ap/rnd/202305/2420/dQQCjH6OAJbXcx0ZYWMfCG4W.png')
            RETURNING id, title
        `;

        // Create test users (sellers and buyers)
        const hashedPassword = '$argon2id$v=19$m=65536,t=3,p=4$wFnE5fYE0YEDhFPGMjW+ng$9yKfB/jL6PbqNKWK7S7xKZD2bOL0aHGl8vKLvf5bQ7o'; // "password123"
        
        const users = await sql`
            INSERT INTO users (email, password, first_name, last_name, role_id, is_active) 
            VALUES 
                ('seller1@eneba.com', ${hashedPassword}, 'John', 'Seller', 2, true),
                ('seller2@eneba.com', ${hashedPassword}, 'Jane', 'Smith', 2, true),
                ('seller3@eneba.com', ${hashedPassword}, 'Mike', 'Johnson', 2, true)
            RETURNING id
        `;

        // Create game_platform associations
        for (const game of games) {
            if (game.title.includes('Red Dead') || game.title.includes('GTA')) {
                await sql`
                    INSERT INTO game_platforms (game_id, platform_id)
                    VALUES 
                        (${game.id}, 1),  -- PC
                        (${game.id}, 2),  -- PS5
                        (${game.id}, 3),  -- PS4
                        (${game.id}, 4),  -- Xbox Series X/S
                        (${game.id}, 5)   -- Xbox One
                `;
            } else if (game.title.includes('God of War')) {
                await sql`
                    INSERT INTO game_platforms (game_id, platform_id)
                    VALUES 
                        (${game.id}, 1),  -- PC
                        (${game.id}, 2),  -- PS5
                        (${game.id}, 3)   -- PS4
                `;
            } else {
                await sql`
                    INSERT INTO game_platforms (game_id, platform_id)
                    VALUES 
                        (${game.id}, 1),  -- PC
                        (${game.id}, 2),  -- PS5
                        (${game.id}, 3),  -- PS4
                        (${game.id}, 4),  -- Xbox Series X/S
                        (${game.id}, 5),  -- Xbox One
                        (${game.id}, 6)   -- Nintendo Switch
                `;
            }
        }

        // Create game listings with various prices and regions
        for (const game of games) {
            const basePrice = Math.floor(Math.random() * 40) + 20; // 20-60 EUR
            
            // Each game gets multiple listings from different sellers and regions
            const regions = [1, 2, 3, 4]; // Global, EU, US, UK
            const platforms = [1, 7, 8]; // PC, Steam, Epic Games
            
            for (let i = 0; i < 3; i++) {
                const seller = users[i % users.length];
                const region = regions[i % regions.length];
                const platform = platforms[i % platforms.length];
                const priceVariation = Math.random() * 10 - 5; // -5 to +5 EUR
                const finalPrice = Math.max(basePrice + priceVariation, 10);
                const hasDiscount = Math.random() > 0.6;
                const discount = hasDiscount ? Math.floor(Math.random() * 30) + 10 : 0; // 10-40%
                
                await sql`
                    INSERT INTO game_listings (game_id, seller_id, platform_id, region_id, price, discount_percentage, stock, is_active)
                    VALUES (
                        ${game.id},
                        ${seller.id},
                        ${platform},
                        ${region},
                        ${finalPrice.toFixed(2)},
                        ${discount},
                        ${Math.floor(Math.random() * 50) + 10},
                        true
                    )
                `;
            }
        }

        console.log('✅ Numatyti duomenys įterpti');
        console.log('✅ Sukurta 10 žaidimų su ~30 skelbimais');

        console.log('\n🎉 Nauja duomenų bazės struktūra sukurta!');
        console.log('\n📊 Architektūra:');
        console.log('   1. games - bendri produktai (pvz "RDR2")');
        console.log('   2. game_listings - pardavėjų skelbimai su:');
        console.log('      - kaina, regionu, platforma, atsargomis');
        console.log('   3. cart + cart_items - pirkinių krepšelis');
        console.log('   4. user_balance - vartotojų balansas pirkimams');
        console.log('   5. balance_history - balanso papildymų/naudojimų istorija');
        console.log('   6. orders + order_items - apsipirkimų istorija');
        console.log('   7. Paieška: ieškant "rdr2" rodomi visi listings');
        console.log('   8. Filtrai: pagal platformą, regioną, kainą');

    } catch (error) {
        console.error('❌ Klaida:', error);
        throw error;
    } finally {
        await sql.end();
        process.exit(0);
    }
}

dropAndRecreate();
