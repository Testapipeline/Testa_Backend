const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");

router.post("/login", userController.login);
router.post("/register", userController.register);
router.get("/deleteUser/:role/:id", userController.deleteUser);
router.get("/getInstructors", userController.getAllInstructors);
router.get("/userApproval/:userId/:status", userController.userApproval);
router.get("/getPendingInstructors", userController.getPendingInstructors);

module.exports = router;