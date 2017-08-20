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
app.get("/", function (req, res){
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
            res.redirect("/petition");
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

app.get("/petition", function (req, res){
    res.render("petition", {
        layout: "main"
    });
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
    // signer ID stored with help of cookie session at /petition
    var signId=req.session.signerId;

    // dbQuery.amountOfSigners().then((result)=>{
    //     numSigners = result.rows[0].count;
    // }).catch((err)=>{
    //     console.log(err);
    //     res.send("Couldn't load amout of signers");
    // });

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
});

app.get("/signers", function (req, res){

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
