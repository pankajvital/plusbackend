const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const Product = require("../models/Product");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post("/addproduct", upload.single("img"), async (req, res) => {
  try {
    const { name, type, length, height, width } = req.body;
    const volume = parseFloat((length * height * width).toFixed(3));

    if (!req.file) {
      return res.status(400).json({ error: "Image file is required." });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "auto" },
        (error, cloudinaryResult) => {
          if (error) {
            reject(error);
          } else {
            resolve(cloudinaryResult);
          }
        }
      );
      stream.end(req.file.buffer);
    });

    const product = new Product({
      name,
      type,
      length,
      height,
      width,
      volume,
      img: result.secure_url,
    });

    const savedProduct = await product.save();
    return res.status(200).json(savedProduct);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/getallproducts", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
