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
                    userInfo: result,
                    token: accessToken
                });
            }
        );
    }
);

router.put('/update',
    (req, res) => {
        // checki
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

            // console.log('body : ');
            // console.log(req.body);
            // console.log(req.body.age);
            // console.log(req.body.graduationYear);

            // req.body.age = Number(req.body.age);
            // req.body.graduationYear = Number(req.body.graduationYear);
            // console.log('After parsing : ');
            // console.log(req.body.age);
            // console.log(req.body.graduationYear);

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

router.post('/login',
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
        userModel.findOne(
            { phoneNumber: phoneNumber },
            (err, result) => {

                if (err) {
                    return res.json({
                        status: false,
                        message: 'Login failed !',
                        error: err
                    });
                }

                if (result) {
                    var passwordMatched = bycryptjs.compareSync(req.body.password, result.password);
                    if (!passwordMatched) {

                        // when pasowrd is not matched
                        return res.json({
                            status: false,
                            message: 'Wrong password !',
                        });
                    }

                    // when everything is fine : user logged in
                    const accessToken = jwt.sign({ phone: phoneNumber }, process.env.ACCESS_TOKEN_SECRET);
                    return res.json({
                        status: true,
                        message: 'User logged in successfully',
                        token: accessToken,
                        userDetails: result
                    });
                }

                // when user doesn't exist
                return res.json({
                    status: false,
                    message: 'User doesn\'t exist !'
                });
            }
        );
    }
);

router.get('/showAll', (req, res) => {

    const authHeader = req.headers['authorization'];

    const token = authHeader && authHeader.split(' ')[1];

    // check if token is null
    if (token == null) {
        return res.json({
            status: false,
            message: 'Token is null !'
        });
    }

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
        userModel.find({}, { password: 0 },
            (err, result) => {
                // check error
                if (err) {
                    return res.json({
                        status: false,
                        message: 'Users fetching failed !',
                        errors: err
                    });
                }

                // if there is no error
                return res.json({
                    status: true,
                    message: 'All users are fetched',
                    users: result
                });
            });
    });

});

module.exports = router;