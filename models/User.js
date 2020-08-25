const mongoose = require("mongoose");

const Schema = mongoose.Schema;
var userSchema = new Schema({
    email:{type:String,required:true},
    username:{type:String,required:true},
    password:{type:String,required:true},
    createdAt: { type: Date, default: Date.now() },
    imageUrl: { type: String },
});

userSchema.methods.comparePassword = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function (
        err,
        isMatch
    ) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

module.exports = mongoose.model("User", userSchema);
