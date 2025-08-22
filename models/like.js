const mongoose = require("mongoose");  //require mongoose


const likeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User"
    },
    post: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Blog"
    }
});

module.exports= mongoose.model("Like", likeSchema); 