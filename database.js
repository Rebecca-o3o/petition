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

// get sum of signers
var amountOfSigners = function(){
    const queryText = 'SELECT count (*) FROM signers';
    return db.query(queryText).then(function(result) {
        console.log(result.rows);
    }).catch(function(err) {
        console.log(err);
    });
};

// get list of signers
var listSigners = function(){
    const queryText = 'SELECT first, last FROM signers';
    return db.query(queryText);
};

module.exports = {
    addSignature,
    amountOfSigners,
    listSigners
};
