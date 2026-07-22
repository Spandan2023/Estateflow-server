import express from "express";

import {
  createInquiry,
  getAllInquiries,
  getInquiryById,
  getMyInquiries,
  assignInquiry,
  updateInquiryStatus,
  deleteInquiry,
} from "../controllers/inquiryController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// ===============================
// Public Route
// ===============================

router.post("/", createInquiry);

// ===============================
// Employee Route
// Must appear BEFORE "/:id"
// ===============================

router.get("/my", protect, getMyInquiries);

// ===============================
// Admin Routes
// ===============================

router.get("/", protect, getAllInquiries);

router.get("/:id", protect, getInquiryById);

router.patch("/:id/assign", protect, assignInquiry);

router.patch("/:id/status", protect, updateInquiryStatus);

router.delete("/:id", protect, deleteInquiry);

export default router;