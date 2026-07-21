import express from "express";

import {
  createInquiry,
  getAllInquiries,
  getInquiryById,
  assignInquiry,
  updateInquiryStatus,
  deleteInquiry,
} from "../controllers/inquiryController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// ===============================
// Public Routes
// ===============================

// Landing page & Property page inquiry form
router.post("/", createInquiry);

// ===============================
// Admin Routes
// ===============================

// View all inquiries
router.get("/", protect, getAllInquiries);

// View single inquiry
router.get("/:id", protect, getInquiryById);

// Assign inquiry to an employee
router.patch("/:id/assign", protect, assignInquiry);

// Update inquiry status
router.patch("/:id/status", protect, updateInquiryStatus);

// Delete inquiry
router.delete("/:id", protect, deleteInquiry);

export default router;