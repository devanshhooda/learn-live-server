require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const userController = require('./controllers/userController');
const port = process.env.PORT;
const cors = require('cors');
const database = require('./database');
const server = express();


server.use(morgan('dev'));
server.use(cors());
server.use(express.urlencoded({ extended: true }));
server.use(express.json());
server.use('/api/user', userController);

server.all(
    '/',
    (req, res) => {
        return res.json({
            status: true,
            message: 'Welcome to learn live server'
        });
    }
);

server.listen(port, () => {
    console.log(`Server running at : http://localhost:${port}`);
});