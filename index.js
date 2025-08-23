const express=require("express");   //require express packgae
const app=express();   //call express package
// const port=8080;        //define port 
const port = process.env.PORT || 8080;
require("dotenv").config(); //.env file configuration
const mongoose = require("mongoose");  //require mongoose
const Blog = require("./models/blog.js"); //require Blog collection or model 
const path=require("path"); //require path package 
const { v4 : uuidv4}= require('uuid'); //require unique id module
const methodOverride=require("method-override"); //require method-override module
const session = require("express-session"); //requring the express session package
const MongoStore = require('connect-mongo'); //require mongo session for session store after hosting
const flash = require("connect-flash"); //require flash package for flash message
const passport = require("passport"); //require passport for signup and login
const LocalStrategy = require("passport-local"); //require passport method
const User = require("./models/user.js"); //require User model 

//require all routes
const postRoutes = require("./routes/post.js");
const userRoutes = require("./routes/user.js");
const notesRoute = require("./routes/notes.js");


app.use(express.urlencoded({extended: true})); // setting middleware 
app.use(methodOverride("_method")); 

const dbURL = process.env.ATLASDB_URL

//set up connection with db 
main().then(()=>{
    console.log("Connection Successful");
}).catch((err)=>{
    console.log(err);
});

async function main(){
    await mongoose.connect(dbURL);
}

const store = MongoStore.create({
    mongoUrl: dbURL, 
    crypto:{
        secret: process.env.SECRET,
    }, 
    touchAfter: 24*3600,
});

store.on("error", ()=>{
    console.log("ERROR IN MONGO SESSION", err);
})

//middleware for session
app.use(session({
    store,
    secret: process.env.SECRET, 
    resave: false, 
    saveUninitialized: false
}));

//middleware for using flash
app.use(flash()); 

//middleware for passport 
app.use(passport.initialize()); 
app.use(passport.session());

//implementing passport local strategy for User model
passport.use(new LocalStrategy(User.authenticate())); 

//seriliazing & deserilization of user for login
passport.serializeUser(User.serializeUser()); 
passport.deserializeUser(User.deserializeUser()); 

//middleware for storing the curr user logged in and flash msg for success and failure 
app.use((req, res, next)=>{
    res.locals.currentUser = req.user; 
    res.locals.success = req.flash("success"); 
    res.locals.error = req.flash("error"); 
    next();
});

app.set("view engine", "ejs");  //set view engine to ejs package 

app.set("views", path.join(__dirname, "views"));   //setting the path of views directory 
app.use(express.static(path.join(__dirname, "public"))); //setting the path of public directory 

//JSON body parsing 
// app.use(express.json());

//routes setup
app.use("/posts", postRoutes);
app.use("/", userRoutes);
app.use("/notes", notesRoute);

app.get("/", (req, res) => {
  res.redirect("/posts");
});

//call port 
app.listen(port, ()=>{                              
    console.log(`listening to post ${port}`); 
});



