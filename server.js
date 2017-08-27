//npm modules:
// const bodyParser = require('body-parser');
const express = require('express');
const app = express();
var router = require('./routers/router');
const hb = require('express-handlebars');
// const cookieSession = require('cookie-session');

router.use(require('cookie-parser')());
var session = require('express-session'),
    Store = require('connect-redis')(session);

var sessionSecret = 'my super fun secret';
// if (process.env.SESSION_SECRET) {
//     sessionSecret = process.env.SESSION_SECRET;
// } else {
//     const secrets = require('./secrets.json');
//     sessionSecret = secrets.sessionSecret;
// }

var store = {};
if(process.env.REDIS_URL){
    store = {
        url: process.env.REDIS_URL
    };
} else {
    store = {
        ttl: 3600,
        host: 'localhost',
        port: 6379
    };
}

app.use(session({
    store: new Store(store),
    resave: false,
    saveUninitialized: true,
    secret: sessionSecret
}));

//
// const redis = require('redis');
//
// var session = require('express-session'),
//     Store = require('connect-redis')(session);
//
// // redis client
// var client = redis.createClient({
//     host: (process.env.REDIS_URL || 'localhost'),
//     port: 6379
// });
//
// client.on('error', function(err) {
//     console.log(err);
// });

//own modules:
// const {cookieSecret} = require('./secrets');
// var cookieSecret;
// if (process.env.DATABASE_URL) {
//     cookieSecret = process.env.cookieSecret;
// }
// else {
//     cookieSecret = require('./secrets').cookieSecret;
// }

// boilerplate to use handlebars as template engine for express
app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

//middleware for static assets
app.use(express.static(__dirname + '/assets'));

//middleware to remember id of row of signer
// app.use(cookieSession({
//     secret: cookieSecret,
//     maxAge: 1000 * 60 * 60 * 24 * 14
// }));



// app.use(cookieParser());

//express-session
// app.use(session({
//     store: new Store({
//         url: process.env.REDIS_URL
//         // ttl: 3600, //time to live
//         // host: host,
//         // port: 6379
//     }),
//     resave: true,
//     saveUninitialized: true,
//     secret: 'my super fun secret'
// }));

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
