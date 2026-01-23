const dotenv = require('dotenv');
const S3UploadHelper = require('../src/shared/helpers/s3Upload.js');

dotenv.config();

(async () => {
  console.log('Running Cloudinary test...');
  const res = await S3UploadHelper.testConnection();
  if (res.ok) {
    console.log('Cloudinary test succeeded:', res.public_id);
    process.exit(0);
  } else {
    console.error('Cloudinary test failed:', res.error);
    process.exit(2);
  }
})();
