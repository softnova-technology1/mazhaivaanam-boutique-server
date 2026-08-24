import { S3Client } from '@aws-sdk/client-s3';

/**
 * AWS S3 Configuration
 * Used for storing product images and other media
 */
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET || 'mazhaivaanam';
export const S3_PUBLIC_URL = process.env.AWS_S3_PUBLIC_URL || `https://${S3_BUCKET}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com`;

export default s3Client;
