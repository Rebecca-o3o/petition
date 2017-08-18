//Spiced Academy module which sets up client to talk to DB from node.js
const spicedPg = require('spiced-pg');

//get database username and password
const {DBuser,DBpass} = require('./secrets');

const db = spicedPg(`postgres:${DBuser}:${DBpass}@localhost:5432/signers`);


// insert query to database with preventing SQL injection (pg module)
var addSignature = function (queryValues){
    const queryText = 'INSERT INTO signers (first, last, signature) VALUES ($1, $2, $3) RETURNING id';
    //timestamp inserted automatically
    return db.query(queryText, queryValues).then(function(result) {
        // result is an js array of objects
        console.log("RESULT ROWS:" + result.rows);
    }).catch(e => console.error(e.stack));
};

module.exports.addSignature = addSignature;

// db.query('SELECT * FROM signers').then(function(results) {
//     console.log(results.rows);
// }).catch(function(err) {
//     console.log(err);
// });
