import multer from "multer";
import path from "path";
import { ApiError } from "./api-error.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + Date.now() + ext);
  },
});

const maxSize = 5 * 1000 * 1000;

const fileFilter = (req, file, cb) => {
  const filetypes = /csv/;
  const mimetype = filetypes.test(file.mimetype.toLowerCase());
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }

  cb(new ApiError(400, "Only .csv files are allowed"));
};

const uploadCsv = multer({
  storage,
  limits: { fileSize: maxSize },
  fileFilter,
});

export { uploadCsv };
