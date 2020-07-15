require('dotenv').config();
const router = require('express').Router();
const bycryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const userModel = require('../models/userModel');
const serviceAccount = require('../fcmFile.json');
const firebaseAdmin = require('firebase-admin');


firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
});

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

        console.log('Body : ');
        console.log(req.body);

        userModel.create({
            phoneNumber: phoneNumber,
            password: hashedPassword,
            fcmToken: req.body.fcmToken
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
                    userDetails: result,
                    token: accessToken
                });
            }
        );
    }
);

router.put('/update',
    (req, res) => {
        // validation
        if (!req.query.userId) {
            return res.json({
                status: false,
                message: 'Id is not provided !'
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

            console.log('body : ');
            console.log(req.body);

            // token matched
            userModel.findByIdAndUpdate(
                req.query.userId, req.body,
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

        console.log('Body : ');
        console.log(req.body);

        const phoneNumber = req.body.phoneNumber;
        userModel.findOneAndUpdate(
            { phoneNumber: phoneNumber },
            { fcmToken: req.body.fcmToken },
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
            // if token doesn't matches
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

router.put('/showOnly', (req, res) => {

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
            // if token doesn't matches
            return res.json({
                status: false,
                message: 'Invalid token !',
                error: err
            });
        }
        console.log('Body : ');
        console.log(req.body);

        // token matched
        userModel.find({
            profession: { $all: req.body.profession },
            company: { $all: req.body.company },
            institute: { $all: req.body.institute }
        },
            { password: 0 },
            (err, result) => {
                // check error
                if (err) {
                    return res.json({
                        status: false,
                        message: 'Users fetching failed !',
                        errors: err
                    });
                }
                console.log(result);

                // if there is no error
                return res.json({
                    status: true,
                    message: 'All users are fetched',
                    users: result
                });
            });
    });
});

router.get('/getUser', (req, res) => {
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
            // if token doesn't matches
            return res.json({
                status: false,
                message: 'Invalid token !',
                error: err
            });
        }

        // token matched
        userModel.findById(req.query.userId, { password: 0 }, (err, result) => {
            if (err) {
                return res.json({
                    status: false,
                    message: 'User fetching failed !',
                    error: err
                });
            }

            return res.json({
                status: true,
                message: 'User fetched',
                userDetails: result
            });
        });
    });
});

router.put('/sendConnectionRequest', (req, res) => {

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
            // if token doesn't matches
            return res.json({
                status: false,
                message: 'Invalid token !',
                error: err
            });
        }

        console.log('body : ');
        console.log(req.body);

        userModel.findByIdAndUpdate(req.body.sendingId,
            { $push: { sentRequests: req.body.receivingId } },
            (err, result) => {
                if (err) {
                    return res.json({
                        status: false,
                        error: err
                    });
                } else {
                    userModel.findByIdAndUpdate(req.body.receivingId,
                        { $push: { receivedRequests: req.body.sendingId } },
                        (err, result) => {
                            if (err) {
                                return res.json({
                                    status: false,
                                    error: err
                                });
                            } else {
                                return res.json({
                                    status: true,
                                    message: `Request sent to ${req.body.sendingId} by ${req.body.receivingId}`
                                });
                            }
                        }
                    );
                }
            });
    });
});

router.put('/respondConnectionRequest', (req, res) => {
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
            // if token doesn't matches
            return res.json({
                status: false,
                message: 'Invalid token !',
                error: err
            });
        }

        console.log('body : ');
        console.log(req.body);

        // if request is accepted
        if (req.body.connectResponse) {
            // console.log(1);

            // work of responding user
            userModel.findByIdAndUpdate(req.body.respondingId,
                {
                    $pull: { receivedRequests: req.body.receivingId },
                    $push: { connects: req.body.receivingId }
                },
                (err, result) => {
                    // console.log(2);
                    if (err) {
                        return res.json({
                            status: false,
                            error: err
                        });
                    } else {
                        // work of receiving user
                        userModel.findByIdAndUpdate(req.body.receivingId,
                            {
                                $push: { connects: req.body.respondingId },
                                $pull: { sentRequests: req.body.respondingId }
                            },
                            (err, result) => {
                                if (err) {
                                    return res.json({
                                        status: false,
                                        error: err
                                    });
                                } else {
                                    return res.json({
                                        status: true,
                                        message: `Request accepted by ${req.body.respondingId} by ${req.body.receivingId}`
                                    });
                                }
                            }
                        );
                    }
                });
        } else {
            // if request is declined
            // work of responding user
            userModel.findByIdAndUpdate(req.body.respondingId,
                { $pull: { receivedRequests: req.body.receivingId } },
                (err, result) => {
                    if (err) {
                        return res.json({
                            status: false,
                            error: err
                        });
                    } else {
                        // work of receiving user
                        userModel.findByIdAndUpdate(req.body.receivingId,
                            { $pull: { sentRequests: req.body.respondingId } },
                            (err, result) => {
                                if (err) {
                                    return res.json({
                                        status: false,
                                        error: err
                                    });
                                } else {
                                    return res.json({
                                        status: true,
                                        message: `Request declined by ${req.body.respondingId} by ${req.body.receivingId}`
                                    });
                                }
                            }
                        );
                    }
                });
        }
    });
});

router.put('/sendCallRequest', (req, res) => {

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
            // if token doesn't matches
            return res.json({
                status: false,
                message: 'Invalid token !',
                error: err
            });
        }
        else {
            console.log('body : ');
            console.log(req.body);
            var fcmToken;

            userModel.findById(
                req.body.receivingId,
                (err, result) => {
                    if (err) {
                        return res.json({
                            message: 'Could not place call',
                            error: err
                        })
                    }
                    else {
                        console.log('db result : ' + result);

                        fcmToken = result.fcmToken;
                        console.log('fcmToken : ' + fcmToken);

                        sendCallNotificaton(fcmToken, req.body.callerName, req.body.sendingId, req.body.receivingId);
                    }
                }
            );
        }
    });
});

function sendCallNotificaton(fcmToken, callerName, sendingId, receivingId) {
    firebaseAdmin.messaging().send({
        notification: {
            title: 'Learn live video call request',
            body: callerName
        },
        android: {
            notification: {
                color: '#bd02aa'
            },
            collapseKey: 'message',
        },
        data: {
            sendingId: JSON.stringify(sendingId),
            receivingId: JSON.stringify(receivingId),
            click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        token: fcmToken
    }).then((resp) => {
        console.log('Sent Notification to the User: ', resp);
        return res.json({
            status: true,
            message: 'Notification sent',
            result: resp
        });
    }).catch((err) => {
        console.log(Date.now(), ': Error sending fcm notification.', err);
    });
}

module.exports = router;