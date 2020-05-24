const mongoose = require('mongoose');
const assert = require('assert');
const dbUrl = process.env.DB_URL;

mongoose.connect(
    dbUrl,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true
    },
    (err, link) => {
        assert.equal(err, null, 'Database Connection failed !');

        console.log('Databse connected successfully...');

        // console.log(link);
    }
);