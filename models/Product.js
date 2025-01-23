const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  img: { type: String, required: true }, 
  type: { type: String, required: true },
  length: { type: Number, required: true },
  height: { type: Number, required: true },
  width: { type: Number, required: true },
  volume: { type: Number, required: true },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
