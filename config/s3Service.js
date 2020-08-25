var multer = require("multer");
var multerS3 = require("multer-s3");
var logger = require("../middleware/logger");
const { v4: uuidv4 } = require("uuid");
const unique = uuidv4();
var s3 = require("./s3Conf");
logger.info("trying to config S3");
var s3Client = s3.s3Client;
const params = s3.uploadParams;
var filefilter = (req, file, cb) => {
    console.log(file.mimetype);
    if (
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/jpeg"
    ) {
        console.log(file);
        cb(null, true);
    } else {
        
        cb(new Error("Invalid file type, only jpg and png"), false);
    }
};
const upload = multer({
    limits: { fieldSize: 25 * 1024 * 1024 },
    fileFilter: filefilter,
    storage: multerS3({
        s3: s3Client,

        bucket: params.Bucket,
        acl: "public-read",
        metadata: function (req, file, cb) {
            cb(null, { fieldName: "Testing Metadata" });
        },
        key: function (req, file, cb) {
            cb(
                null,
                `profileImg/${Date.now().toString()}_${unique}_pimg.${
                    file.mimetype.split("/")[1]
                }`
            );
        },
    }),
});

module.exports = upload;
