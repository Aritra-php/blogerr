const express=require("express");   //require express package
const router=express.Router();
const path=require("path"); //require path package
const multer=require("multer");  //require multer package

const Blog = require("../models/blog.js"); //require Blog collection or model
const User = require("../models/user.js"); //require User model  
const Like = require("../models/like.js"); //require the like model 
const Comment = require("../models/comment.js"); //require the comment model 

//require middleware for authorization
const { isLoggedIn, isOwner } = require("../middleware.js");

//cloudinary setup
const { cloudinary, storagePost } = require("../confiq/cloudinary");
const upload = multer({ storage: storagePost }); 

//rendering home page
router.get("/", async (req, res) => {
  // Get posts and owners as plain JS objects
  const posts = await Blog.find({}).populate("owner").lean();

  // Collect post IDs to fetch all likes in one go
  const postIds = posts.map(p => p._id);
  const likes = await Like.find({ post: { $in: postIds } }).lean();

  // Group likes by post
  const likesByPost = likes.reduce((acc, like) => {
    const key = like.post.toString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(like);
    return acc;
  }, {});

  // Attach likes array to each post (always an array)
  const postsWithLikes = posts.map(p => ({
    ...p,
    likes: likesByPost[p._id.toString()] || [],
  }));

  res.render("posts/index.ejs", { posts: postsWithLikes });
});

//rendering form for new post
router.get("/new", isLoggedIn, (req,res)=>{                 
    res.render("posts/newform.ejs");
});

//rendering the data of a new post from newform.ejs and pushing it inside Blog collection
router.post("/", isLoggedIn, upload.single("image"), async (req, res)=>{     
    try{
        const content = req.body.content; 
        const username = req.user.username; 
     
        const newPost = new Blog({
            username,
            content, 
            owner: req.user._id
        });

        if (req.file) {
            newPost.image = req.file.path;
            newPost.imagePublicId = req.file.filename;
        }

        await newPost.save();
        res.redirect("/posts"); 
    }catch(err){
        console.log("Error creating a new post:", err); 
        res.status(500).send("Something went wrong while uploading new post");
    }   
});

 //viewing each post in details
router.get("/:id", isLoggedIn, async (req, res)=>{               
    const post = await Blog.findById(req.params.id).populate("owner"); 
    const likes = await Like.find({post: req.params.id}).populate("user");
    const comment = await Comment.find({post: req.params.id}).populate("user");
    res.render("posts/postindetail.ejs", {eachpost: post, likes, comment});
});

//redering editpost.ejs file for the form to edit content 
router.get("/:id/edit", isLoggedIn, isOwner, async (req,res)=>{          
    let {id} = req.params; 
    const eachpost = await Blog.findById(id);
    res.render("posts/editpost.ejs", {eachpost});
});

//updating the post
router.patch("/:id", isLoggedIn, isOwner, upload.single("image"), async (req, res)=>{            
    let {id} = req.params; 
    const {content} = req.body; 

    const post = await Blog.findById(id);

    if (!post) {
        req.flash("error", "Post not found");
        return res.redirect("/posts");
    }

    post.content = content;

    // delete old image from Cloudinary (if there is one)
    if (req.file) {
    
        if (post.imagePublicId) {
            try {
                await cloudinary.uploader.destroy(post.imagePublicId);
            } catch (e) {
                console.warn("Failed to delete old Cloudinary image:", e.message);
            }
        }

        post.image = req.file.path;
        post.imagePublicId = req.file.filename;
    }

    await post.save();
    res.redirect("/posts"); 
});

//implementing delete function for each post
router.delete("/:id", isLoggedIn, isOwner, async (req, res)=>{     
    const {id}= req.params; 
    const post = await Blog.findById(id);

     if (post) {
        if (post.imagePublicId) {
            try {
                await cloudinary.uploader.destroy(post.imagePublicId);
            } catch (e) {
                console.warn("Failed to delete Cloudinary image:", e.message);
            } 
        }
        await Blog.findByIdAndDelete(id);
  }

    res.redirect("/posts");
});

//api route for likes 
router.post("/:id/like", isLoggedIn, async(req, res)=>{
    const postId = req.params.id; 
    const userId = req.user._id; 

    const existingLike = await Like.findOne({post: postId, user: userId});

    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id); 
    }else {
        await Like.create({post: postId, user: userId}); 
    }

    res.redirect("/posts"); 
});

//api route for comment
router.post("/:id/comment", isLoggedIn, async(req, res)=>{
    const postId = req.params.id;
    const userId = req.user._id; 
    const content = req.body.content; 

    await Comment.create({post: postId, user: userId, content});

    res.redirect(`/posts/${postId}`); 
});
 
module.exports = router; 






// const user = require("../models/user.js");
// const comment = require("../models/comment.js");

// set up storage destination and filename
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'public/Images'); // upload destination 
//     },
//     filename: function (req, file, cb) {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         const ext = path.extname(file.originalname);
//         cb(null, file.fieldname + '-' + uniqueSuffix + ext); // e.g., image-173849238.jpg
//     }
// });

// const upload = multer({ storage: storage }); 


   // let imagePath = ""; 
        // if(req.file){
        //     imagePath = "/Images/"+req.file.filename;
        // }

//api route to render the main page containing all posts
// router.get("/", async (req, res)=>{                        
//     const posts = await Blog.find({}).populate("owner"); 
//     for(let post of posts){
//         post.likes = await Like.find({post: post._id});
//     }
//     res.render("posts/index.ejs", {posts});
// });
//api route for viewing other users post via postindetails.ejs
// router.get("/:id", isLoggedIn, async(req, res)=>{
//     try{
//         const postId = req.params.id; 
//         const eachpost = await Blog.findById(postId).populate("owner", "username profilePic").populate({
//             path: "likes", 
//             populate: {path: "user", select: "username"}
//         }).populate({
//             path: "comments", 
//             populate: {path: "user", select: "username"}
//         });

//         if(!eachpost){
//             req.flash("error", "Post not found");
//             return res.redirect("/posts");
//         }

//         res.render("posts/postindetails.ejs", {
//             eachpost,
//             likes: eachpost.likes || [], 
//             comment: eachpost.comment || []
//         });
//     } catch(err){
//         console.log(err);
//         req.flash("error", "Something went wrong");
//         res.redirect("/posts");
//     }
// });