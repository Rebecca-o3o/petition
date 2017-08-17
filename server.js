//npm modules:
const bodyParser = require('body-parser');
const express = require("express");
var app = express();
var hb = require('express-handlebars');

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

// app.post("/", function (req, res){
//     console.log()
// });

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
