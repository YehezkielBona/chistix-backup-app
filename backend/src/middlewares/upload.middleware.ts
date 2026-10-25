import multer from "multer";
import { AppError } from "../utils/AppError.js";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

export const uploadPaymentProof = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new AppError(400, "Format file harus JPG, PNG, atau WEBP"));
    }
    cb(null, true);
  },
}).single("paymentProof"); // nama field FormData di frontend