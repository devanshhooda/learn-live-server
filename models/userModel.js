const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    fcmToken: {
        type: String
    },
    name: {
        type: String
    },
    age: {
        type: Number
    },
    profession: {
        type: String
    },
    institute: {
        type: String
    },
    company: {
        type: String
    },
    graduationYear: {
        type: Number
    },
    currentCity: {
        type: String
    },
    homeCity: {
        type: String
    },
    bio: {
        type: String
    },
    connects: [{ type: String }],
    receivedRequests: [{ type: String }],
    sentRequests: [{ type: String }],
    interests: [{ type: String }],
    createdOn: {
        type: Date,
        default: Date.now()
    },
    isActive: {
        type: Boolean,
        default: true
    },
});

mongoose.model('users-collection', userSchema);

module.exports = mongoose.model('users-collection');
