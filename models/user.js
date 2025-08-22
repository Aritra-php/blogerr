const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose"); 

const userSchema = new mongoose.Schema({
    fullname: String, 
    email: String, 
    phone: String, 
    dob: String, 
    interests: String, 
    profilePic: String,
    profilePicPublicId: String,
});

userSchema.plugin(passportLocalMongoose); 

module.exports = mongoose.model("User", userSchema); 