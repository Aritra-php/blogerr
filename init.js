const mongoose = require("mongoose");  //require mongoose
const Blog = require("./models/blog.js"); //require Blog collection or model

//set up connection with db 
main()
.then(()=>{
    console.log("Connection Successful");
    return seedDB(); 
})
.then(()=>{
    console.log("Database seeded!!");
})
.catch((err)=>{
    console.log(err);
});

async function main(){
    await mongoose.connect("mongodb://127.0.0.1:27017/blogerr")
}

let posts = [                           //creating array of posts
    { 
        image: "/Images/aaron-burden-CKlHKtCJZKk-unsplash.jpg", 
        username: "John", 
        content: "Finished my Journal for today"
    }, 

    {
        image: "/Images/campaign-creators-3WNi-5s4LVg-unsplash.jpg", 
        username: "Frank", 
        content: "Finished my coding exercise today"
    }, 

    {
        image: "/Images/daryadarya-livejournal-btUhi2fvyvo-unsplash.jpg", 
        username: "Mathew", 
        content: "Stuck in office with a lot of work & calls"
    }, 

    {
        image: "/Images/image-1745223141280-490394857.jpg", 
        username: "Maya", 
        content: "Love to write journal, while having a cup of cofee"
    }, 

    {
        image: "/Images/image-1745228660220-437358507.jpg", 
        username: "Samantha", 
        content: "Finished my new painting, rate it out of 10"
    },    
]; 

async function seedDB(){
    await Blog.deleteMany({}); 
    await Blog.insertMany(posts);
};