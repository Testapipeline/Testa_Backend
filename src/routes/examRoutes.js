const express = require("express");
const router = express.Router();
const multer = require("multer");
const examController = require("../controller/examController");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
});

router.post("/upload", upload.single("file"), examController.uploadExam);
router.get("/getDepartments", examController.getAllDepartments);
router.get("/getCourses", examController.getAllCourses);
router.get("/getExams", examController.getExams);
router.get("/getApprovedExams", examController.getApprovedExams);
router.get("/examApproval/:examId/:status", examController.examApproval);
router.post("/buyExams", examController.buyExam);
router.get("/getPurchasedExams/:userId", examController.getPurchasedExams);
router.get("/getExamsByAuthor/:authorId", examController.getExamsByAuthor);
router.get("/getApprovedExamByExamId/:examId", examController.getApprovedExamByExamId);

module.exports = router;

