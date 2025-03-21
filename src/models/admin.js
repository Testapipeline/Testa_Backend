const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: { type: String, default: "admin" },
    status: { type: String, default: null },
    createdDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Admin", AdminSchema);