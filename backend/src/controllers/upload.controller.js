import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import path from 'path';
import s3Client, { S3_BUCKET, S3_PUBLIC_URL } from '../config/r2.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * POST /api/admin/upload
 * Upload image to AWS S3
 */
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No image file provided', 400);
    }

    const folder = req.body.folder || 'products';
    const ext = path.extname(req.file.originalname) || '.jpg';
    const key = `${folder}/${randomUUID()}${ext}`;

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    const url = `${S3_PUBLIC_URL}/${key}`;

    successResponse(res, {
      url,
      publicId: key,
      size: req.file.size,
      mimetype: req.file.mimetype,
    }, 'Image uploaded');
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
