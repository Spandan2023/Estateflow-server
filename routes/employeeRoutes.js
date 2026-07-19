import express from "express";

import {
  getEmployees,
  getPendingEmployeeRequests,
  reviewEmployeeRequest,
  updateEmployeeStatus,
  updateMyPhone,
  updateEmployeeDetails,
} from "../controllers/employeeController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getEmployees);
router.get("/pending", protect, getPendingEmployeeRequests);

router.patch("/me/phone", protect, updateMyPhone);
router.patch("/:id/review", protect, reviewEmployeeRequest);
router.patch("/:id/status", protect, updateEmployeeStatus);
router.patch("/:id", protect, updateEmployeeDetails);

export default router;