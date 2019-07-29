// ============================
// Server Port
// ============================
process.env.PORT = process.env.PORT || 3000;

// ============================
// Environment
// ============================
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// ============================
// Vencimiento del token
// ============================
// + Unidades de tiempo en https://github.com/zeit/ms
// + Unidades númericas en segundos no funcionan a tráves de la variable env
// + Para evitar usar refresh token se usará un access token duradero
process.env.ACCESS_TOKEN_EXPIRATION = '1y'; // 1 año
process.env.REFRESH_TOKEN_EXPIRATION = '30 days'; // 30 días

// ============================
// SEED de autenticación
// ============================
process.env.SEED = process.env.SEED || 'app-secret-seed';

// ============================
//  Auth0 Credentials
// ============================
const auth0 = {
    CLIENT_ID: 1,
    DOMAIN: 2
};

// ============================
//  Postgres Database
// ============================
// + user: usuario de la base de datos ('postgres' es el usuario por defecto en postgres).
// + host: ip del host de la base de datos. La ip local es 'localhost' o 127.0.0.1.
// + database: nombre de la base de datos.
// + password: clave del usuario de la base de datos (vacío por defecto en postgres).
// + port: puerto de la base de datos (5432 es el puerto por defecto en postgres).
const database = {
    'production': {
        user: 'fdbdasbdabs',
        host: 'ec2-23-23-23.compute1.amazonaws.com',
        database: 'production_db',
        password: 'process.env.DB_PASSWORD',
        port: 5432
    },
    'development': {
        user: 'postgres', 
        host: 'localhost', 
        database: 'crsoq_db', 
        password: '0812', 
        port: 5432
    }
};

module.exports = database[process.env.NODE_ENV] || database['development'];
