//npm modules:
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const hb = require('express-handlebars');

//own modules:
const dbQuery = require('./database');

// boilerplate to use handlebars as template engine for express
app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

//middleware for static assets
app.use(express.static('assets'));

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
    //add input to users database
    else {
        dbQuery.addUser(queryValues);
        res.redirect("/petition");
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
    //add input to database
    else {
        dbQuery.addSignature(queryValues);
        res.redirect("/thanks");
    }
});

app.get("/thanks", function (req, res){

    //respond with promise from query
    dbQuery.amountOfSigners().then((result)=>{
        // console.log(result.rows[0].count);
        res.render("thanks", {
            layout: "main",
            num: result.rows[0].count
        });
    }).catch((err)=>{
        console.log(err);
        res.send("Couldn't load number of signers");
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
