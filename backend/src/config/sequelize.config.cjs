require('dotenv').config();

module.exports = {
    development: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        seederStorage: 'sequelize',
        migrationStorage: 'sequelize',
        logging: console.log,
    },
    test: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: `${process.env.DB_NAME}_test`,
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
    },
    production: {
        use_env_variable: 'DATABASE_URL',
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false, // For most managed PostgreSQL services
            },
        },
        pool: {
            max: 10,
            min: 2,
            acquire: 30000,
            idle: 10000,
        },
        seederStorage: 'sequelize',
        migrationStorage: 'sequelize',
        logging: false,
    },
};
