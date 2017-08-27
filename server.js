//npm modules:
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
var router = require('./routers/router');
const hb = require('express-handlebars');
const cookieSession = require('cookie-session');
const redis = require('redis');

// redis client
var client = redis.createClient({
    host: (process.env.REDIS_URL || 'localhost'),
    port: 6379
});

client.on('error', function(err) {
    console.log(err);
});

//own modules:
// const {cookieSecret} = require('./secrets');
var cookieSecret;
if (process.env.DATABASE_URL) {
    cookieSecret = process.env.cookieSecret;
}
else {
    cookieSecret = require('./secrets').cookieSecret;
}

// boilerplate to use handlebars as template engine for express
app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

//middleware for static assets
app.use(express.static(__dirname + '/assets'));

//middleware to remember id of row of signer
app.use(cookieSession({
    secret: cookieSecret,
    maxAge: 1000 * 60 * 60 * 24 * 14
}));

//middleware to use request bodies containing values from user inputs
app.use(bodyParser.urlencoded({
    extended: false
}));

//routes
app.use(router);

app.use((req,res) => {
    res.status(404);
    res.render("404", {
        layout: "main"
    });
});

//log server start
app.listen( process.env.PORT || 8080, () => {
    console.log("server listening");
});
