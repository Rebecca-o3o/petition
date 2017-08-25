//Spiced Academy module which sets up client to talk to DB from node.js
const spicedPg = require('spiced-pg');

//own modules:
const {hashPassword,checkPassword} = require('./hashing');
//get database username and password
// const {DBuser,DBpass} = require('./secrets');

var db = spicedPg(process.env.DATABASE_URL || require('./secrets').db);


// insert query to users database with preventing SQL injection (pg module)
var addUser = function (queryValues){
    const queryText = 'INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id';
    //timestamp inserted automatically
    return db.query(queryText, queryValues);
};

// insert query to user_profiles database with preventing SQL injection (pg module)
var addUserProfile = function (queryValues){
    const queryText = 'INSERT INTO user_profiles (age, city, homepage, user_id) VALUES ($1, $2, $3, (SELECT id FROM users WHERE id=$4)) RETURNING user_id';
    //timestamp inserted automatically
    return db.query(queryText, queryValues);
};

// insert query to signers database with preventing SQL injection (pg module)
// user_id is foreign key and will be inserted according session stored id
var addSignature = function (queryValues){
    const queryText = "INSERT INTO signers (signature, user_id) VALUES ($1, (SELECT id FROM users WHERE id=$2)) RETURNING user_id";
    // console.log(queryText);
    //timestamp inserted automatically
    return db.query(queryText, queryValues);
};

// get sum of signers
var amountOfSigners = function(){
    const queryText = 'SELECT count (*) FROM signers';
    return db.query(queryText);
};

// get list of signers
var listSigners = function(){
    const queryText = 'SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.homepage \
    FROM users INNER JOIN signers ON users.id = signers.user_id \
    LEFT OUTER JOIN user_profiles ON users.id = user_profiles.user_id';
    return db.query(queryText);
};

// get signature from database
var displaySignature = function(userId){
    // console.log("THIS IS QUERY VALUE", userId);
    const queryText = "SELECT signature FROM signers WHERE user_id=$1";
    // console.log("QUERY TEXT FOR DISPLAY SIG IS:", queryText);
    return db.query(queryText, [userId]);
};

// check if user signed already
var checkForSignature = function(userId){
    const queryText = 'SELECT id FROM signers WHERE user_id=$1';
    console.log("QUERY TEXT IS:", queryText);
    return db.query(queryText, [userId]);
};

// searching for plaintextpassword of usser in users database
var loginUser = function (email){
    const queryText = "SELECT password FROM users WHERE email=$1";
    // console.log("LOGIN USER QUERY TEXT HIER:" + queryText);
    return db.query(queryText, [email]);
};

// searching for user in users database
var checkforUser = function (email){
    const queryText = "SELECT id FROM users WHERE email=$1";
    // console.log("CHECK FOR USER QUERY TEXT HIER:" + queryText);
    return db.query(queryText, [email]);
};

var getUserData = function(userId){
    const queryText = "SELECT users.first, users.last, users.email, user_profiles.age, user_profiles.city, user_profiles.homepage \
    FROM users \
    LEFT OUTER JOIN user_profiles \
    ON users.id = user_profiles.user_id WHERE users.id=$1";
    // console.log(queryText);
    return db.query(queryText, [userId]);
};

module.exports = {
    addUser,
    addUserProfile,
    addSignature,
    amountOfSigners,
    listSigners,
    displaySignature,
    checkForSignature,
    loginUser,
    checkforUser,
    getUserData
};
