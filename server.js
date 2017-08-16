//npm modules:
const express = require("express");
var app = express();
var hb = require('express-handlebars');

// boilerplate to use handlebars as template engine for express
app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

//middleware for static assets
app.use(express.static('assets'));

//routes
app.get("/", function (req, res){
    res.render("home", {
        layout: "main"
    });
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

//log server start
app.listen(8080, ()=> {
    console.log ("listening on port 8080");
});
