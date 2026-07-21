import mongoose from "mongoose";

const inquirySchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      default: "",
      lowercase: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    // Where the inquiry originated
    source: {
      type: String,
      enum: ["landing", "property"],
      required: true,
    },

    // Null when inquiry comes from landing page
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null,
    },

    // Employee assigned by admin
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Admin who assigned it
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: ["new", "assigned", "resolved"],
      default: "new",
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Inquiry", inquirySchema);