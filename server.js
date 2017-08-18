//npm modules:
const bodyParser = require('body-parser');
const express = require("express");
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
    res.render("home", {
        layout: "main"
    });
});

app.post("/", function (req, res){
    var queryValues = [req.body.first, req.body.last, req.body.signature];
    dbQuery.addSignature(queryValues);
    res.redirect("/thanks");
});

app.get("/thanks", function (req, res){
    res.render("thanks", {
        layout: "main"
    });
});

app.get("/signers", function (req, res){
    res.render("signers", {
        layout: "main"
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
