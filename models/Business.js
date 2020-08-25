const mongoose = require("mongoose");

const Schema = mongoose.Schema;
var businessSchema = new Schema({
    email: { type: String, required: true },
    name: { type: String, required: true },
    createdAt: { type: Date, default: Date.now() },
    registrationNo: { type: String, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Business", businessSchema);
