// const { type } = require("express/lib/response");
const mongoose = require("mongoose");  //require mongoose

const noteSchema = new mongoose.Schema({
    content: {
        type: String, 
        required: true
    }, 
    hasCheckbox: {
        type: Boolean, 
        default: false
    }, 
    completed: {
        type: Boolean, 
        default: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true
    }
}, {timestamps: true});

module.exports=new mongoose.model("Note", noteSchema); 