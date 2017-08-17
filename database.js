//Spiced Academy module which sets up client to talk to DB from node.js
const spicedPg = require('spiced-pg');

//get database username and password
const {dbUser,dbPass} = require('./secrets');


const db = spicedPg(`postgres:${dbUser}:${dbPass}@localhost:5432/signers`);

// general query to database
db.query('SELECT * FROM signers').then(function(results) {
    console.log(results.rows);
}).catch(function(err) {
    console.log(err);
});



// prevent SQL injection
// ======= lecture notes ====//
// var universe = 'DC';
// var id = 2;
//
// db.query('select * from superheroes WHERE universe = $1 AND id = $2', [universe, id escape SQL]).then(function(result){
// console.log(result);
// })
// results: is an js array of objects
