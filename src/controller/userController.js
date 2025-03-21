const Admin = require("../models/admin");
const bcrypt = require("bcrypt");
const Student = require("../models/student");
const Instructor = require("../models/instructor");

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

exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        // Check if email already exists
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