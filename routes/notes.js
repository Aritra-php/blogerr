const express=require("express");   //require express package
const router=express.Router();
const Note = require("../models/note.js"); //require Note model

//require middleware for authorization
const { isLoggedIn, isOwner } = require("../middleware.js");


//api route for fetching notes.ejs 
router.get("/", isLoggedIn, async(req, res)=>{
    const notes = await Note.find({owner: req.user._id}).sort({createdAt: -1}); 
    res.render("notes/notes.ejs", {notes}); 
});

//post api route for creating new note 
router.post("/", isLoggedIn, async(req, res)=>{
    const {content} = req.body; 
    const newNote = new Note({
        content, 
        owner : req.user._id
    }); 
    await newNote.save(); 
    req.flash("success", "Noted!!"); 
    res.redirect("/notes"); 
});

//api route for updating note content
router.patch("/:id", isLoggedIn, async(req, res)=>{
    const {content} = req.body; 
    const note = await Note.findOne({_id: req.params.id, owner: req.user._id}); 
    if(!note){
        req.flash("error", "No Note found!!"); 
        return res.redirect("/notes"); 
    }
    note.content = content; 
    await note.save(); 
    req.flash("success", "Note was updated");
    res.redirect("/notes"); 
});


//api route for deleting notes 
router.delete("/:id", isLoggedIn, async(req, res)=>{
    await Note.findOneAndDelete({_id: req.params.id, owner: req.user._id}); 
    req.flash("success", "Note Deleted"); 
    res.redirect("/notes"); 
}); 

module.exports = router; 