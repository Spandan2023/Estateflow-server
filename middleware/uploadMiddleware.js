import fs from "fs";
import path from "path";
import multer from "multer";

const uploadDirectory = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (req, file, callback) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;

    callback(null, uniqueName);
  },
});

const fileFilter = (req, file, callback) => {
  const allowedImageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  const allowedVideoTypes = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ];

  const isImageField = file.fieldname === "images";
  const isVideoField = file.fieldname === "video";

  if (isImageField && allowedImageTypes.includes(file.mimetype)) {
    return callback(null, true);
  }

  if (isVideoField && allowedVideoTypes.includes(file.mimetype)) {
    return callback(null, true);
  }

  callback(
    new Error(
      "Invalid file type. Upload JPG, JPEG, PNG, WEBP images or MP4, WEBM, MOV videos."
    )
  );
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

export const propertyUpload = upload.fields([
  {
    name: "images",
    maxCount: 10,
  },
  {
    name: "video",
    maxCount: 1,
  },
]);