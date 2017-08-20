//Spiced Academy module which sets up client to talk to DB from node.js
const spicedPg = require('spiced-pg');

//get database username and password
const {DBuser,DBpass} = require('./secrets');

const db = spicedPg(`postgres:${DBuser}:${DBpass}@localhost:5432/signers`);


// insert query to signers database with preventing SQL injection (pg module)
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
    return db.query(queryText);
};

// get list of signers
var listSigners = function(){
    const queryText = 'SELECT first, last FROM signers';
    return db.query(queryText);
};

// insert query to users database with preventing SQL injection (pg module)
var addUser = function (queryValues){
    const queryText = 'INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id';
    //timestamp inserted automatically
    return db.query(queryText, queryValues).then(function(result) {
        // result is an js array of objects
        console.log("RESULT ROWS:" + result.rows);
    }).catch(e => console.error(e.stack));
};

module.exports = {
    addSignature,
    amountOfSigners,
    listSigners,
    addUser
};
