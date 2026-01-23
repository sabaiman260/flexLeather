const { v2: cloudinary } = require('cloudinary');
const crypto = require('crypto');
require('dotenv').config();
const { PassThrough } = require('stream');

// If a single CLOUDINARY_URL is provided, parse it into components when individual vars are missing
if (process.env.CLOUDINARY_URL) {
    try {
        const m = process.env.CLOUDINARY_URL.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
        if (m) {
            // Only set missing values to avoid overwriting explicit env vars
            if (!process.env.CLOUDINARY_API_KEY) process.env.CLOUDINARY_API_KEY = m[1];
            if (!process.env.CLOUDINARY_API_SECRET) process.env.CLOUDINARY_API_SECRET = m[2];
            if (!process.env.CLOUDINARY_CLOUD_NAME) process.env.CLOUDINARY_CLOUD_NAME = m[3];
            console.info('[s3Upload] parsed CLOUDINARY_URL into components (sensitive values masked in logs)');
        } else {
            console.warn('[s3Upload] CLOUDINARY_URL found but could not parse it');
        }
    } catch (e) {
        console.warn('[s3Upload] error parsing CLOUDINARY_URL', e?.message || e);
    }
}

// Ensure environment variables are loaded before configuring Cloudinary
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || null;
const CLOUD_API_KEY = process.env.CLOUDINARY_API_KEY || null;
const CLOUD_API_SECRET = process.env.CLOUDINARY_API_SECRET || null;

function maskSecret(v) {
    if (!v) return 'MISSING';
    if (v.length <= 6) return '***';
    return `${v.slice(0, 2)}***${v.slice(-2)}`;
}

console.info('[s3Upload] dotenv loaded - Cloudinary env presence:', {
    cloud_name: CLOUD_NAME || 'MISSING',
    api_key: CLOUD_API_KEY ? `present (len=${CLOUD_API_KEY.length})` : 'MISSING',
    api_secret: CLOUD_API_SECRET ? `present (len=${CLOUD_API_SECRET.length})` : 'MISSING',
});

cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUD_API_KEY,
    api_secret: CLOUD_API_SECRET,
});

const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

class S3UploadHelper {
    static async uploadFile(file, folder = '') {
        try {
            if (!file || (!file.buffer && !file.path)) {
                throw new Error('Invalid file object');
            }

            const fileName = generateFileName();
            const fileExtension = file.originalname ? file.originalname.split('.').pop() : '';
            const publicId = folder ? `${folder}/${fileName}` : `${fileName}`;

            // (validation done above)

                        // Use a configurable timeout for uploads to avoid hanging
                        const timeoutMs = Number(process.env.CLOUDINARY_UPLOAD_TIMEOUT_MS) || 30000;

                        // Decide upload strategy: disk path vs memory buffer
                        let uploadPromise;
                        if (file.path) {
                            console.info('[s3Upload] uploadFile using disk path:', file.path);
                            uploadPromise = cloudinary.uploader.upload(file.path, {
                                folder: folder || undefined,
                                public_id: publicId,
                                resource_type: 'image',
                                overwrite: true,
                            });
                        } else if (file.buffer) {
                            console.info('[s3Upload] uploadFile using memory buffer, size:', file.buffer.length);
                            uploadPromise = new Promise((resolve, reject) => {
                                const cb = (err, result) => {
                                    if (err) return reject(err);
                                    resolve(result);
                                };
                                // cloudinary's upload_stream expects a writable stream; create a PassThrough and pipe the buffer into it
                                try {
                                    const uploadStream = cloudinary.uploader.upload_stream({
                                        folder: folder || undefined,
                                        public_id: publicId,
                                        resource_type: 'image',
                                        overwrite: true,
                                    }, cb);

                                    const passthrough = new PassThrough();
                                    // Pipe the buffer into the upload stream
                                    passthrough.end(file.buffer);
                                    passthrough.pipe(uploadStream);
                                } catch (e) {
                                    return reject(e);
                                }
                            });
                        } else {
                            // Fallback to base64 upload (previous behavior) but log this path
                            console.info('[s3Upload] uploadFile falling back to base64 dataUri upload for file:', file?.originalname);
                            const base64 = file.buffer ? file.buffer.toString('base64') : '';
                            const dataUri = `data:${file.mimetype};base64,${base64}`;
                            uploadPromise = cloudinary.uploader.upload(dataUri, {
                                folder: folder || undefined,
                                public_id: publicId,
                                resource_type: 'image',
                                overwrite: true,
                            });
                        }

                        const timeoutPromise = new Promise((_, reject) => {
                            const t = setTimeout(() => {
                                clearTimeout(t);
                                const err = new Error(`Cloudinary upload timed out after ${timeoutMs}ms`);
                                err.name = 'UploadTimeoutError';
                                reject(err);
                            }, timeoutMs);
                        });

                        const result = await Promise.race([uploadPromise, timeoutPromise]);

            return {
              key: result.public_id,
              url: result.secure_url,
              fileName: file.originalname,
              size: file.size,
              mimetype: file.mimetype,
              uploadedAt: new Date().toISOString(),
            };
                } catch (error) {
                        // Richer logging: include file metadata and error details
                        try {
                            console.error('Cloudinary upload error for file:', {
                                originalname: file?.originalname,
                                size: file?.size,
                                mimetype: file?.mimetype,
                                folder,
                                errorMessage: error?.message,
                                errorStack: error?.stack,
                            });
                        } catch (logErr) {
                            console.error('Failed to log Cloudinary upload error details', logErr);
                        }
                        throw new Error(`File upload failed: ${error.message}`);
                }
    }

    static async uploadMultipleFiles(files, folder = '') {
        try {
            if (!Array.isArray(files)) {
                throw new Error('Files must be an array');
            }

            const uploadPromises = files.map(file => this.uploadFile(file, folder));
            return await Promise.all(uploadPromises);
        } catch (error) {
            console.error('Multiple files upload error:', error);
            throw new Error(`Multiple files upload failed: ${error.message}`);
        }
    }

    static async deleteFile(key) {
        try {
            if (!key) {
                throw new Error('File key is required');
            }

            await cloudinary.uploader.destroy(key, { invalidate: true });
            return { success: true, message: 'File deleted successfully' };
        } catch (error) {
            console.error('Cloudinary delete error:', error);
            throw new Error(`File deletion failed: ${error.message}`);
        }
    }

    static async deleteMultipleFiles(keys) {
        try {
            if (!Array.isArray(keys)) {
                throw new Error('Keys must be an array');
            }

            const deletePromises = keys.map(key => this.deleteFile(key));
            await Promise.all(deletePromises);
            return { success: true, message: 'Files deleted successfully' };
        } catch (error) {
            console.error('Multiple files delete error:', error);
            throw new Error(`Multiple files deletion failed: ${error.message}`);
        }
    }

    static async getSignedUrl(key, expiresIn = 3600) {
        try {
            if (!key) {
                throw new Error('File key is required');
            }

            const url = cloudinary.url(key, { secure: true });
            return url;
        } catch (error) {
            console.error('Signed URL generation error:', error);
            throw new Error(`Failed to generate signed URL: ${error.message}`);
        }
    }

    static async getFileMetadata(key) {
        try {
            const res = await cloudinary.api.resource(key);
            return {
              key,
              size: res.bytes,
              lastModified: res.created_at,
              contentType: res.resource_type,
              metadata: {
                format: res.format,
                width: res.width,
                height: res.height,
              },
            };
        } catch (error) {
            console.error('File metadata error:', error);
            throw new Error(`Failed to get file metadata: ${error.message}`);
        }
    }

    // Test Cloudinary upload & cleanup (manual diagnostic)
    static async testConnection() {
        const tinyPngDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
        const timeoutMs = Number(process.env.CLOUDINARY_UPLOAD_TIMEOUT_MS) || 15000;
        try {
            console.info('[s3Upload:test] starting cloudinary test upload (this will create & delete a tiny image)');
            const uploadPromise = cloudinary.uploader.upload(tinyPngDataUri, { folder: 'diagnostic', resource_type: 'image' });
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Cloudinary test upload timed out')), timeoutMs));
            const result = await Promise.race([uploadPromise, timeoutPromise]);
            const pubId = result?.public_id;
            console.info('[s3Upload:test] upload succeeded, public_id=', pubId);
            try {
                await cloudinary.uploader.destroy(pubId, { invalidate: true });
                console.info('[s3Upload:test] cleanup delete succeeded for', pubId);
            } catch (delErr) {
                console.warn('[s3Upload:test] cleanup delete failed for', pubId, delErr?.message || delErr);
            }
            return { ok: true, public_id: pubId };
        } catch (err) {
            console.error('[s3Upload:test] cloudinary test failed:', err?.message || err);
            return { ok: false, error: err?.message || String(err) };
        }
    }

    static extractKeyFromUrl(url) {
        if (!url) return null;
        if (!url.includes('http')) return url;
        const urlObj = new URL(url);
        return urlObj.pathname.substring(1);
    }
}

module.exports = S3UploadHelper;
