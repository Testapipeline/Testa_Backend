require('dotenv').config();
const { google } = require("googleapis");
const { PassThrough } = require("stream");
const Department = require("../models/department");
const Course = require("../models/course");
const Exam = require("../models/exam");
const BuyExam = require("../models/buyExam");
const Student = require("../models/student");

const googleCredentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf-8'));

const auth = new google.auth.GoogleAuth({
    credentials: googleCredentials,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
});

const drive = google.drive({ version: "v3", auth });

exports.uploadExam = async (req, res) => {
    const { authorId, author, name, department, course, level, unitName, description, price, topics } = req.body;

    if (!req.file) {
        return res.status(400).json({ error: "File is required" });
    }

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    try {
        const bufferStream = new PassThrough();
        bufferStream.end(req.file.buffer);

        const fileMetadata = {
            name: req.file.originalname,
            parents: [folderId],
        };
        const media = {
            mimeType: req.file.mimetype,
            body: bufferStream,
        };

        const file = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: "id, webViewLink",
        });

        const googleDriveFileId = file.data.id;
        const googleDriveFileUrl = file.data.webViewLink;

        await drive.permissions.create({
            fileId: googleDriveFileId,
            requestBody: {
                role: "reader",
                type: "anyone",
                allowFileDiscovery: false,
            },
        });

        await drive.files.update({
            fileId: googleDriveFileId,
            requestBody: {
                viewersCanCopyContent: false,
                copyRequiresWriterPermission: true,
                writersCanShare: false,
            },
        });

        const exam = new Exam({
            authorId,
            author,
            name,
            department,
            course,
            level,
            unitName,
            description,
            filePath: googleDriveFileUrl,
            price,
            topics: JSON.parse(topics),
        });

        await exam.save();
        res.status(201).json({ message: "Exam uploaded successfully", filePath: googleDriveFileUrl });
    } catch (error) {
        console.error("Error uploading exam: ", error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.getAllDepartments = async (req, res) => {
    const departments = await Department.find();
    res.json(departments);
};

exports.getAllCourses = async (req, res) => {
    const courses = await Course.find();
    res.json(courses);
};

exports.getExams = async (req, res) => {
    try {
        const exams = await Exam.find();
        res.status(200).json(exams);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getApprovedExams = async (req, res) => {
    try {
        const approvedExams = await Exam.find({ status: "Approved" });
        res.status(200).json(approvedExams);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.examApproval = async (req, res) => {
    const { examId, status } = req.params;

    if (!["Approved", "Rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
    }

    try {
        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ error: "Exam not found" });
        }

        exam.status = status;
        await exam.save();
        res.status(200).json({ message: `Exam ${status.toLowerCase()} successfully` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.buyExam = async (req, res) => {
    const { examId, userId, status } = req.body;

    try {
        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ error: "Exam not found" });
        }

        const student = await Student.findById(userId);
        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        const buyExam = new BuyExam({
            examId,
            userId,
            status,
        });

        await buyExam.save();
        res.status(201).json({ message: "Exam purchased successfully" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.getPurchasedExams = async (req, res) => {
    const { userId } = req.params;

    try {
        const purchasedExams = await BuyExam.find({ userId });
        if (!purchasedExams.length) {
            return res.status(404).json({ error: "No purchased exams found" });
        }

        const examIds = purchasedExams.map(purchase => purchase.examId);
        const exams = await Exam.find({ _id: { $in: examIds } });

        res.status(200).json(exams);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getExamsByAuthor = async (req, res) => {
    const { authorId } = req.params;

    try {
        const exams = await Exam.find({ authorId });
        res.status(200).json(exams);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getApprovedExamByExamId = async (req, res) => {
    const { examId } = req.params;

    try {
        const exam = await Exam.findOne({ _id: examId, status: "Approved" });
        if (!exam) {
            return res.status(404).json({ error: "Approved exam not found" });
        }

        res.status(200).json(exam);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};