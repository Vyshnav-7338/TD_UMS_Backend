const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    productId: { type: Number, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    StoreAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    image:{type:Object},
    userStock: { type: Number, required: true, default: 0 }, // User-added stock
  stockAddedByUsers: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      quantity: { type: Number, required: true },
      addedAt: { type: Date, default: Date.now },
    },
  ],
   
},
{ timestamps: true });

module.exports = mongoose.model("Product", ProductSchema);