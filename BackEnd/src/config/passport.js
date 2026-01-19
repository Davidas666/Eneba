const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { getUserByEmail, getUserById, getRoleIdByName } = require('../models/userModel');
const { sql } = require('../../dbConnection');

// Serialize user for the session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await getUserById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user exists by Google ID
        const [existingUser] = await sql`
            SELECT 
                u.id,
                u.email,
                u.first_name,
                u.last_name,
                u.google_id,
                u.oauth_provider,
                u.is_active,
                u.created_at,
                r.name as role_name,
                r.id as role_id
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.google_id = ${profile.id}
        `;

        if (existingUser) {
            // User exists, return it
            return done(null, existingUser);
        }

        // Check if user exists by email
        const userByEmail = await getUserByEmail(profile.emails[0].value);
        
        if (userByEmail) {
            // Link Google account to existing user
            const [updatedUser] = await sql`
                UPDATE users
                SET 
                    google_id = ${profile.id},
                    oauth_provider = 'google'
                WHERE id = ${userByEmail.id}
                RETURNING 
                    id,
                    email,
                    first_name,
                    last_name,
                    google_id,
                    oauth_provider,
                    is_active,
                    created_at
            `;
            
            return done(null, {
                ...updatedUser,
                role_name: userByEmail.role_name,
                role_id: userByEmail.role_id
            });
        }

        // Create new user
        const roleId = await getRoleIdByName('buyer'); // Default role for Google users
        
        const [newUser] = await sql`
            INSERT INTO users (
                email,
                first_name,
                last_name,
                google_id,
                oauth_provider,
                role_id
            )
            VALUES (
                ${profile.emails[0].value},
                ${profile.name.givenName || ''},
                ${profile.name.familyName || ''},
                ${profile.id},
                'google',
                ${roleId}
            )
            RETURNING 
                id,
                email,
                first_name,
                last_name,
                google_id,
                oauth_provider,
                is_active,
                created_at
        `;

        // Create user balance
        await sql`
            INSERT INTO user_balance (user_id, balance)
            VALUES (${newUser.id}, 0.00)
        `;

        // Create user cart
        await sql`
            INSERT INTO cart (user_id)
            VALUES (${newUser.id})
        `;

        const role = await sql`SELECT name FROM roles WHERE id = ${roleId}`;
        
        return done(null, {
            ...newUser,
            role_name: role[0]?.name,
            role_id: roleId
        });

    } catch (error) {
        return done(error, null);
    }
}));

module.exports = passport;
