const mongoose = require("mongoose");

const InstructorSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: { type: String, default: "instructor" },
    status: { type: String, default: "Pending" },
    createdDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Instructor", InstructorSchema);