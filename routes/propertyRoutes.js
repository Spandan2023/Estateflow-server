import express from "express";

import {
  createProperty,
  deleteProperty,
  getAllProperties,
  getFeaturedProperties,
  getMyProperties,
  getPropertyById,
  getPublicProperties,
  reviewProperty,
  updateProperty,
} from "../controllers/propertyController.js";

import protect from "../middleware/authMiddleware.js";
import { propertyUpload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Public APIs
router.get("/", getPublicProperties);
router.get("/featured", getFeaturedProperties);
router.get("/:id", getPropertyById);

// Logged-in admin / employee APIs
router.post("/", protect, propertyUpload, createProperty);
router.get("/my/submissions", protect, getMyProperties);
router.put("/:id", protect, propertyUpload, updateProperty);

// Admin permissions are also enforced inside these controller functions
router.get("/admin/all", protect, getAllProperties);
router.patch("/:id/review", protect, reviewProperty);
router.delete("/:id", protect, deleteProperty);

export default router;