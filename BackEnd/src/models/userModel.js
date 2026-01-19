const { sql } = require("../../dbConnection");

exports.getUserByEmail = async (email) => {
    const [user] = await sql`
        SELECT 
            u.id,
            u.email,
            u.password,
            u.first_name,
            u.last_name,
            u.is_active,
            u.created_at,
            r.name as role_name,
            r.id as role_id
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.email = ${email}
    `;
    return user;
};

exports.createUser = async (newUser) => {
    const { email, password, firstName, lastName, roleId } = newUser;
    
    const [user] = await sql`
        INSERT INTO users (email, password, first_name, last_name, role_id)
        VALUES (${email}, ${password}, ${firstName}, ${lastName}, ${roleId})
        RETURNING id, email, first_name, last_name, role_id, is_active, created_at
    `;
    return user;
};

exports.getUserById = async (id) => {
    const [user] = await sql`
        SELECT 
            u.id,
            u.email,
            u.first_name,
            u.last_name,
            u.is_active,
            u.created_at,
            r.name as role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = ${id}
    `;
    return user;
};

exports.getRoleIdByName = async (roleName) => {
    const [role] = await sql`
        SELECT id FROM roles WHERE name = ${roleName}
    `;
    return role?.id;
};

exports.createUserBalance = async (userId) => {
    await sql`
        INSERT INTO user_balance (user_id, balance)
        VALUES (${userId}, 0.00)
    `;
};

exports.createUserCart = async (userId) => {
    const [cart] = await sql`
        INSERT INTO cart (user_id)
        VALUES (${userId})
        RETURNING id
    `;
    return cart;
};