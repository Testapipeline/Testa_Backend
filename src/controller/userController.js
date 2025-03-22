require('dotenv').config();
const Admin = require("../models/admin");
const bcrypt = require("bcrypt");
const Student = require("../models/student");
const Instructor = require("../models/instructor");
const nodemailer = require("nodemailer");
const Otp = require('../models/Otp');


const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    },
});

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await Admin.findOne({ email });
        if (user && user.status !== "Deleted" && await bcrypt.compare(password, user.password)) {
            user.password = undefined;
            return res.status(200).json({user});
        }

        user = await Student.findOne({ email });
        if (user && user.status !== "Deleted" && await bcrypt.compare(password, user.password)) {
            user.password = undefined;
            return res.status(200).json({user});
        }

        user = await Instructor.findOne({ email });
        if (user && user.status !== "Deleted" && user.status !== "Pending" && user.status !== "Rejected" && await bcrypt.compare(password, user.password)) {
            user.password = undefined;
            return res.status(200).json({user});
        }

        res.status(401).json({ error: "Invalid email or password" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.sendVerificationCode = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await Admin.findOne({ email }) ||
            await Student.findOne({ email }) ||
            await Instructor.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const code = Math.floor(1000 + Math.random() * 9000).toString();

        await Otp.deleteMany({ email });

        await Otp.create({ email, code });

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: "TESTA Password Reset Verification",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; max-width: 500px; margin: auto;">
                    <h2 style="color: #0d6efd; text-align: center;">🔑 Password Reset Request</h2>
                    <p style="font-size: 16px;">Hello,</p>
                    <p style="font-size: 16px;">We received a request to reset your password. Use the code below to proceed:</p>
                    <div style="padding: 15px; border-radius: 8px; background-color: #f0f0f0; margin: 20px 0; text-align: center;">
                        <span style="font-size: 24px; font-weight: bold; color: #0d6efd;">${code}</span>
                    </div>
                    <p style="font-size: 16px;">If you didn't request this, please ignore this email.</p>
                    <p style="font-size: 14px; color: #888;">Thank you,<br/>The Testa Team</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Verification code sent successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.verifyOTP = async (req, res) => {
    const { email, code} = req.params;

    try {
        const otpRecord = await Otp.findOne({ email, code });

        if (!otpRecord) {
            return res.status(400).json({ error: "Invalid or expired code" });
        }

        await Otp.deleteOne({ email, code });

        res.status(200).json({ message: "Email Successfully Verified!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    const { email, password } = req.body;

    try {

        const user = await Admin.findOne({ email }) ||
            await Student.findOne({ email }) ||
            await Instructor.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: "Password successfully reset" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {

        let existingUser = await Admin.findOne({ email }) || await Student.findOne({ email }) || await Instructor.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let user;
        if (role === "student") {
            user = new Student({ name, email, password: hashedPassword });
        } else if (role === "instructor") {
            user = new Instructor({ name, email, password: hashedPassword });
        } else {
            return res.status(400).json({ error: "Invalid role" });
        }

        await user.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    const { role, id } = req.params;
    try {
        let user;
        if (role === "admin") {
            user = await Admin.findById(id);
        } else if (role === "student") {
            user = await Student.findById(id);
        } else if (role === "instructor") {
            user = await Instructor.findById(id);
        } else {
            return res.status(400).json({ error: "Invalid role" });
        }

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.status = "Deleted";
        await user.save();
        res.status(200).json({ message: "User deleted successfully!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.getAllInstructors = async (req, res) => {
    try {
        const instructors = await Instructor.find().select("name email status role createdDate");
        res.status(200).json(instructors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getPendingInstructors = async (req, res) => {
    try {
        const pendingInstructors = await Instructor.find({ status: "Pending" }).select("name email status role createdDate");
        res.status(200).json(pendingInstructors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.userApproval = async (req, res) => {
    const { userId, status } = req.params;

    if (!["Approved", "Rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
    }

    try {
        const user = await Instructor.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.status = status;
        await user.save();
        res.status(200).json({ message: `User ${status.toLowerCase()} successfully` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};