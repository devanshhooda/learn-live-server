require('dotenv').config();
const router = require('express').Router();
const bycryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

const userModel = require('../models/userModel');

router.all('/', (req, res) => {
    return res.json({
        status: true,
        message: 'Welcome to userController of learn live server'
    });
});

router.post('/create',
    // form validation
    [
        check('phoneNumber').isMobilePhone(),
        check('password').not().isEmpty().trim().escape()
    ],
    (req, res) => {
        const errors = validationResult(req);

        // if there is any form validation error
        if (!errors.isEmpty()) {
            return res.json({
                status: false,
                message: 'Form validation error !',
                errors: errors
            });
        }

        const phoneNumber = req.body.phoneNumber;
        const hashedPassword = bycryptjs.hashSync(req.body.password);

        const accessToken = jwt.sign({ phone: phoneNumber }, process.env.ACCESS_TOKEN_SECRET);

        userModel.create({
            phoneNumber: phoneNumber,
            password: hashedPassword,
        },
            (err, result) => {

                //checking for error
                if (err) {
                    return res.json({
                        status: false,
                        message: 'Insert failed !',
                        error: err
                    });
                }

                //if everything is fine
                return res.json({
                    status: true,
                    message: 'user created',
                    phoneNumber: req.body.phoneNumber,
                    password: hashedPassword,
                    token: accessToken
                });
            }
        );
    }
);

router.put('/update',
    (req, res) => {
        if (!req.query.phoneNumber) {
            return res.json({
                status: false,
                message: 'Phone number is not provided !'
            });
        }

        const authHeader = req.headers['authorization'];

        const token = authHeader && authHeader.split(' ')[1];

        // check if token is null
        if (token == null) {
            return res.json({
                status: false,
                message: 'Token is null !'
            });
        }

        // if token is provided, then verify
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
                // if token doesn'y matches
                return res.json({
                    status: false,
                    message: 'Invalid token !',
                    error: err
                });
            }

            // token matched
            userModel.findOneAndUpdate(
                { phoneNumber: req.query.phoneNumber }, req.body,
                (err, result) => {

                    // if there is any problem in updating data in db
                    if (err) {
                        return res.json({
                            status: false,
                            message: 'DB updation failed !',
                            error: err
                        });
                    }

                    // db updated 
                    return res.json({
                        status: true,
                        message: 'DB update successful',
                        token: token,
                        previosDetails: result,
                        user: user
                    });
                }
            );
        });
    }
);

module.exports = router;