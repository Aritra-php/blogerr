const mongoose = require("mongoose");  //require mongoose
const Blog = require("../models/blog.js"); //require Blog collection or model

//set up connection with db 
main().then(()=>{
    console.log("Connection Successful");
}).catch((err)=>{
    console.log(err);
});

async function main(){
    await mongoose.connect("mongodb://127.0.0.1:27017/blogerr")
}

async function cleanup() {
    try {
        // Delete posts where owner is missing or null
        const result = await Blog.deleteMany({
            $or: [
                { owner: { $exists: false } },
                { owner: null }
            ]
        });

        console.log(`Deleted posts without owners: ${result.deletedCount}`);
    } catch (err) {
        console.error("Cleanup error:", err);
    } finally {
        mongoose.connection.close();
    }
}

cleanup();
