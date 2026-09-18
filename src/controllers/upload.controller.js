import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import path from 'path';
import s3Client, { S3_BUCKET, S3_PUBLIC_URL } from '../config/r2.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import fs from 'fs';
import sharp from 'sharp';

/**
 * Convert any image buffer (incl. HEIC) → WebP buffer at 87% quality.
 * HEIC/HEIF: dynamically load heic-convert (pure JS decoder) → JPEG → WebP.
 * All other formats: sharp directly → WebP.
 */
async function toWebpBuffer(buffer, mimetype) {
  if (mimetype === 'image/heic' || mimetype === 'image/heif') {
    const heicConvert = (await import('heic-convert')).default;
    const jpegBuf = await heicConvert({ buffer, format: 'JPEG', quality: 1 });
    return sharp(Buffer.from(jpegBuf)).rotate().webp({ quality: 87 }).toBuffer();
  }
  return sharp(buffer, { failOnError: false }).rotate().webp({ quality: 87 }).toBuffer();
}

/**
 * POST /api/admin/upload
 * Upload image to AWS S3 (with local storage fallback)
 */
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No image file provided', 400);
    }

    const folder = req.body.folder || 'products';
    // Always store as .webp for universal browser compatibility
    const key = `${folder}/${randomUUID()}.webp`;

    // Convert to WebP (handles HEIC, JPG, PNG, etc.)
    const webpBuffer = await toWebpBuffer(req.file.buffer, req.file.mimetype);

    try {
      // Try Upload to S3
      await s3Client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
          Body: webpBuffer,
          ContentType: 'image/webp',
          CacheControl: 'max-age=31536000',
        })
      );

      const url = `${S3_PUBLIC_URL}/${key}`;

      return successResponse(res, {
        url,
        publicId: key,
        size: webpBuffer.length,
        mimetype: 'image/webp',
      }, 'Image uploaded to cloud');
    } catch (s3Err) {
      console.warn('AWS S3 upload failed/unconfigured. Falling back to local storage:', s3Err.message);

      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `${randomUUID()}.webp`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, webpBuffer);

      const host = req.get('host') || 'localhost:5000';
      const protocol = req.protocol || 'http';
      const url = `${protocol}://${host}/uploads/${filename}`;

      return successResponse(res, {
        url,
        publicId: filename,
        size: webpBuffer.length,
        mimetype: 'image/webp',
      }, 'Image uploaded locally');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/upload/:publicId
 * Delete image from AWS S3
 */
export const deleteImage = async (req, res, next) => {
  try {
    const { publicId } = req.params;

    // publicId is the S3 object key (may contain slashes for folders)
    const key = req.query.fullId || publicId;

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      })
    );

    successResponse(res, null, 'Image deleted');
  } catch (error) {
    next(error);
  }
};
