const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({
    email: String,
    code: String,
    createdDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Otp", OtpSchema);