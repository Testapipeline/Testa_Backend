const mongoose = require("mongoose");

const BuyExamSchema = new mongoose.Schema({
    examId: String,
    userId: String,
    status: String,
    createdDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("BuyExam", BuyExamSchema);