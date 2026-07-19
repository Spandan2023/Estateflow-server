import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      unique: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["admin", "employee"],
      default: "employee",
    },

    level: {
      type: Number,
      enum: [0, 1, 2],
      default: 0,
    },

    commission: {
      type: Number,
      default: 8,
    },

    propertiesSold: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Pending", "Active", "Inactive", "Rejected"],
      default: "Pending",
    },

    approvalNote: {
      type: String,
      trim: true,
      default: "",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);