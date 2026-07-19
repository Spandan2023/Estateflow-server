import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import employeeRoutes from "./routes/employeeRoutes.js";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/employees", employeeRoutes);

app.get("/", (req, res) => {
  res.send("EstateFlow API Running...");
});

const PORT = process.env.PORT || 7000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});