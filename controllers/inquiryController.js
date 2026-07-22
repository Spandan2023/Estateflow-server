import Inquiry from "../models/Inquiry.js";
import Property from "../models/Property.js";
import User from "../models/User.js";

const isAdmin = (user) => user?.role === "admin";

// ==========================================
// Public - Create Inquiry
// ==========================================
export const createInquiry = async (req, res) => {
  try {
    const { customerName, phone, email, message, source, property } = req.body;

    if (!customerName || !phone || !message || !source) {
      return res.status(400).json({
        message: "Please fill all required fields.",
      });
    }

    if (!["landing", "property"].includes(source)) {
      return res.status(400).json({
        message: "Invalid inquiry source.",
      });
    }

    if (source === "property") {
      if (!property) {
        return res.status(400).json({
          message: "Property is required.",
        });
      }

      const propertyExists = await Property.findById(property);

      if (!propertyExists) {
        return res.status(404).json({
          message: "Property not found.",
        });
      }
    }

    const inquiry = await Inquiry.create({
      customerName,
      phone,
      email,
      message,
      source,
      property: source === "property" ? property : null,
    });

    res.status(201).json({
      message: "Inquiry submitted successfully.",
      inquiry,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// Employee - Get My Assigned Inquiries
// ==========================================
export const getMyInquiries = async (req, res) => {
  try {
    if (req.user?.role !== "employee") {
      return res.status(403).json({
        message: "Only employees can view assigned inquiries.",
      });
    }

    const inquiries = await Inquiry.find({
      assignedEmployee: req.user._id,
    })
      .populate("property", "title city address price priceRange")
      .populate("assignedBy", "fullName employeeId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: inquiries.length,
      inquiries,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// Admin - Get All Inquiries
// ==========================================
export const getAllInquiries = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        message: "Only administrators can view inquiries.",
      });
    }

    const inquiries = await Inquiry.find()
      .populate("property", "title city price")
      .populate("assignedEmployee", "fullName employeeId email")
      .populate("assignedBy", "fullName employeeId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: inquiries.length,
      inquiries,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// Admin - Get Single Inquiry
// ==========================================
export const getInquiryById = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        message: "Only administrators can view inquiries.",
      });
    }

    const inquiry = await Inquiry.findById(req.params.id)
      .populate("property")
      .populate("assignedEmployee", "fullName employeeId email phone")
      .populate("assignedBy", "fullName employeeId");

    if (!inquiry) {
      return res.status(404).json({
        message: "Inquiry not found.",
      });
    }

    res.status(200).json({
      inquiry,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// Admin - Assign Inquiry to Employee
// ==========================================
export const assignInquiry = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        message: "Only administrators can assign inquiries.",
      });
    }

    const { assignedEmployee, notes } = req.body;

    if (!assignedEmployee) {
      return res.status(400).json({
        message: "Please select an employee.",
      });
    }

    const inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        message: "Inquiry not found.",
      });
    }

    const employee = await User.findById(assignedEmployee);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found.",
      });
    }

    if (employee.role !== "employee") {
      return res.status(400).json({
        message: "Selected user is not an employee.",
      });
    }

    if (employee.status !== "Active") {
      return res.status(400).json({
        message: "Only active employees can receive inquiries.",
      });
    }

    inquiry.assignedEmployee = employee._id;
    inquiry.assignedBy = req.user._id;
    inquiry.status = "assigned";

    if (notes !== undefined) {
      inquiry.notes = notes;
    }

    const updatedInquiry = await inquiry.save();

    res.status(200).json({
      message: "Inquiry assigned successfully.",
      inquiry: updatedInquiry,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// Admin - Update Inquiry Status
// ==========================================
export const updateInquiryStatus = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        message: "Only administrators can update inquiry status.",
      });
    }

    const { status } = req.body;

    if (!["new", "assigned", "resolved"].includes(status)) {
      return res.status(400).json({
        message: "Invalid inquiry status.",
      });
    }

    const inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        message: "Inquiry not found.",
      });
    }

    inquiry.status = status;

    const updatedInquiry = await inquiry.save();

    res.status(200).json({
      message: "Inquiry updated successfully.",
      inquiry: updatedInquiry,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// Admin - Delete Inquiry
// ==========================================
export const deleteInquiry = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        message: "Only administrators can delete inquiries.",
      });
    }

    const inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        message: "Inquiry not found.",
      });
    }

    await inquiry.deleteOne();

    res.status(200).json({
      message: "Inquiry deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};