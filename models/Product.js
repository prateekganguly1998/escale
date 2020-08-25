const mongoose = require("mongoose");

const Schema = mongoose.Schema;
var productSchema = new Schema({
    title: { type: String, required: true },
    createdAt: { type: Date, default: Date.now() },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    businessId: { type: Schema.Types.ObjectId, ref: "Business" },
});

module.exports = mongoose.model("Product", productSchema);
