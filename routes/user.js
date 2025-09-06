const express=require("express");   //require express package
const router=express.Router();
const passport = require("passport"); //require passport for signup and login
const LocalStrategy = require("passport-local"); //require passport method
const path=require("path"); //require path package
const multer=require("multer");  //require multer package

const Blog = require("../models/blog.js"); //require Blog collection or model
const User = require("../models/user.js"); //require User model 

//require middleware for authorization
const { isLoggedIn, isOwner } = require("../middleware.js");

//cloudinary setup
const { cloudinary, storageProfile } = require("../confiq/cloudinary");
const signupUpload = multer({ storage: storageProfile });

//api route for fetching signup form
router.get("/signup", (req, res)=>{
    res.render("user/signup.ejs");
});

//api route for storing data from signup.ejs form into User model 
router.post("/signup",signupUpload.single("profilePic"), async(req, res)=>{
    try{
        const {fullname, email, phone, dob, username, password, interests} = req.body; 

        if(!fullname || !email || !phone || !dob ||!username ||!password ||!interests){
            req.flash("error", "Please enter all the fields!!"); 
            return res.redirect("/signup");
        }

        const existingUser = await User.findOne({username});
        if (existingUser){
            req.flash("error", "Username already exists, Pls try another username!!"); 
            return res.redirect("/signup");
        }

        const newUser = new User({
            fullname, email, phone, dob, username, interests
        }); 

        if (req.file) {
            newUser.profilePic = req.file.path;       // Cloudinary URL
            newUser.profilePicPublicId = req.file.filename; // Cloudinary public_id
        }

        const registeredUser = await User.register(newUser, password);

        req.login(registeredUser, (err)=>{
            if(err) return next(err); 
            req.flash("success", "Welcome to Blogerr!!");
            res.redirect("/posts");
        });
    }catch(err){
        console.error("Signup error:", err);
        req.flash("error", "Sorry!! something went wrong!!");
        res.redirect("/signup");
    }
});

//api route for rendering the login form
router.get("/login", (req,res)=>{
    res.render("user/login.ejs",);
});

//post request for user login 
router.post("/login", passport.authenticate("local", {
    failureRedirect: "/login", 
    failureFlash: "Incorrect Username or Password!!"
}), (req, res)=>{
    req.flash("success", "Welcome Back!!"); 
    res.redirect("/posts"); 
});

//logout route
router.get("/logout", async (req, res, next) => {
    try {
        await req.logout((err) => {
            if (err) return next(err);
            req.flash("success", "You have successfully logged out!!");
            res.redirect("/posts");
        });
    } catch (err) {
        console.log(err);
        req.flash("error", "Logout failed!!");
        res.redirect("/posts");
    }
});

//api route for rendering the profile page 
router.get("/profile", isLoggedIn, async(req, res)=>{
    const userPosts = await Blog.find({owner: req.user._id});
    
    // Convert user Mongoose doc to plain object
    const user = req.user.toObject();

    user.dob = new Date(user.dob).toDateString();
    res.render("user/profile.ejs", {user, posts: userPosts});
});

//api route for fetching the editprofile.ejs page 
router.get("/editprofile", isLoggedIn, (req, res)=>{
    const user=req.user.toObject(); 
    user.dobRaw = new Date(user.dob).toISOString().split('T')[0];
    res.render("user/editprofile.ejs", {user});
});

//api route for updating the profile details
router.patch("/editprofile", signupUpload.single("profilePic"), async(req, res)=>{
    try{
        const {fullname, email, phone, dob, username, password, interests} = req.body; 
        const updateData = {fullname, email, phone, dob, username, password, interests}; 

        const existingUser = await User.findOne({ username });
            if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
                req.flash("error", "Username already taken");
                return res.redirect("/editprofile");
            }
        
        const currentUser = await User.findById(req.user._id);

        if (req.file) {
            // delete old avatar from Cloudinary if exists
            if (currentUser.profilePicPublicId) {
                try {
                    await cloudinary.uploader.destroy(currentUser.profilePicPublicId);
                } catch (e) {
                console.warn("Failed to delete old profile pic:", e.message);
            }
        }
      updateData.profilePic = req.file.path;           // new Cloudinary URL
      updateData.profilePicPublicId = req.file.filename; // new public_id
    }

        const updateUser= await User.findByIdAndUpdate(req.user._id, updateData, {new: true});

        //update edited username in all posts created by user logged in
        await Blog.updateMany(
            {owner: req.user._id}, 
            {$set: {username: username}}
        );

        //re-login user after update to refresh session
        req.login(updateUser, function(err){
            if(err) return next(err); 
            req.flash("success", "Profile Updated Successfully");
            return res.redirect("/profile");
        });
        
    }catch(err) {
        console.log(err); 
        req.flash("error", "Failed to update profile");
        res.redirect("/editprofile");
    }
});

//view other users's profile 
router.get("/user/:id", isLoggedIn, async(req, res)=>{
    try{
        const user = await User.findById(req.params.id); 
        const post = await Blog.find({owner: user._id}); 

        if(!user){
            req.flash("error", "User does not exist");
            return res.redirect("/posts");
        }

        //if the current user logges in and tries to see their own profile via clicking username in postindetails.ejs

        if(req.user && req.user._id.toString() === user._id.toString()){
            return res.redirect("/profile");
        }

        res.render("user/userprofile.ejs", {user, post});
    } catch(err){
        console.log(err); 
        req.flash("error", "Something went wrong!!");
        res.redirect("/posts");
    }
});

//search route based upon username
router.get("/search", isLoggedIn, async(req, res)=>{
    try{
        const {username} = req.query; 
        if(!username){
            req.flash("error", "Please enter a username");
            return res.redirect("/posts");
        }

        const user= await User.findOne({username: username.trim()});
        if(!user){
            req.flash("error", "Username does not exist");
            return res.redirect("/posts"); 
        }

        const post = await Blog.find({owner: user._id});

        //for users searching their own profile
        if(req.user._id.toString() === user._id.toString()){
            return res.redirect("/profile"); 
        }

        res.render("user/userprofile.ejs", {user, post});
    }catch(err){
        console.log(err);
        req.flash("error", "Something Went wrong");
        res.redirect("/posts");
    }
});

module.exports = router;

//setting up mutler for storing user profile pics 
// const signupStorage = multer.diskStorage({
//     destination: function(req, file, cb){
//         cb(null, 'public/profilepics');
//     },  

//     filename: function(req, file, cb){
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         const ext = path.extname(file.originalname);
//         cb(null, file.fieldname + '-' + uniqueSuffix + ext); // e.g., image-173849238.jpg
//     }     
// }); 