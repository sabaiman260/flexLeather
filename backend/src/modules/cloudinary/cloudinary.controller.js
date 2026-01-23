const { asyncHandler } = require("../../core/utils/async-handler.js");
const { ApiResponse } = require("../../core/utils/api-response.js");
const S3UploadHelper = require("../../shared/helpers/s3Upload.js");
const { v2: cloudinary } = require("cloudinary");

// POST /signature
const signUpload = asyncHandler(async (req, res) => {
  // Accept optional folder in body or query
  const folder = (req.body && req.body.folder) || req.query.folder || undefined;

  const timestamp = Math.floor(Date.now() / 1000);

  // Build params to sign - only include folder if present
  const paramsToSign = folder ? { folder, timestamp } : { timestamp };

  if (!process.env.CLOUDINARY_API_SECRET) {
    return res.status(500).json(new ApiResponse(500, null, "Cloudinary API secret not configured"));
  }

  // Use cloudinary.utils.api_sign_request to produce signature server-side
  let signature;
  try {
    signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);
  } catch (err) {
    console.error('[cloudinary] signature generation failed', err?.message || err);
    return res.status(500).json(new ApiResponse(500, null, 'Failed to generate signature'));
  }

  const payload = {
    signature,
    api_key: process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    timestamp,
    folder: folder || undefined,
  };

  return res.status(200).json(new ApiResponse(200, payload, 'Signature generated'));
});

// GET /test
const testConnection = asyncHandler(async (_req, res) => {
  const result = await S3UploadHelper.testConnection();
  if (result.ok) {
    return res.status(200).json(new ApiResponse(200, { ok: true, public_id: result.public_id }, 'Cloudinary test succeeded'));
  }
  return res.status(500).json(new ApiResponse(500, { ok: false, error: result.error }, 'Cloudinary test failed'));
});

module.exports = { signUpload, testConnection };
