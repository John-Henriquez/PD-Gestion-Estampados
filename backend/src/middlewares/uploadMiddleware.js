import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w\-.]+/g, ""); 
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const finalName = `${name}-${uniqueSuffix}${ext}`.substring(0, 250);
    cb(null, finalName);
  },
});

const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml"
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, GIF, WEBP, SVG)."), false);
  }
};

const multerInstance = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 
  }
});

export const uploadMiddleware = {
  singleStampImage: multerInstance.single("stampImage"),

  arrayProductImages: multerInstance.array("productImages", 5),

  singleBaseImage: multerInstance.single("baseImage"),
};