//npm modules:
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const hb = require('express-handlebars');
const cookieSession = require('cookie-session');
const redis = require('redis');

// redis client
var client = redis.createClient({
    host: 'localhost',
    port: 6379
});

client.on('error', function(err) {
    console.log(err);
});

//own modules:
const dbQuery = require('./database');
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
app.get("/video", function (req, res){
    res.render("register", {
        layout: "video"
    });
});

app.get("/", function (req, res){
    // check if user is logged in
    if (req.session.userId) {
        // console.log("USER EINGELOGGT mit req.session.userId" + req.session.userId);
        res.redirect("/thanks");
    }
    else {
        res.redirect("/register");
    }
});

app.get("/register", function (req, res){
    res.render("register", {
        layout: "main"
    });
});

app.post("/register", function (req, res){
    var queryValues = [req.body.first, req.body.last, req.body.email, req.body.password];
    //show error message if inputs empty
    if (!req.body.first && !req.body.last && !req.body.email && !req.body.password){
        res.render("register", {
            layout: "main",
            inputError: true
        });
    }
    //add input to users database and returning users ID
    else {
        dbQuery.addUser(queryValues).then((result)=>{
            // console.log("USER ID:", result.rows[0].id);
            req.session.userId = result.rows[0].id;
            res.redirect("/profile");
        }).catch((err)=>{
            console.log(err);
            res.send("Could not add user to users");
        });
    }
});

app.get("/login", function (req, res){
    res.render("login", {
        layout: "main"
    });
});

app.post("/login", function (req, res) {
    //check users database against request
    dbQuery.loginUser(req.body.email).then((result)=>{
        //matching passords
        if (req.body.password === result.rows[0].password) {


            // console.log("SESSION USER ID aus users:" + req.session.userId);
            // add session userId
            dbQuery.checkforUser(req.body.email).then((result)=>{
                // console.log("YELL THIS IS THE RESULT", result);
                req.session.userId = result.rows[0].id;
                // console.log("SESSION ID AFTER SUCCESSFULL LOGIN:", req.session.userId);
                res.redirect("/thanks");
            }).catch((err)=>{
                console.log(err);
            });


            // check if already signed
            // dbQuery.displaySignature(req.session.userId).then((result)=>{
            //     console.log("ABOUT TO CHECK FOR SIGNATURE");
            //     if (result) {
            //         res.redirect("/thanks");
            //     }
            //     if (!result) {
            //         res.redirect("/petition");
            //     }
            //     else {
            //         res.render("login", {
            //             layout: "main",
            //             inputError: true
            //         });
            //     }
            // }).catch((err)=>{
            //     console.log(err);
            // });


            //another way to check for signed
            // dbQuery.checkForSignature(req.session.userId).then((result)=>{
            //     console.log(req.session.userId);
            //     console.log("ABOUT TO CHECK FOR SIGNATURE - RESULT:", result);
            //     if (req.session.userId === result) {
            //         // signed - redirect to thank you
            //         // console.log("USER HAS SIGNED ALREADY - redirect to thank you");
            //         res.redirect("/thanks");
            //     }
            //     else {
            //         // not signed - redirect to petition
            //         res.redirect("/petition");
            //     }
        }
        else {
            // console.log("passwords dont match");
            res.render("login", {
                layout: "main",
                inputError: true
            });
        }
    }).catch((err)=>{
        console.log(err);
    });
});

app.get("/profile", function (req, res){
    //here check for if user is logged in
    if (req.session.userId) {
        // console.log("USER EINGELOGGT");
        res.render("profile", {
            layout: "main"
        });
    }
    else {
        res.redirect("/login");
    }
});

app.post("/profile", function (req, res){
    // console.log("USER TRIES TO PERFORM POST FROM PROFILE with req.session.userId:"+ req.session.userId);
    var queryValues = [req.body.age, req.body.city, req.body.homepage];
    //skip input if all empty
    if (!req.body.age && !req.body.city && !req.body.homepage){
        // console.log("USER DIDNT INCLUDE ANY PROFILE DETAILS");
        // console.log("ABOUT TO RUN CHECKS FOR SIGNATURE, the user id is:", req.session.userId);
        dbQuery.checkForSignature(req.session.userId).then((result)=>{
            // console.log("this was the result of check for signature", result);
            if (req.session.userId === result.rows[0].id) {
                // signed - redirect to thank you
                // console.log("USER HAS SIGNED ALREADY");
                res.redirect("/thanks");
            }
            else {
                // not signed - redirect to petition
                res.redirect("/petition");
            }
        }).catch((err)=>{
            console.log(err);
        });
    }
    //add profile inputs to user_profiles database returning user_id
    else {
        dbQuery.addUserProfile(queryValues).then((result)=>{
            console.log(result);
            //XXXX if signed go to thanks
            res.redirect("/thanks");
            //XXXX else go to petition
        }).catch((err)=>{
            console.log(err);
            res.render("profile", {
                layout: "main",
                inputError: true
            });
        });
    }
});

app.get("/petition", function (req, res){
    //check for if user is logged in
    if (req.session.userId) {
        res.render("petition", {
            layout: "main"
        });
    }
    else {
        res.redirect("/login");
    }
});

app.post("/petition", function (req, res){
    var queryValues = [req.body.signature, req.session.userId];
    // console.log("TRYING TO ADD ROW TO SIGNERS with userSessionId and signature:", queryValues);
    //show error message if inputs empty
    if (!req.body.signature){
        res.render("petition", {
            layout: "main",
            inputError: true
        });
    }
    //add input to database returning signers ID
    else {
        dbQuery.addSignature(queryValues).then((result)=>{
            console.log(result);
            // console.log("SIGNERS ID:", result.rows[0].id);
            // req.session.signerId = result.rows[0].id;
            res.redirect("/thanks");
        }).catch((err)=>{
            console.log(err);
            res.send("Could not add signature to signers");
        });

    }
});

app.get("/thanks", function (req, res){

    dbQuery.displaySignature(req.session.userId).then((result)=>{
        //check if signed otherwise redirect to petition
        if (result.rows.length == 0) {
            res.redirect("/petition");
        }
        else {
            res.render("thanks", {
                layout: "main",
                // num: numSigners,
                sign: result.rows[0].signature
            });
        }
    }).catch((err)=>{
        console.log(err);
        res.send("Couldn't load signature");
    });

    // dbQuery.amountOfSigners().then((result)=>{
    //     numSigners = result.rows[0].count;
    // }).catch((err)=>{
    //     console.log(err);
    //     res.send("Couldn't load amout of signers");
    // });
});

app.get("/signers", function (req, res){

    //check for if user is logged in
    if (req.session.userId) {
        //check if redis cached rows
        client.get('signers', function(err, data){
            if (err) {
                return console.log(err);
            }
            // cache miss - so do query and add result to redis
            if (!data){
                // console.log("redis signers null data is:" + data);
                //respond with promise from query
                dbQuery.listSigners().then((result)=>{
                    // cache result.rows in redis and render page with pg result.rows
                    client.setex('signers', 60, JSON.stringify(result.rows), function(err){
                        if (err){
                            return console.log(err);
                        }
                        // console.log("the query result is successfully set to redis");
                    });
                    res.render("signers", {
                        layout: "main",
                        signers: result.rows
                    });
                }).catch(function(err){
                    console.log(err);
                    res.send("Couldn't load list of signers");
                });

            }
            //cache hit
            if (data){
                // console.log("redis data is:" + JSON.parse(data));
                res.render("signers", {
                    layout: "main",
                    signers: JSON.parse(data)
                });
            }
        });
    }
    else {
        res.redirect("/login");
    }
});

app.get("/profile/edit", function (req, res){
    if (req.session.userId) {
        res.render("editProfile", {
            layout: "main"
        });
    }
    else {
        res.redirect("/login");
    }
});

app.post("/logout", function (req, res){
    req.session.userId = null;
    console.log("LOGOUT", req.session.userId);
    res.redirect("/login");
});

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
