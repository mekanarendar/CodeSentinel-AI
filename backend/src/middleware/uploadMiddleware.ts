import multer from 'multer';
import type { Request } from 'express';
import { env } from '../config/env.ts';

// Use memory storage for fast, isolated processing without leaving orphaned files on disk
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.zip', '.tar', '.gz', '.js', '.ts', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.php', '.html', '.css', '.sql', '.json'];
  const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();

  if (allowedExtensions.includes(ext) || file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${ext}. Supported archive formats: .zip, or individual source files.`));
  }
};

export const uploadProjectArchive = multer({
  storage,
  limits: {
    fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024, // e.g. 25MB
    files: 1,
  },
  fileFilter,
});
