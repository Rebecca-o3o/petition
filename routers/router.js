// 1. cookie parser
// 2. express session
// value you pass to the Store constructor & what you pass to the
// createClient method needs to be different for it to work on redis

var express = require('express'),
    router = express.Router();

const redis = require('redis');

// redis client:
var client = redis.createClient({
    host: (process.env.REDIS_URL || 'localhost'),
    port: 6379
});

client.on('error', function(err) {
    console.log(err);
});


// // redis sessions:
// var session = require('express-session'),
//     Store = require('connect-redis')(session);
// const app = express();

// var store = {};
// if(process.env.REDIS_URL){
//     store = {
//         url: process.env.REDIS_URL
//     };
// } else {
//     store = {
//         ttl: 3600, //time to live
//         host: 'localhost',
//         port: 6379
//     };
// }

// app.use(cookieParser());

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

router.use(require('body-parser').urlencoded({
    extended: false
}));

//own modules:
const dbQuery = require('./../database');


//========= ROUTES =========//
router.get("/", function (req, res){
    // check if user is logged in
    if (req.session.userId) {
        // console.log("USER EINGELOGGT mit req.session.userId" + req.session.userId);
        res.redirect("/thanks");
    }
    else {
        res.redirect("/register");
    }
});

router.get("/register", function (req, res){
    res.render("register", {
        layout: "video"
    });
});

router.post("/register", function (req, res){
    var queryValues = [req.body.first, req.body.last, req.body.email, req.body.password];
    //show error message if inputs empty
    if (!req.body.first && !req.body.last && !req.body.email && !req.body.password){
        res.render("register", {
            layout: "video",
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
            res.render("register", {
                layout: "video",
                inputError: true
            });
        });
    }
});

router.get("/login", function (req, res){
    res.render("login", {
        layout: "video"
    });
});

router.post("/login", function (req, res) {
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
        }
        else {
            // console.log("passwords dont match");
            res.render("login", {
                layout: "video",
                inputError: true
            });
        }
    }).catch((err)=>{
        console.log(err);
    });
});

router.get("/profile", function (req, res){
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

router.post("/profile", function (req, res){
    // console.log("USER TRIES TO PERFORM POST FROM PROFILE with req.session.userId:"+ req.session.userId);
    req.body.age ? req.body.age : req.body.age = null;
    var queryValues = [req.body.age, req.body.city, req.body.homepage, req.session.userId];
    //skip input if all empty
    if (!req.body.age && !req.body.city && !req.body.homepage){
        // console.log("USER DIDNT INCLUDE ANY PROFILE DETAILS");
        // console.log("ABOUT TO RUN CHECKS FOR SIGNATURE, the user id is:", req.session.userId);
        dbQuery.checkForSignature(req.session.userId).then((result)=>{
            // console.log("this was the result of check for signature", result.rows[0].id);
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
            console.log("THIS IS THE CATCH FROM CHECK FOR SIGNATURE", err);
            res.redirect("/petition");
        });
    }
    //add profile inputs to user_profiles database returning user_id
    else {
        dbQuery.addUserProfile(queryValues).then((result)=>{
            // delete redis cache
            client.del('signers');
            console.log("Redis cache deleted");

            //XXXX if signed go to thanks
            console.log(result.rows);
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

router.get("/petition", function (req, res){
    //check for if user is logged in
    if (req.session.userId) {
        dbQuery.getUserData(req.session.userId).then((result)=>{
            res.render("petition", {
                layout: "main",
                first: result.rows[0].first,
                last: result.rows[0].last,
            });
        }).catch((err)=>{
            console.log(err);
        });
    }
    else {
        res.redirect("/login");
    }
});

router.post("/petition", function (req, res){
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
            res.render("petition", {
                layout: "main",
                inputError: true
            });
        });

    }
});

router.get("/thanks", function (req, res){

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
        res.render("thanks", {
            layout: "main",
            inputError: true
        });
    });

    // dbQuery.amountOfSigners().then((result)=>{
    //     numSigners = result.rows[0].count;
    // }).catch((err)=>{
    //     console.log(err);
    //     res.send("Couldn't load amout of signers");
    // });
});

router.get("/delete", function (req, res) {
    dbQuery.deleteSignature(req.session.userId).then(()=>{
        res.redirect("/petition");
    }).catch((err)=>{
        console.log(err);
    });
});

router.get("/signers", function (req, res){

    //check for if user is logged in
    if (req.session.userId) {
        //check if redis cached rows
        client.get('signers', function(err, data){
            if (err) {
                return console.log(err);
            }
            //cache hit
            if (data){
                // console.log("redis data is:" + JSON.parse(data));
                res.render("signers", {
                    layout: "main",
                    signers: JSON.parse(data)
                });
            }
            // cache miss - so do query and add result to redis
            else {
                // console.log("redis signers null data is:" + data);
                //respond with promise from query
                dbQuery.listSigners().then((result)=>{
                    // console.log(result.rows);
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
                    // res.render("signers", {
                    //     layout: "main",
                    //     inputError: true
                    // });
                });
            }
        });
    }
    else {
        res.redirect("/login");
    }
});

router.get("/profile/edit", function (req, res){
    if (req.session.userId) {

        dbQuery.getUserData(req.session.userId).then((result)=>{
            res.render("editProfile", {
                layout: "main",
                first: result.rows[0].first,
                last: result.rows[0].last,
                email: result.rows[0].email,
                age: result.rows[0].age,
                city: result.rows[0].city,
                homepage: result.rows[0].homepage
            });
        }).catch((err)=>{
            console.log(err);
        });
    }
    else {
        res.redirect("/login");
    }
});


// router.post("/profile/edit", function (req, res){
//
//     // var userData = [
//     //     req.body.first,
//     //     req.body.last,
//     //     req.body.email,
//     //     req.body.password];
//
//     // var userProfile = [
//     //     req.body.age,
//     //     req.body.city,
//     //     req.body.homepage];
//
//     // console.log ("USER DATA:" + userData);
//     // console.log ("USER Profile:" + userProfile);
//     console.log ("USER ID:" + req.session.userId);
//
//     Promise.all([
//         dbQuery.updateUser(req.body.first, req.body.last, req.body.email, req.body.password, req.session.userId),
//         dbQuery.updateProfile(req.body.age, req.body.city, req.body.homepage, req.session.userId)
//     ]).then((result)=>{
//         console.log(result);
//         res.redirect("/thanks");
//     }).catch((err)=>{
//         console.log(err);
//         res.send("user data was not updated");
//     });
// });
//

router.get("/signers/:city", function (req, res){
    console.log(req.params.city);
    if (req.session.userId) {
        dbQuery.getCities(req.params.city).then((result)=>{
            console.log(result.rows);
            res.render("city", {
                layout: "main",
                signers: result.rows,
                city: req.params.city
            });
        }).catch((err)=>{
            console.log(err);
        });
    }
    else {
        res.redirect("/login");
    }
});

router.post("/profile/edit", function (req, res) {
    res.redirect("/thanks");
});

router.post("/logout", function (req, res){
    req.session.userId = null;
    console.log("LOGOUT", req.session.userId);
    req.session.destroy(res.redirect("/login"));
});


//export your router
module.exports = router;
