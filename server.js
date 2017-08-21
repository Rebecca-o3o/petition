//npm modules:
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const hb = require('express-handlebars');
const cookieSession = require('cookie-session');

//own modules:
const dbQuery = require('./database');
const {cookieSecret} = require('./secrets');

// boilerplate to use handlebars as template engine for express
app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

//middleware for static assets
app.use(express.static('assets'));

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
        console.log("USER EINGELOGGT");
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
            console.log("USER ID:", result.rows[0].id);
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
            console.log("resolved");
            // check if already signed
            // signed - redirect to thank you
            // not signed redirect to petition
            res.redirect("/petition");
        }
        //not matching passwords
        else {
            console.log("passwords dont match");
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
        console.log("USER EINGELOGGT");
        res.render("profile", {
            layout: "main"
        });
    }
    else {
        res.redirect("/login");
    }
});

app.post("/profile", function (req, res){
    var queryValues = [req.body.age, req.body.city, req.body.homepage];
    //skip input if all empty
    if (!req.body.age && !req.body.city && !req.body.homepage){
        //XXXX if signed go to thanks
        res.redirect("/thanks");
        //XXXX else go to petition
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
    var queryValues = [req.body.first, req.body.last, req.body.signature];
    //show error message if inputs empty
    if (!req.body.first && !req.body.last && !req.body.signature){
        res.render("petition", {
            layout: "main",
            inputError: true
        });
    }
    //add input to database returning signers ID
    else {
        dbQuery.addSignature(queryValues).then((result)=>{
            console.log("SIGNERS ID:", result.rows[0].id);
            req.session.signerId = result.rows[0].id;
            res.redirect("/thanks");
        }).catch((err)=>{
            console.log(err);
            res.send("Could not add signature to signers");
        });

    }
});

app.get("/thanks", function (req, res){
    //check for if user is logged in
    if (req.session.userId) {
        // signer ID stored with help of cookie session at /petition
        var signId=req.session.signerId;
        dbQuery.displaySignatue(signId).then((result)=>{
            res.render("thanks", {
                layout: "main",
                // num: numSigners,
                sign: result.rows[0].signature
            });
        }).catch((err)=>{
            console.log(err);
            res.send("Couldn't load signature");
        });
    }
    else {
        res.redirect("/login");
    }

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
        //respond with promise from query
        dbQuery.listSigners().then((result)=>{
            // console.log(result);
            res.render("signers", {
                layout: "main",
                signers: result.rows
            });
        }).catch(function(err){
            console.log(err);
            res.send("Couldn't load list of signers");
        });
    }
    else {
        res.redirect("/login");
    }
});

app.use((req,res) => {
    res.status(404);
    res.render("404", {
        layout: "main"
    });
});

//log server start
app.listen(8080, ()=> {
    console.log ("listening on port 8080");
});
