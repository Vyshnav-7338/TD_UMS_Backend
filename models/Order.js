const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    orderId:{type:String},
    StoreAdmin:{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    referrerName: { type: String }, 
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
      }
    ],
    paymentMethod: { type: String, enum: ["cash", "card", "upi"], required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "completed", "cancelled"], default: "completed" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
