import multer from 'multer';               //middleware for file upload,handle form-data 

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);       //cb(error, acceptFile);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, 
    }
});

const storeUpload = multer({ storage:storage, fileFilter:fileFilter }).fields([
  { name: "storeLogo", maxCount: 1 },
  { name: "storeCoverImage", maxCount: 1 },
  { name: "idCardImage", maxCount: 1 },
]);

const factoryUpload = multer({ storage:storage, fileFilter:fileFilter }).fields([
  { name: "factoryLogo", maxCount: 1 }, 
  { name: "factoryCoverImage", maxCount: 1 },
   { name: "factoryLicenseImage", maxCount: 1 }
]);

export { upload ,storeUpload,factoryUpload};