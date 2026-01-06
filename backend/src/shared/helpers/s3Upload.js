import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

class S3UploadHelper {
    static async uploadFile(file, folder = '') {
        try {
            if (!file || !file.buffer) {
                throw new Error('Invalid file object');
            }

            const fileName = generateFileName();
            const fileExtension = file.originalname.split('.').pop();
            const publicId = folder ? `${folder}/${fileName}` : `${fileName}`;

            const base64 = file.buffer.toString('base64');
            const dataUri = `data:${file.mimetype};base64,${base64}`;

            const result = await cloudinary.uploader.upload(dataUri, {
              folder: folder || undefined,
              public_id: publicId,
              resource_type: 'image',
              overwrite: true,
            });

            return {
              key: result.public_id,
              url: result.secure_url,
              fileName: file.originalname,
              size: file.size,
              mimetype: file.mimetype,
              uploadedAt: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Cloudinary upload error:', error);
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

    static extractKeyFromUrl(url) {
        if (!url) return null;
        if (!url.includes('http')) return url;
        const urlObj = new URL(url);
        return urlObj.pathname.substring(1);
    }
}

export default S3UploadHelper;
