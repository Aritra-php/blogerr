// scripts/migrateToCloudinary.js
require("dotenv").config();

const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { cloudinary } = require("../confiq/cloudinary");   
const Blog = require("../models/blog");
const User = require("../models/user");

// Use env if provided, else your local dev DB
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/blogerr";

const imagesRoot = path.join(__dirname, "..", "public", "Images");
const profilesRoot = path.join(__dirname, "..", "public", "profilepics");

function toDiskPathFromDbValue(dbPathValue, root) {
  // db values look like "/Images/xyz.jpg" or "/profilepics/abc.jpg"
  // We need a real path under public/
  const rel = dbPathValue.startsWith("/") ? dbPathValue.slice(1) : dbPathValue;
  return path.join(__dirname, "..", "public", rel);
}

async function migratePosts() {
  const posts = await Blog.find({});
  let migrated = 0,
    skipped = 0,
    missing = 0;

  for (const post of posts) {
    try {
      if (!post.image) {
        skipped++;
        continue;
      }

      // Already a URL? (means already migrated)
      if (
        post.image.startsWith("http://") ||
        post.image.startsWith("https://")
      ) {
        skipped++;
        continue;
      }

      // Expecting something like "/Images/filename.jpg"
      const diskPath = toDiskPathFromDbValue(post.image, imagesRoot);
      if (!fs.existsSync(diskPath)) {
        console.warn("Missing file for post", post._id.toString(), diskPath);
        missing++;
        continue;
      }

      const res = await cloudinary.uploader.upload(diskPath, {
        folder: "blogerr/posts",
      });

      post.image = res.secure_url;
      post.imagePublicId = res.public_id;
      await post.save();

      migrated++;
      console.log("Migrated post:", post._id.toString());
    } catch (e) {
      console.error("Error migrating post", post._id.toString(), e.message);
    }
  }

  console.log(
    `Posts -> migrated: ${migrated}, skipped: ${skipped}, missing: ${missing}`
  );
}

async function migrateUsers() {
  const users = await User.find({});
  let migrated = 0,
    skipped = 0,
    missing = 0;

  for (const user of users) {
    try {
      if (!user.profilePic) {
        skipped++;
        continue;
      }

      // Already URL?
      if (
        user.profilePic.startsWith("http://") ||
        user.profilePic.startsWith("https://")
      ) {
        skipped++;
        continue;
      }

      // Expecting "/profilepics/filename.jpg"
      const diskPath = toDiskPathFromDbValue(user.profilePic, profilesRoot);
      if (!fs.existsSync(diskPath)) {
        console.warn("Missing file for user", user._id.toString(), diskPath);
        missing++;
        continue;
      }

      const res = await cloudinary.uploader.upload(diskPath, {
        folder: "blogerr/profilepics",
      });

      user.profilePic = res.secure_url;
      user.profilePicPublicId = res.public_id;
      await user.save();

      migrated++;
      console.log("Migrated user:", user._id.toString());
    } catch (e) {
      console.error("Error migrating user", user._id.toString(), e.message);
    }
  }

  console.log(
    `Users -> migrated: ${migrated}, skipped: ${skipped}, missing: ${missing}`
  );
}

(async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("DB connected");

    await migratePosts();
    await migrateUsers();

    await mongoose.disconnect();
    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
