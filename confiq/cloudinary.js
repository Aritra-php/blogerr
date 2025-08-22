// config/cloudinary.js (CommonJS)
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// credentials come from process.env (never hardcode!)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use separate folders to keep things tidy
const storagePost = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "blogerr/posts",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    // NOTE: public_id is auto-generated; multer will expose it as req.file.filename
  },
});

const storageProfile = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "blogerr/profilepics",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

module.exports = { cloudinary, storagePost, storageProfile };
