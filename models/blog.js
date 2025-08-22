const mongoose = require("mongoose");  //require mongoose

const blogSchema = new mongoose.Schema({   //initiating schema for Blog collection
    username: String, 
    content: String, 
    image: String, 
    imagePublicId: String,
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
});

const Blog = mongoose.model("Blog", blogSchema);  //create model or collection (Blog)

module.exports = Blog; //export the collection