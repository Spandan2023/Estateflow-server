import User from "../models/User.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";

const formatUser = (user) => ({
  _id: user._id,
  employeeId: user.employeeId,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  level: user.level,
  commission: user.commission,
  propertiesSold: user.propertiesSold,
  status: user.status,
});

// Signup: every public applicant is an employee with Pending status.
export const signup = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        message: "Please fill all fields.",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const lastEmployee = await User.findOne({})
      .sort({ createdAt: -1 })
      .select("employeeId");

    let employeeId = "EMP0001";

    if (lastEmployee?.employeeId) {
      const lastNumber = parseInt(
        lastEmployee.employeeId.replace("EMP", ""),
        10
      );

      employeeId = `EMP${String(lastNumber + 1).padStart(4, "0")}`;
    }

    const user = await User.create({
      employeeId,
      fullName,
      email,
      password: hashedPassword,
      phone,
      role: "employee",
      status: "Pending",
    });

    // No JWT is returned here. Pending applicants cannot access the CRM.
    res.status(201).json({
      message:
        "Registration submitted successfully. Please wait for administrator approval.",
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Login: only Active users receive JWT access.
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials.",
      });
    }

    if (user.status === "Pending") {
      return res.status(403).json({
        message:
          "Your employee registration is pending administrator approval.",
      });
    }

    if (user.status === "Rejected") {
      return res.status(403).json({
        message: "Your employee registration has been declined.",
      });
    }

    if (user.status === "Inactive") {
      return res.status(403).json({
        message:
          "Your account is inactive. Please contact an administrator.",
      });
    }

    if (user.status !== "Active") {
      return res.status(403).json({
        message: "Your account is not authorized to access the CRM.",
      });
    }

    res.status(200).json({
      message: "Login successful.",
      token: generateToken(user._id),
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getProfile = async (req, res) => {
  res.status(200).json(req.user);
};