const multer = require("multer");
const ApiError = require("../utils/ApiError");

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_BYTES,
    files: 1,
  },

//  fileFilter: (req, file, cb) => {
//   if (file.mimetype !== "application/pdf") {
//     return cb(ApiError.badRequest("Only PDF files are accepted"));
//   }

//   cb(null, true);
// },

fileFilter: (req, file, cb) => {
  const isPdfMime =
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/octet-stream";

  const isPdfExtension = /\.pdf$/i.test(file.originalname);

  if (!isPdfMime || !isPdfExtension) {
    return cb(
      ApiError.badRequest(
        `Only PDF files are accepted. Received: ${file.mimetype}`
      )
    );
  }

  cb(null, true);
},
});

const uploadPdf = (field = "file") => {
  return (req, res, next) => {
    upload.single(field)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(
            ApiError.badRequest("PDF exceeds 5MB limit")
          );
        }

        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return next(
            ApiError.badRequest(
              `Unexpected file field. Expected "${field}"`
            )
          );
        }

        return next(ApiError.badRequest(err.message));
      }

      if (err) {
        return next(err);
      }

      if (!req.file) {
        return next(
          ApiError.badRequest("No PDF file uploaded")
        );
      }

      next();
    });
  };
};

module.exports = {
  uploadPdf,
};