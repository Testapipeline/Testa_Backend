const mongoose = require("mongoose");

const ExamSchema = new mongoose.Schema({
    authorId: String,
    author: String,
    name: String,
    department: String,
    course: String,
    level: String,
    unitName: String,
    description: String,
    filePath: String,
    price: Number,
    topics: [String],
    status: { type: String, default: "Pending" },
    createdDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Exam", ExamSchema);