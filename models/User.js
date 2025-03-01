const mongoose = require("mongoose");

const mongoosePaginate = require("mongoose-paginate-v2");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const schema = mongoose.Schema(
  {
    //essential
    email: {
      type: String,
      unique: true,
      required: true,
    },
    name: { type: String, required: true },
    StoreAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    phone: String,
    address: { type: String },
    password: { type: String, required: true },
    tag: { type: String },
    gender: { type: String },
    referencedUserId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    dob: { type: Date },
    photo: [{ type: Object }],
    role: {
      type: String,
      enum: [
        "su",
        "admin",
        "user",
      ],
      required: true,
    },
    referenceCode: { type: String },

    referenceCodeCount: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },

    points: { type: Number, default: 0 },

    corePoints: { type: Number, default: 0 },

    addedStocks: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, required: true },
        addedAt: { type: Date, default: Date.now },
      },
    ],

  },
  {
    timestamps: true,
  }
);


schema.pre("save", async function save(next) {
  if (this.isModified("email")) {
    this.email = this.email.toLowerCase();
  }
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, saltRounds);
    return next();
  } catch (err) {
    return next(err);
  }
});

schema.virtual("club", {
  ref: "Org",
  localField: "orgs",
  foreignField: "_id",
});
schema.index({ email: 1, role: 1 }, { unique: true });
schema.index({ email: "text", name: "text", phone: "text" });
schema.index({ phone: 1 }, { unique: true });
schema.set("toObject", { virtuals: true });
schema.set("toJSON", { virtuals: true });
schema.plugin(mongoosePaginate);
module.exports = mongoose.model("User", schema);
