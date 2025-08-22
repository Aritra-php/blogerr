const Blog = require("./models/blog.js"); //require Blog collection or model 
const User = require("./models/user.js"); //require User model 

//middleware setup for authitication 
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()) return next(); 
    req.flash("error", "You must be logged in first"); 
    res.redirect("/login"); 
}

async function isOwner(req, res, next) {
    try {
        const post = await Blog.findById(req.params.id);
        if (!post) {
            req.flash("error", "Post not found!!");
            return res.redirect("/posts");
        }

        if (post.owner && post.owner.toString()===req.user._id.toString()) {
            return next();
        } else {
            req.flash("error", "You don't have permission!!");
            return res.redirect("/posts");
        }
    } catch (err) {
        console.log(err);
        req.flash("error", "Something went wrong!!");
        return res.redirect("/posts");
    }
}

// Export for routes
module.exports = {
    isLoggedIn,
    isOwner
};