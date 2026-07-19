import User from "../models/User.js";

const isAdmin = (user) => user?.role === "admin";

const safeEmployee = (employee) => ({
  _id: employee._id,
  employeeId: employee.employeeId,
  fullName: employee.fullName,
  email: employee.email,
  phone: employee.phone,
  role: employee.role,
  level: employee.level,
  commission: employee.commission,
  propertiesSold: employee.propertiesSold,
  status: employee.status,
  approvalNote: employee.approvalNote,
  approvedBy: employee.approvedBy,
  approvedAt: employee.approvedAt,
  createdAt: employee.createdAt,
  updatedAt: employee.updatedAt,
});

// Admin: pending employee signup applications.
export const getPendingEmployeeRequests = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        message: "Only administrators can view employee requests.",
      });
    }

    const employees = await User.find({
      role: "employee",
      status: "Pending",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: employees.length,
      employees,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Admin: approve or reject a pending employee application.
export const reviewEmployeeRequest = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        message: "Only administrators can review employee requests.",
      });
    }

    const { status, approvalNote } = req.body;

    if (!["Active", "Rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be Active or Rejected.",
      });
    }

    const employee = await User.findById(req.params.id);

    if (!employee || employee.role !== "employee") {
      return res.status(404).json({
        message: "Employee request not found.",
      });
    }

    if (employee.status !== "Pending") {
      return res.status(400).json({
        message: "Only pending employee requests can be reviewed.",
      });
    }

    employee.status = status;
    employee.approvalNote = approvalNote || "";
    employee.approvedBy = req.user._id;
    employee.approvedAt = new Date();

    const updatedEmployee = await employee.save();

    res.status(200).json({
      message:
        status === "Active"
          ? "Employee approved successfully."
          : "Employee request rejected successfully.",
      employee: safeEmployee(updatedEmployee),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Admin: list employee records with optional search and filters.
export const getEmployees = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        message: "Only administrators can view employees.",
      });
    }

    const { search, status, level } = req.query;

    const filter = {
      role: "employee",
    };

    if (status) {
      filter.status = status;
    }

    if (level !== undefined && level !== "") {
      filter.level = Number(level);
    }

    if (search) {
      filter.$or = [
        { fullName: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { employeeId: new RegExp(search, "i") },
        { phone: new RegExp(search, "i") },
      ];
    }

    const employees = await User.find(filter)
      .select("-password")
      .populate("approvedBy", "fullName employeeId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: employees.length,
      employees,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Admin: activate or deactivate an approved employee.
export const updateEmployeeStatus = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        message: "Only administrators can update employee status.",
      });
    }

    const { status } = req.body;

    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({
        message: "Status must be Active or Inactive.",
      });
    }

    const employee = await User.findById(req.params.id);

    if (!employee || employee.role !== "employee") {
      return res.status(404).json({
        message: "Employee not found.",
      });
    }

    employee.status = status;

    const updatedEmployee = await employee.save();

    res.status(200).json({
      message: `Employee marked as ${status}.`,
      employee: safeEmployee(updatedEmployee),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Employee: may update only their contact number.
export const updateMyPhone = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        message: "A valid phone number is required.",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    user.phone = phone.trim();

    const updatedUser = await user.save();

    res.status(200).json({
      message: "Phone number updated successfully.",
      user: safeEmployee(updatedUser),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
// Admin: update permitted employee details.
// Employee ID, role, level, commission, sales, and approval data are protected.
export const updateEmployeeDetails = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        message: "Only administrators can update employee details.",
      });
    }

    const { fullName, email, phone } = req.body;

    const employee = await User.findById(req.params.id);

    if (!employee || employee.role !== "employee") {
      return res.status(404).json({
        message: "Employee not found.",
      });
    }

    if (!["Active", "Inactive"].includes(employee.status)) {
      return res.status(400).json({
        message:
          "Pending or rejected employee requests must be reviewed through the approval process.",
      });
    }

    if (fullName !== undefined) {
      if (!fullName.trim()) {
        return res.status(400).json({
          message: "Full name cannot be empty.",
        });
      }

      employee.fullName = fullName.trim();
    }

    if (phone !== undefined) {
      if (!phone.trim()) {
        return res.status(400).json({
          message: "Phone number cannot be empty.",
        });
      }

      employee.phone = phone.trim();
    }

    if (email !== undefined) {
  if (!email.trim()) {
    return res.status(400).json({
      message: "Email address cannot be empty.",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: employee._id },
      });

      if (existingUser) {
        return res.status(400).json({
          message: "This email address is already in use.",
        });
      }

      employee.email = normalizedEmail;
    }

    const updatedEmployee = await employee.save();

    res.status(200).json({
      message: "Employee details updated successfully.",
      employee: safeEmployee(updatedEmployee),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
