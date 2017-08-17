//Spiced Academy module which sets up client to talk to DB
var spicedPg = require('spiced-pg');

//get database username and password
const {dbUser,dbPass} = require('./secrets');


var db = spicedPg(`postgres:${dbUser}:${dbPass}@localhost:5432/signers`);

// general query to database
db.query('SELECT * FROM signers').then(function(results) {
    console.log(results.rows);
}).catch(function(err) {
    console.log(err);
});
