import multer from "multer";
import path from "path";
import process from "process";
import fs from "fs";
import { InvariantError } from "../exceptions/index.js";

const dirToLogos = `${process.cwd()}/src/companies/uploads`;

if (!fs.existsSync(dirToLogos)) {
  fs.mkdirSync(dirToLogos, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, dirToLogos);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `logo-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

  if (!allowedTypes.includes(file.mimetype) || !allowedExts.includes(ext)) {
    return cb(new InvariantError("Hanya file gambar (JPG, PNG, WEBP, GIF) yang diperbolehkan."), false);
  }
  cb(null, true);
};

const logoUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // maksimal 2MB
});

export default logoUpload;
