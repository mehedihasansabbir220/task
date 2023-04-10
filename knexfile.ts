import { Knex } from 'knex';

const config: Knex.Config = {
    client: 'mysql2',
    connection: {
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'mydatabase',
    },
};

export default config;
