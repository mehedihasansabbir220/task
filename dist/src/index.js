"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const knex_1 = __importDefault(require("knex"));
const app = (0, express_1.default)();
app.get('/', (req, res) => {
    res.send('Hello, world!');
});
const knexInstance = (0, knex_1.default)({
    client: 'mysql2',
    connection: {
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'mydatabase',
    },
});
app.listen(3000, () => {
    console.log('Server listening on port 3000');
});
//# sourceMappingURL=index.js.map